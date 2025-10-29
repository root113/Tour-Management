import type { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

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
            console.warn(`[prisma] require generated client at ${p} failed:`, (err as any)?.message ?? err);
        }
    }
    return null;
}

function requirePrismaClientModule(): any {
    const gen = requireGeneratedClient();
    if(gen) return gen;
    try {
        return require('@prisma/client');
    } catch(err) {
        throw err;
    }
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

    return new ClientCtor();
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

const lazyPrisma = new Proxy({}, handler) as unknown as PrismaClient;

export default lazyPrisma;
export { getPrisma };