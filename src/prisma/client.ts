import path from "path";
import fs from "fs";

import logger from "../lib/logger";
import { resolveError } from "../utils/error/errorFactory.util";

import type { PrismaClient } from "@prisma/client";

let _client: PrismaClient | null = null;

function requireGeneratedClient(): any | null {
    const generatedPath = path.join(process.cwd(), 'src', 'generated', 'prisma');
    const distGeneratedPath = path.join(process.cwd(), 'dist', 'src', 'generated', 'prisma');

    const tryPaths = [generatedPath, distGeneratedPath];
    for(const p of tryPaths) {
        try {
            if(!fs.existsSync(p)) continue;
            const gen = require(p);
            return gen;
        } catch(err) {
            logger.warn({ err: resolveError(err) }, `[prisma] require generated client at ${p} failed.`);
        }
    }
    return null;
}

function requirePrismaClientModule(): any {
    const gen = requireGeneratedClient();
    if(gen) return gen;
    try { return require('@prisma/client'); } 
    catch(err) { throw resolveError(err); }
}

function createPrismaClient(): PrismaClient {
    const mod = requirePrismaClientModule();

    //? The generated module shape may vary. Normalize to a constructor
    //? Typical shapes:
    //^ - module exports PrismaClient class directly
    //^ - module has .PrismaClient
    //^ - module.default exports the client factory
    //* Attempt common variants:
    const Candidate = 
        mod.PrismaClient ??
        mod.default?.PrismaClient ??
        mod.default ??
        mod;

    //* If Candidate itself is an object with PrismaClient property (rare), normalize:
    const ClientCtor = Candidate.PrismaClient ? Candidate.PrismaClient : Candidate;

    //* keep low noise by default, enable query logging only when debugging
    const LOG_LEVEL = (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')).toLocaleLowerCase();
    const enableQueryEvents = LOG_LEVEL === 'debug' || LOG_LEVEL === 'trace';
    const slowQueryThresholdMs = Number(process.env.PRISMA_SLOW_QUERY_MS ?? 200);

    // Prisma supports the `log` option (level + emit:'event') so we can use $on listeners
    // Include query events only when we plan to handle them (avoid unnecessary overhead)
    const logArray: any[] = [
        { level: 'warn', emit: 'event' },
        { level: 'error', emit: 'event' },
    ];
    if(enableQueryEvents) logArray.unshift({ level: 'query', emit: 'event' });

    const ctorArgs = { log: logArray };
    const client: any = new ClientCtor(ctorArgs);

    // helper to safely stringify params without producing huge log entries
    function safeSerializeParams(params: unknown, maxLen = 1000) {
        try {
            // avoid circular JSON issues
            const s = typeof params === 'string' ? params : JSON.stringify(params);
            if(!s) return s;
            return s.length > maxLen ? s.slice(0, maxLen) + '... (truncated)' : s;
        } catch(_) {
            try {
                // fallback via util.inspect could be used but keep it lightweight
                return String(params).slice(0, maxLen) + (String(params).length > maxLen ? '... (truncated)' : '');
            } catch { return '[unserializable params]'; }
        }
    }

    // wire up event handlers if client exposes $on (Prisma >= 2.12+)
    if(typeof client.$on === 'function') {
        client.$on('query', (e: any) => {
            // e has { query, params, duration, target } in modern Prisma
            try {
                const duration = typeof e.duration === 'number' ? e.duration : (e.elapsed ?? 0);
                const shouldLog = enableQueryEvents || (typeof duration === 'number' && duration >= slowQueryThresholdMs);

                if(!shouldLog) return;

                // when trace enabled, include params (truncated). Otherwise just log query & duration
                if(LOG_LEVEL === 'trace') {
                    logger.debug(
                        {
                            prisma: true,
                            query: e.query,
                            params: safeSerializeParams(e.params),
                            duration,
                            target: e.target,
                        },
                        `Prisma query (${duration}ms)`
                    );
                } else if(enableQueryEvents) {
                    // debug-mode, lighter-weight info
                    logger.info(
                        {
                            prisma: true,
                            duration,
                            query: e.query,
                            target: e.target,
                        },
                        `Prisma query (${duration}ms)`,
                    );
                } else {
                    // slow queries in production
                    logger.warn(
                        {
                            prisma: true,
                            duration,
                            query: e.query,
                            target: e.target,
                        },
                        `Prisma slow query (${duration}ms)`,
                    );
                }
            } catch(err) {
                // never allow logger issues to break app logic
                logger.debug({ err: resolveError(err) }, 'Error while logging prisma query!');
            }
        });

        client.$on('error', (e: any) => {
            // e typically has .message/.stack
            logger.error({ prisma: true, error: resolveError(e) }, 'Prisma runtime error');
        });
        client.$on('warn', (e: any) => {
            logger.warn({ prisma: true, warn: resolveError(e) }, 'Prisma warning');
        });

        if(enableQueryEvents) {
            client.$on('info', (e: any) => {
                logger.debug({ prisma: true, info: e }, 'Prisma info');
            });
        }
    }

    return client as PrismaClient;
}

function getPrisma(): PrismaClient {
    if(!_client) {
        _client = createPrismaClient();

        if(process.env.NODE_ENV !== 'production') {
            if(!(global as any).__prisma) {
                (global as any).__prisma = _client;
            } else {
                _client = (global as any).__prisma;
            }
        }
    }
    return _client;
}

/**
 *? Export a Proxy that forwards all property access to the real PrismaClient,
 *? and lazily instantiates it on first use. This allows existing imports like:
 *
 *^  import prisma from "./prisma/client";
 *^  await prisma.user.findMany();
 *
 *? ...to keep working without changing call sites.
*/
const handler: ProxyHandler<Record<string, unknown>> = {
    get(_, prop) {
        const client = getPrisma() as any;
        const value = client[prop];
        return typeof value === 'function' ? value.bind(client) : value;
    },
    set(_, prop, value) {
        const client = getPrisma() as any;
        client[prop] = value;
        return true;
    },
    has(_, prop) {
        const client = getPrisma() as any;
        return prop in client;
    },
};

export async function disconnectPrisma(): Promise<boolean> {
    try {
        const prismaInstance = typeof _client !== 'undefined' ? _client : null;
        if(prismaInstance && typeof (prismaInstance as any).$disconnect === 'function') {
            await (prismaInstance as any).$disconnect();
            logger.info('Prisma client disconnected');
            return true;
        } else {
            logger.info('Prisma client was not initialized, skipping disconnect');
            return false;
        }
    } catch(err) {
        logger.error({ err: resolveError(err) }, 'Error disconnecting Prisma client!');
        return false;
    }
}

const lazyPrisma = new Proxy({}, handler) as unknown as PrismaClient;

export default lazyPrisma;
export { getPrisma };