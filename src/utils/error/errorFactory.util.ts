import { ApiError, PrismaError, RedisError, ErrorInstance, AppErrorTypeScope } from "../../errors/ApiError";
import { classifyError } from "./errorClassification.util";

import type { RequestDetails } from "../../models/errors/requestDetails.types";
import type { PrismaErrorDetails, RedisErrorDetails } from "../../models/errors/errorDetails.types";

export function resolveError(error: any, requestDetails?: RequestDetails): AppErrorTypeScope {
    const classification = classifyError(error);
    const primary = classification.primary;

    if(error instanceof ApiError) return error as ApiError; 
    if(error instanceof PrismaError) return error as PrismaError;
    if(error instanceof RedisError) return error as RedisError;

    switch(primary) {
        case ErrorInstance.API:
            return apiGenericFactory(error, requestDetails);
        case ErrorInstance.PRISMA:
            return prismaErrorFactory(error, requestDetails);
        case ErrorInstance.REDIS:
            return redisErrorFactory(error, requestDetails);
        case ErrorInstance.PG:
            return postgresErrorFactory(error, requestDetails);
        case ErrorInstance.NODE_SYS:
            return nodeSysErrorFactory(error, requestDetails);
        case ErrorInstance.HTTP:
            return httpErrorFactory(error, requestDetails);
        case ErrorInstance.AGGREGATE:
            return aggregateErrorFactory(error, requestDetails);
        case ErrorInstance.NATIVE:
            return nativeErrorFactory(error, requestDetails);
        case ErrorInstance.UNCLASSIFIED:
            return unclassifiedErrorFactory(error, requestDetails);
        default:
            return unknownErrorObjectFacory(error, requestDetails);
    }
}

function apiGenericFactory(err: unknown, req?: RequestDetails): ApiError {
    const message = (err as any)?.message ?? 'Internal error'
    const status = (err as any)?.status ?? 500;
    const internalCause = (err as any)?.internalCause ?? (err as any)?.name ?? 'api_error';
    const code = (err as any)?.code;
    const cause = (err as any)?.cause ?? err;
    return new ApiError(message, status, ErrorInstance.API, internalCause, true, code, cause, req);
}

function prismaErrorFactory(err: unknown, req?: RequestDetails): PrismaError {
    const raw = err as any;
    const message = raw?.message ?? 'Prisma client error';
    const prismaCode = raw?.code as string | undefined;
    let status = 500;
    
    if(prismaCode === 'P2002') status = 409;
    if(prismaCode === 'P2025') status = 404;

    const prismaDetails: PrismaErrorDetails = {
        prismaClientErrType: raw,
        errorMessage: raw?.message ?? String(raw),
        clientVersion: raw?.clientVersion ?? '',
        prismaCode: prismaCode,
        meta: raw?.meta
    };
    const internalCause = raw?.name ?? 'prisma_error';
    const code = prismaCode ?? raw?.code ?? undefined;
    const cause = raw?.cause ?? raw;
    return new PrismaError(message, status, ErrorInstance.PRISMA, internalCause, true, prismaDetails, code, cause, req);
}

function redisErrorFactory(err: unknown, req?: RequestDetails): RedisError {
    const raw = err as any;
    const message = raw?.message ?? 'Redis error';
    let status = 503;
    
    const redisDetails: RedisErrorDetails = {
        name: raw?.name ?? String(raw?.constructor?.name ?? 'Redis error'),
        message: message ?? '',
        stack: raw?.stack,
        code: raw?.code,
        command: raw?.command ? { cmd: raw.command, args: raw.args } : undefined,
        conn: raw?.adress ? { adress: raw.adress, port: raw?.port } : undefined,
        parseContext: raw?.parseContext
    };
    const internalCause = raw?.name ?? 'redis_error';
    const code = raw?.code ?? undefined;
    const cause = raw ?? undefined;
    return new RedisError(message, status, ErrorInstance.REDIS, internalCause, true, redisDetails, code, cause, req);
}

function postgresErrorFactory(err: unknown, req?: RequestDetails): ApiError {
    const raw = err as any;
    const message = raw?.message ?? 'Database error';
    const sqlCode = raw?.code as string | undefined;
    
    let status = 500
    if(sqlCode === '23505') status = 409;

    const internalCause = raw?.name ?? 'pg_error';
    const code = sqlCode ?? raw?.code;
    const cause = raw ?? undefined;
    const reqDetails = {
        detail: raw?.detail,
        table: raw?.table,
        constraint: raw?.constraint,
        hint: raw?.hint
    };
    return new ApiError(message, status, ErrorInstance.PG, internalCause, true, code, cause, { ...reqDetails, req });
}

function nodeSysErrorFactory(err: unknown, req?: RequestDetails): ApiError {
    const raw = err as any;
    const message = raw?.message ?? 'System error';
    const code = raw?.code as string | undefined;
    const internalCause = String(code ?? raw?.name ?? 'node_sys_error');
    
    let status = 500;
    if(code === 'ENOENT') status = 404;
    if(code === 'EACCES' || code === 'EPERM') status = 403;
    if(/ECONNREFUSED|ETIMEDOUT|EPIPE|ENETUNREACH/.test(String(code ?? ''))) status = 502;

    return new ApiError(message, status, ErrorInstance.NODE_SYS, internalCause, true, code, raw, { syscall: raw?.syscall, path: raw?.path, req });
}

function httpErrorFactory(err: unknown, req?: RequestDetails): ApiError {
    const raw = err as any;
    const message = raw?.message ?? (raw?.response?.data?.message) ?? 'HTTP error';
    const status = (typeof raw?.status === 'number' ? raw.status : (typeof raw?.statusCode === 'number' ? raw.statusCode : (raw?.response?.status ?? 500)));
    const internalCause = raw?.name ?? 'http_error';
    const code = raw?.code ?? undefined;
    const cause = raw?.response ?? raw;
    const reqDetails = {
        headers: raw?.headers ?? raw?.response?.headers,
        body: raw?.response?.data ?? undefined
    };
    return new ApiError(message, status, ErrorInstance.HTTP, internalCause, true, code, cause, { ...reqDetails, req });
}

function aggregateErrorFactory(err: unknown, req?: RequestDetails): ApiError {
    const raw = err as any;
    const message = raw?.message && typeof raw?.message === 'string' ? raw.message : 'Aggregate error: multiple errors occured';
    const internalCause = raw?.name && typeof raw?.name === 'string' ? raw.name : 'aggregate_error';
    const cause = raw?.errors ?? raw;
    return new ApiError(message, 400, ErrorInstance.AGGREGATE, internalCause, true, undefined, cause, { length: Array.isArray(raw?.errors) ? raw.errors.length : undefined, req });
}

function nativeErrorFactory(err: unknown, req?: RequestDetails): ApiError {
    const raw = err as any;
    const message = raw?.message && typeof raw?.message === 'string' ? raw.message : 'Internal server error';
    const internalCause = raw?.name && typeof raw?.name === 'string' ? raw.name : 'native_error';
    const cause = raw;
    return new ApiError(message, 500, ErrorInstance.NATIVE, internalCause, false, raw?.code, cause, { stack: raw?.stack, req });
}

// fallback: unclassified error
function unclassifiedErrorFactory(err: unknown, req?: RequestDetails): ApiError {
    const message = (err as any)?.message && typeof (err as any).message === 'string' ? (err as any).message : 'Unknown error: error instance could not be classified';
    return new ApiError(message, 500, ErrorInstance.UNCLASSIFIED, 'unclassified_error', true, undefined, err, { req });
}

// fallback: unknown error object
function unknownErrorObjectFacory(err: unknown, req?: RequestDetails): ApiError {
    const message = 'Unknown error object (unable to map error properties)';
    return new ApiError(message, 500, ErrorInstance.UNKNOWN, 'unknown_error', true, undefined, err, { req });
}

export const __testInternals__ = {
    apiGenericFactory,
    prismaErrorFactory,
    redisErrorFactory,
    postgresErrorFactory,
    nodeSysErrorFactory,
    httpErrorFactory,
    aggregateErrorFactory,
    nativeErrorFactory,
    unclassifiedErrorFactory,
    unknownErrorObjectFacory
};