import { v4 as uuidv4 } from "uuid";
import app from "./app";
import logger from "./lib/logger";
import { resolveError } from "./utils/error/errorFactory.util";

import type { Server } from "http";

let server: Server | undefined;

export async function startServer(PORT = Number(process.env.APP_PORT)): Promise<Server> {
    return new Promise((resolve, reject) => {
        try {
            server = app.listen(PORT, () => {
                logger.info({ port: PORT }, 'Server is listening...');
                (server as any).keepAliveTimeout = 61_000;
                (server as any).headersTimeout = 65_000;
                resolve(server as Server);
            });

            server.on('error', (err) => {
                const mapped = resolveError(err);
                logger.error({ err: mapped, original: err }, 'Server error!');
                reject(mapped);
            });

        } catch(err) {
            const mapped = resolveError(err);
            logger.error({ err: mapped, original: err }, 'Failed starting server!');
            reject(mapped);
        }
    });
}

async function shutdown(exitCode = 0, reason?: string) {
    try {
        const id = uuidv4();
        logger.info({ id, reason }, 'Shutdown initiated');

        if(server) {
            await new Promise<void>((resolve) => {
                server!.close((err?: Error) => {
                    if(err) logger.warn({ err }, 'Error during process shutdown server');
                    resolve();
                });

                // safety: force exit after ms
                setTimeout(() => {
                    logger.warn({ id }, 'Forcing shutdown due to timeout...');
                    resolve();
                }, 10_000).unref();
            });
        }
        logger.info({ id, exitCode }, 'Shutdown complete; exiting...');
    } catch(logErr) { logger.error({ logErr }, 'Error during shutdown'); }
    finally { process.exit(exitCode); }
}

if(require.main === module) {
    process.on('unhandledRejection', (reason) => {
        try {
            const mapped = resolveError(reason);
            logger.error({ reason: mapped }, 'unhandledRejection - mapped');
            // unknown rejection: state might be inconsistent
            shutdown(1, 'unhandledRejection');
        } catch(err) {
            const mapped = resolveError(err);
            logger.error({ err: mapped, original: err }, 'Error while processing unhandledRejection');
            shutdown(1, 'unhandledRejection');
        }
    });

    process.on('uncaughtException', (error) => {
        try {
            const mapped = resolveError(error);
            logger.fatal({ error: mapped }, 'uncaughtException - exiting...');
        } catch(err) { logger.fatal({ err }, 'uncaughtException: failed to map error'); }
        finally { shutdown(1, 'uncaughtException'); }
    });

    startServer().catch((err) => {
        logger.error({ err }, 'Failed to start server!');
        setTimeout(() => process.exit(1), 100).unref();
    });
}