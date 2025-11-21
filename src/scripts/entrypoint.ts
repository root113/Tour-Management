import { Client } from "pg";
import type { Server } from "http";
import { startServer } from "../index";
import { spawnSync } from "child_process";

import { disconnectPrisma } from "../prisma/client";
import logger from "../lib/logger";

const MAX_RETRIES = 30;
const RETRY_DELAY_MS = 2000;

const GRACEFUL_SHUTDOWN_TIMEOUT_MS = Number(process.env.GRACEFUL_SHUTDOWN_TIMEOUT_MS || 30_000);
const PRISMA_DISCONNECT_TIMEOUT_MS = Number(process.env.PRISMA_DISCONNECT_TIMEOUT_MS || 10_000);

const SKIP_DB_WAIT = (process.env.SKIP_DB_WAIT || 'false').toLocaleLowerCase() === 'true';
const RUN_MIGRATIONS = (process.env.RUN_MIGRATIONS || 'false').toLocaleLowerCase() === 'true';

function getConnectionString(): string {
    if(process.env.DATABASE_URL) return process.env.DATABASE_URL;

    const USER = process.env.POSTGRES_USER;
    const PASSWORD = process.env.POSTGRES_PASSWORD;
    const HOST = 'db_pg_container';
    const PORT = process.env.PG_PORT;
    const DB = process.env.POSTGRES_DB;

    return `postgresql://${USER}:${encodeURIComponent(PASSWORD!)}@${HOST}:${PORT}/${DB}`;
}

async function waitForPostgres() {
    const conn = getConnectionString();
    
    for(let i=0; i<MAX_RETRIES; i++) {
        try {
            const client = new Client({ connectionString: conn });
            await client.connect();
            await client.query('SELECT 1');
            await client.end();
            const attempt = i+1;
            logger.info({ attempt }, 'Postgres is ready');
            return;
        } catch(err) {
            // TODO: replace with a convenient error handler
            const attempt = i+1;
            logger.warn({ attempt, err }, `Postgres not ready yet, retrying in ${RETRY_DELAY_MS}ms...`);
            await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
        }
    }
    // TODO: replace with custom error handler
    throw new Error('Postgres did not become ready in time!');
}

function runMigrationsSyncIfConfigured() {
    if(!RUN_MIGRATIONS) {
        logger.info({ RUN_MIGRATIONS }, 'Skipping in-container migrations');
        return;
    }

    logger.info({ RUN_MIGRATIONS }, 'Applying migrations synchronously...');
    const res = spawnSync('npx', ['prisma', 'migrate', 'deploy'], {
        stdio: 'inherit',
        shell: false,
    });

    if(res.error) {
        logger.error({ err: res.error }, 'An error has occured during migrations!');
        throw res.error; //TODO: better error handling
    }
    if(res.status !== 0) {
        logger.debug({ status: res.status }, `prisma migrate deploy exited with status ${res.status}`);
        throw new Error('Migration error!');
    }
    logger.info('Migrations applied successfully');
}

let serverInstance: Server | null = null;
let shuttingDown = false;
let forceExitTimer: NodeJS.Timeout | null = null;

// track sockets to forcibly close lingering keep-alive sockets
const liveSockets = new Set<any>();

async function gracefulShutdown(signal: string) {
    if(shuttingDown) {
        logger.warn({ signal }, 'Second shutdown signal received. Forcing exit...');
        process.exit(1);
    }

    shuttingDown = true;
    logger.info({ signal }, 'Graceful shutdown initiated');

    // ensure to force exit if graceful shutdown hangs beyond the timer
    forceExitTimer = setTimeout(() => {
        logger.error('Graceful shutdown timedout. Destroying sockets and exiting...');
        for(const s of Array.from(liveSockets)) {
            try { s.destroy(); } catch(e) { logger.warn({ s, e }, 'Error destroying socket'); }
        }
        process.exit(1);
    }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);

    try {
        // stop accepting new connections
        if(serverInstance) {
            await new Promise<void>((resolve) => {
                serverInstance!.close((e?: Error) => {
                    if(e) logger.error({ e }, 'Error closing server!');
                    else logger.info('HTTP server closed and no longer accepting new connections');
                    resolve();
                });
            });
        }

        // disconnect Prisma
        try {
            const prismaDisconnectPromise = disconnectPrisma();
            const disconnected = await Promise.race([
                prismaDisconnectPromise,
                new Promise<boolean>((_, rej) => setTimeout(() => rej(new Error('Prisma disconnect timout')), PRISMA_DISCONNECT_TIMEOUT_MS)),
            ]);

            if(disconnected === true) logger.info('Prisma disconnected successfully');
            else { logger.info('Prisma was not initialized or already disconnected'); }
        } catch(err) {
            logger.warn({ err }, 'Prisma did not cleanly disconnected within timeout');
        }

        // close remaining sockets
        for(const s of Array.from(liveSockets)) {
            try { s.destroy(); } catch(e) { logger.warn({ s, e }, 'Error destroying socket'); }
        }

        logger.info('Shutdown sequence complete, exiting with code 0');
        if(forceExitTimer) clearTimeout(forceExitTimer);
        process.exit(0);
    } catch(error) {
        logger.error({ error }, 'Error during graceful shutdown!');
        if(forceExitTimer) clearTimeout(forceExitTimer);
        process.exit(1);
    }
}

async function start() {

    // handle uncaught exceptions/rejections for visibility and try shutdown gracefully
    process.on('unhandledRejection', (reason) => {
        logger.error({ reason }, 'Unhandled Rejection: initiating graceful shutdown...');
        void gracefulShutdown('unhandledRejection');
    });
    process.on('uncaughtException', (err) => {
        logger.fatal({ err }, 'Uncaught Exception: initiating graceful shutdown...');
        void gracefulShutdown('uncaughtException');
    });

    if(!SKIP_DB_WAIT) {
        logger.info({ SKIP_DB_WAIT }, 'Waiting for DB readiness checks');
        await waitForPostgres();
    }
    else logger.info({ SKIP_DB_WAIT }, 'Skipping DB readiness checks');

    if(RUN_MIGRATIONS) runMigrationsSyncIfConfigured();

    const server = await startServer();
    serverInstance = server;

    // attach socket-tracking to force close keep-alive sockets on shutdown
    server.on('connection', (socket: any) => {
        liveSockets.add(socket);
        socket.on('close', () => liveSockets.delete(socket));
    });

    logger.info('App started and listening...');

    // install signal handlers in the entrypoint (container-friendly)
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGQUIT', 'SIGHUP'] as NodeJS.Signals[];
    signals.forEach((sig) => {
        process.once(sig, () => {
            void gracefulShutdown(sig);
        });
    });
}

start().catch((err) => {
    // TODO: optionally, implement custom error handler
    logger.error({ err }, 'Failed to start process!');
    process.exit(1);
});