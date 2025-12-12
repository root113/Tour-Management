import type { PrismaErrorDetails, RedisErrorDetails } from "../models/errors/errorDetails.types";

export enum ErrorInstance {
    API = 'API_ERROR',
    PRISMA = 'PRISMA_ERROR',
    REDIS = 'REDIS_ERROR',
    PG = 'POSTGRES_ERROR',
    NODE_SYS = 'NODE_SYSTEM_ERROR',
    HTTP = 'HTTP_ERROR',
    AGGREGATE = 'AGGREGATE_ERROR',
    NATIVE = 'NATIVE_ERROR',
    UNCLASSIFIED = 'UNCLASSIFIED_ERROR',
    UNKNOWN = 'UNKNOWN_ERROR'
}

export type AppErrorTypeScope = ApiError | PrismaError | RedisError;

export class ApiError extends Error {
    public readonly status: number;
    public readonly instance: ErrorInstance | string;
    public readonly internalCause: string;
    public readonly isOperational: boolean;
    public readonly code?: string | undefined;
    public readonly cause?: unknown;
    public readonly reqDetails?: unknown;

    constructor(
        message: string,
        status: number,
        instance: ErrorInstance | string,
        internalCause: string,
        isOperational: boolean,
        code?: string,
        cause?: unknown,
        reqDetails?: unknown
    ) {
        super(message);

        Object.setPrototypeOf(this, new.target.prototype);
        this.name = this.constructor.name;

        this.status = status;
        this.instance = instance;
        this.internalCause = internalCause;
        this.isOperational = isOperational;
        this.code = code;
        this.cause = cause;
        this.reqDetails = reqDetails;
        
        Object.defineProperty(this, 'message', {
            value: message,
            enumerable: true,
            configurable: true,
            writable: true
        });

        Object.defineProperty(this, 'errorInfo', {
            value: this.constructor.name,
            enumerable: false,
            configurable: true
        });
        Error.captureStackTrace?.(this, this.constructor);
    }
}

export class PrismaError extends ApiError {
    public readonly prismaDetails: PrismaErrorDetails;
    constructor(
        message: string,
        status: number,
        instance: ErrorInstance | string,
        internalCause: string,
        isOperational: boolean,
        prismaDetails: PrismaErrorDetails,
        code?: string,
        cause?: unknown,
        reqDetails?: unknown
    ) {
        super(message, status, instance, internalCause, isOperational, code, cause, reqDetails);
        this.prismaDetails = prismaDetails;
    }
}

export class RedisError extends ApiError {
    public readonly redisDetails: RedisErrorDetails;
    constructor(
        message: string,
        status: number,
        instance: ErrorInstance | string,
        internalCause: string,
        isOperational: boolean,
        redisDetails: RedisErrorDetails,
        code?: string,
        cause?: unknown,
        reqDetails?: unknown
    ) {
        super(message, status, instance, internalCause, isOperational, code, cause, reqDetails);
        this.redisDetails = redisDetails;
    }
}