import {
    ErrorInstance,
    ApiError,
    PrismaError,
    RedisError,
    type AppErrorTypeScope
} from '../../../src/errors/ApiError';

type MockPrismaErrorDetails = {
    prismaClientErrType: any,
    errorMessage: string,
    clientVersion: string,
    prismaCode?: string | undefined,
    meta?: any,
};

type MockRedisErrorDetails = {
    name: string,
    message: string,
    stack?: string,
    code?: string,
    command?: { cmd: string, args?: any[] },
    conn?: { adress?: string, port?: number } | undefined,
    parseContext?: { buffer?: string, offset?: number }
};

describe('ErrorInstance Enum', () => {
    
    test('should have correct values', () => {
        expect(ErrorInstance.API).toBe('API_ERROR');
        expect(ErrorInstance.PRISMA).toBe('PRISMA_ERROR');
        expect(ErrorInstance.REDIS).toBe('REDIS_ERROR');
        expect(ErrorInstance.PG).toBe('POSTGRES_ERROR');
        expect(ErrorInstance.NODE_SYS).toBe('NODE_SYSTEM_ERROR');
        expect(ErrorInstance.HTTP).toBe('HTTP_ERROR');
        expect(ErrorInstance.AGGREGATE).toBe('AGGREGATE_ERROR');
        expect(ErrorInstance.NATIVE).toBe('NATIVE_ERROR');
        expect(ErrorInstance.UNCLASSIFIED).toBe('UNCLASSIFIED_ERROR');
        expect(ErrorInstance.UNKNOWN).toBe('UNKNOWN_ERROR');
    });

    test('should have all expected enum numbers', () => {
        const expectedValues = [
            'API_ERROR',
            'PRISMA_ERROR',
            'REDIS_ERROR',
            'POSTGRES_ERROR',
            'NODE_SYSTEM_ERROR',
            'HTTP_ERROR',
            'AGGREGATE_ERROR',
            'NATIVE_ERROR',
            'UNCLASSIFIED_ERROR',
            'UNKNOWN_ERROR'
        ];
        const enumValues = Object.values(ErrorInstance);

        expect(enumValues).toEqual(expect.arrayContaining(expectedValues));
        expect(enumValues.length).toBe(expectedValues.length);
    });
});

describe('ApiError Class', () => {
    
    describe('constructor', () => {
        
        it('should create ApiError with all required params', () => {
            const error = new ApiError(
                'test message',
                400,
                ErrorInstance.API,
                'test internal cause',
                true
            );

            expect(error.message).toBe('test message');
            expect(error.status).toBe(400);
            expect(error.instance).toBe(ErrorInstance.API);
            expect(error.internalCause).toBe('test internal cause');
            expect(error.isOperational).toBe(true);
            expect(error.code).toBeUndefined();
            expect(error.cause).toBeUndefined();
            expect(error.reqDetails).toBeUndefined();
        });

        it('should create ApiError with all params including optional', () => {
            const cause = new Error('test cause');
            const reqDetails = {
                requestId: 'test req id',
                method: 'test method GET/',
                endpoint: 'unit test endpoint',
                timestamp: 'test timestamp'
            };
            const error = new ApiError(
                'test error message',
                422,
                ErrorInstance.HTTP,
                'test error internal cause',
                true,
                'test error code',
                cause,
                reqDetails
            );

            expect(error.message).toBe('test error message');
            expect(error.status).toBe(422);
            expect(error.instance).toBe(ErrorInstance.HTTP);
            expect(error.internalCause).toBe('test error internal cause');
            expect(error.isOperational).toBe(true);
            expect(error.code).toBe('test error code');
            expect(error.cause).toBe(cause);
            expect(error.reqDetails).toEqual(reqDetails);
        });

        it('should accept custom string as instance', () => {
            const error = new ApiError('test error message', 500, 'test error custom instance', 'test internalCause', false);
            expect(error.instance).toBe('test error custom instance');
        });

        it('should set errorInfo property as non-enumerable', () => {
            const error = new ApiError('test_message', 500, ErrorInstance.API, 'test_internalCause', true);
            expect((error as any).errorInfo).toBe('ApiError');
            expect(Object.keys(error)).not.toContain('errorInfo');

            const propertyDesc = Object.getOwnPropertyDescriptor(error, 'errorInfo');
            expect(propertyDesc?.enumerable).toBe(false);
            expect(propertyDesc?.configurable).toBe(true);
        });

        it('should capture stack trace when available', () => {
            const originalCaptureStackTrace = Error.captureStackTrace;
            const mockCapture = jest.fn();
            Error.captureStackTrace = mockCapture;
            const error = new ApiError('test_message', 500, ErrorInstance.API, 'test_internalCause', true);

            expect(mockCapture).toHaveBeenCalledWith(error, error.constructor);

            Error.captureStackTrace = originalCaptureStackTrace;
        });

        it('should handle when Error.captureStackTrace is undefined', () => {
            const originalCaptureStackTrace = Error.captureStackTrace;
            (Error as any).captureStackTrace = undefined;

            expect(() => {
                new ApiError('test_message', 500, ErrorInstance.API, 'test_internalCause', true);
            }).not.toThrow();

            Error.captureStackTrace = originalCaptureStackTrace;
        });

        it('should be instance of Error & ApiError', () => {
            const error = new ApiError('test_message', 500, ErrorInstance.API, 'test_internalCause', true);
            expect(error).toBeInstanceOf(Error);
            expect(error).toBeInstanceOf(ApiError);
            expect(error.constructor.name).toBe('ApiError');
        });

        it('should have correct prototype chain', () => {
            const error = new ApiError('msg', 500, ErrorInstance.API, 'internal cause', false);
            expect(Object.getPrototypeOf(error)).toBe(ApiError.prototype);
            expect(Object.getPrototypeOf(Object.getPrototypeOf(error))).toBe(Error.prototype);
        });
    });

    describe('properties', () => {
        
        it('should have optional properties that can be undefined', () => {
            const error = new ApiError('msg', 404, ErrorInstance.PRISMA, 'not_found', true);
            expect(error.code).toBeUndefined();
            expect(error.cause).toBeUndefined();
            expect(error.reqDetails).toBeUndefined();
        });

        it('should preserve optional properties when provided', () => {
            const cause = { some: 'cause' };
            const reqDetails = {
                requestId: 'id',
                method: 'GET/ ',
                endpoint: '/some/endpoint',
                timestamp: '15/03/1998-23:43:73',
                params: { first: 'something', second: 'second' },
                query: { first: 'foo', second: 'doo' },
                requestBody: { obj: { id: '123', name: 'dummy', role: 'conky' } },
                userAgent: 'Postman_test_v1.17'
            };
            const error = new ApiError(
                'message',
                500,
                ErrorInstance.API,
                'internal_cause',
                true,
                'code',
                cause,
                reqDetails
            );

            expect(error.code).toBe('code');
            expect(error.cause).toBe(cause);
            expect(error.reqDetails).toEqual(reqDetails);

            expect((error.reqDetails as any).requestId).toBe('id');
            expect((error.reqDetails as any).method).toBe('GET/ ');
            expect((error.reqDetails as any).endpoint).toBe('/some/endpoint');
            expect((error.reqDetails as any).timestamp).toBe('15/03/1998-23:43:73');
            expect((error.reqDetails as any).params).toEqual({ first: 'something', second: 'second' });
            expect((error.reqDetails as any).query).toEqual({ first: 'foo', second: 'doo' });
            expect((error.reqDetails as any).requestBody).toEqual({ obj: { id: '123', name: 'dummy', role: 'conky' } });
            expect((error.reqDetails as any).userAgent).toBe('Postman_test_v1.17');
        });
    });

    describe('edge cases', () => {
        
        it('should handle empty string message', () => {
            const error = new ApiError('', 500, ErrorInstance.API, 'test', true);
            expect(error.message).toBe('');
        });

        it('should handle zero status codes', () => {
            const error = new ApiError('msg', 0, ErrorInstance.API, 'test', true);
            expect(error.status).toBe(0);
        });

        it('should handle negative status codes', () => {
            const error = new ApiError('msg', -1, ErrorInstance.API, 'test', true);
            expect(error.status).toBe(-1);
        });

        it('should handle non-standard status codes', () => {
            const error = new ApiError('msg', 9999, ErrorInstance.API, 'test', true);
            expect(error.status).toBe(9999);
        });

        it('should handle boolean isOperational values', () => {
            const trueError = new ApiError('msg', 500, ErrorInstance.API, 'test', true);
            const falseError = new ApiError('msg', 500, ErrorInstance.API, 'test', false);
            expect(trueError.isOperational).toBe(true);
            expect(falseError.isOperational).toBe(false);
        });

        it('should handle null and undefined for optional params', () => {
            const error1 = new ApiError(
                'msg', 
                500, 
                ErrorInstance.API, 
                'test', 
                true,
                undefined,
                undefined,
                undefined
            );
            const error2 = new ApiError(
                'msg', 
                500, 
                ErrorInstance.API, 
                'test', 
                true,
                null as any,
                null as any,
                null as any
            );

            expect(error1.code).toBeUndefined();
            expect(error1.cause).toBeUndefined();
            expect(error1.reqDetails).toBeUndefined();

            expect(error2.code).toBeNull();
            expect(error2.cause).toBeNull();
            expect(error2.reqDetails).toBeNull();
        });
    });

    describe('serialization', () => {
        
        it('should serialize to JSON with all properties', () => {
            const error = new ApiError('msg', 400, ErrorInstance.HTTP, 'test', true, 'code');
            const json = JSON.parse(JSON.stringify(error));

            expect(json.message).toBe('msg');
            expect(json.status).toBe(400);
            expect(json.instance).toBe(ErrorInstance.HTTP);
            expect(json.internalCause).toBe('test');
            expect(json.isOperational).toBe(true);
            expect(json.code).toBe('code');
        });

        it('should not include errorInfo in JSON stringify', () => {
            const error = new ApiError('msg', 500, ErrorInstance.NATIVE, 'internal', true);
            const json = JSON.stringify(error);
            expect(json).not.toContain('errorInfo');
        });

        it('should have toString that includes message', () => {
            const error = new ApiError('msg', 500, ErrorInstance.NODE_SYS, 'test', true);
            expect(error.toString()).toContain('msg');
            expect(error.toString()).toContain('ApiError');
        });
    });

    describe('inheritance', () => {

        it('should inherit from Error', () => {
            const error = new ApiError('msg', 500, ErrorInstance.NODE_SYS, 'test', true);
            expect(error).toBeInstanceOf(Error);
            expect(Object.getPrototypeOf(error)).toBe(ApiError.prototype);
            expect(Object.getPrototypeOf(ApiError.prototype)).toBe(Error.prototype);
        });

        it('should have Error properties (name, stack)', () =>  {
            const error = new ApiError('msg', 500, ErrorInstance.NODE_SYS, 'test', true);
            expect(error.name).toBe('Error');
            if(error.stack) {
                expect(typeof error.stack).toBe('string');
                expect(error.stack).toContain('ApiError');
            }
        });
    });
});

describe('PrismaError Class', () => {
    const mockPrismaDetails: MockPrismaErrorDetails = {
        prismaClientErrType: 'PrismaClientKnownRequestError',
        errorMessage: 'msg',
        clientVersion: 'v1.18.5'
    };

    describe('constructor & inheritance', () => {
        
        it('should create PrismaError with prismaDetails', () => {
            const error = new PrismaError('msg', 400, ErrorInstance.PRISMA, 'test', true, mockPrismaDetails as any);
            expect(error.message).toBe('msg');
            expect(error.status).toBe(400);
            expect(error.instance).toBe(ErrorInstance.PRISMA);
            expect(error.internalCause).toBe('test');
            expect(error.isOperational).toBe(true);
            expect(error.prismaDetails).toEqual(mockPrismaDetails);
            expect(error).toBeInstanceOf(PrismaError);
            expect(error).toBeInstanceOf(ApiError);
            expect(error).toBeInstanceOf(Error);
        });

        it('should inherit all ApiError properties', () => {
            const cause = new Error('test error');
            const error = new PrismaError(
                'msg', 
                500, 
                ErrorInstance.PRISMA, 
                'test', 
                false, 
                mockPrismaDetails as any, 
                'code', 
                cause
            );

            expect(error.status).toBe(500);
            expect(error.internalCause).toBe('test');
            expect(error.isOperational).toBe(false);
            expect(error.code).toBe('code');
            expect(error.cause).toBe(cause);
        });

        it('should set errorInfo to PrismaError', () => {
            const error = new PrismaError('msg', 400, ErrorInstance.PRISMA, 'test', true, mockPrismaDetails as any);
            expect((error as any).errorInfo).toBe('PrismaError');
        });
    });

    describe('prismaDetails property', () => {

        it('should handle empty prismaDetails', () => {
            const emptyDetails = {};
            const error = new PrismaError('msg', 400, ErrorInstance.PRISMA, 'test', true, emptyDetails as any);
            expect(error.prismaDetails).toEqual({});
        });

        it('should handle prismaDetails with only required params', () => {
            const error = new PrismaError('msg', 400, ErrorInstance.PRISMA, 'test', true, mockPrismaDetails as any);
            expect(error.prismaDetails.prismaClientErrType).toBe('PrismaClientKnownRequestError');
            expect(error.prismaDetails.errorMessage).toBe('msg');
            expect(error.prismaDetails.clientVersion).toBe('v1.18.5');
            expect(error.prismaDetails.prismaCode).toBeUndefined();
            expect(error.prismaDetails.meta).toBeUndefined();
        });

        it('should handle prismaDetails with optional params', () => {
            const prismaDetails: MockPrismaErrorDetails = {
                prismaClientErrType: 'PrismaClientUnknownRequestError',
                errorMessage: 'msg',
                clientVersion: 'v1.18.5',
                prismaCode: 'P2025',
                meta: { stack: '<stack>', arg: '<argument>' }
            };
            const error = new PrismaError('msg', 400, ErrorInstance.PRISMA, 'test', true, prismaDetails as any);
            
            expect(error.prismaDetails.prismaClientErrType).toBe('PrismaClientUnknownRequestError');
            expect(error.prismaDetails.errorMessage).toBe('msg');
            expect(error.prismaDetails.clientVersion).toBe('v1.18.5');
            expect(error.prismaDetails.prismaCode).toBe('P2025');
            expect(error.prismaDetails.meta).toEqual({ stack: '<stack>', arg: '<argument>' });
        });
    });

    describe('type checking', () => {

        it('should be assignable to AppErrorTypeScope type', () => {
            const error: AppErrorTypeScope = new PrismaError('msg', 500, ErrorInstance.PRISMA, 'internal', true, mockPrismaDetails as any);
            expect(error).toBeInstanceOf(PrismaError);
        });

        it('should have proper TypeScript type inference', () => {
            const error = new PrismaError('msg', 500, ErrorInstance.PRISMA, 'internal', true, mockPrismaDetails as any);
            
            // these should compile without TypeScript error
            const message: string = error.message;
            const status: number = error.status;
            const prismaDetails: any = error.prismaDetails;

            expect(message).toBe('msg');
            expect(status).toBe(500);
            expect(prismaDetails).toEqual(mockPrismaDetails);
        });
    });
});

describe('RedisError Class', () => {
    const mockRedisDetails: MockRedisErrorDetails = {
        name: 'redis error name',
        message: 'redis msg'
    };

    describe('constructor & inheritance', () => {

        it('should create RedisError with redisDetails', () => {
            const error = new RedisError('msg', 503, ErrorInstance.REDIS, 'internal', true, mockRedisDetails as any);
            expect(error.message).toBe('msg');
            expect(error.status).toBe(503);
            expect(error.instance).toBe(ErrorInstance.REDIS);
            expect(error.internalCause).toBe('internal');
            expect(error.isOperational).toBe(true);
            expect(error.redisDetails).toEqual(mockRedisDetails);
            
            expect(error).toBeInstanceOf(RedisError);
            expect(error).toBeInstanceOf(ApiError);
            expect(error).toBeInstanceOf(Error);
        });

        it('should inherit all ApiError properties', () => {
            const cause = new Error('issue');
            const error = new RedisError('msg', 503, ErrorInstance.REDIS, 'failed', true, mockRedisDetails as any, 'code', cause);

            expect(error.message).toBe('msg');
            expect(error.status).toBe(503);
            expect(error.instance).toBe(ErrorInstance.REDIS);
            expect(error.internalCause).toBe('failed');
            expect(error.isOperational).toBe(true);
            expect(error.code).toBe('code');
            expect(error.cause).toBe(cause);
            expect(error.redisDetails).toBeUndefined();
        });

        it('should set errorInfo to RedisError', () => {
            const error = new RedisError('msg', 500, ErrorInstance.REDIS, 'internal', true, mockRedisDetails as any);
            expect((error as any).errorInfo).toBe('RedisError');
        });
    });

    describe('redisDetails property', () => {

        it('should handle empty redisDetails', () => {
            const emptyDetails = {};
            const error = new RedisError('msg', 500, ErrorInstance.REDIS, 'internal', true, emptyDetails as any);
            expect(error.redisDetails).toEqual({});
        });

        it('should handle redisDetails with only required params', () => {
            const error = new RedisError('msg', 500, ErrorInstance.REDIS, 'internal', true, mockRedisDetails as any);
            expect(error.redisDetails.name).toBe('redis error name');
            expect(error.redisDetails.message).toBe('redis msg');
            expect(error.redisDetails.stack).toBeUndefined();
            expect(error.redisDetails.code).toBeUndefined();
            expect(error.redisDetails.command).toBeUndefined();
            expect(error.redisDetails.conn).toBeUndefined();
            expect(error.redisDetails.parseContext).toBeUndefined();
        });

        it('should handle redisDetails with all params including optionals', () => {
            const redisDetails = {
                name: 'err name',
                message: 'err msg',
                stack: 'err stack',
                code: 'err code',
                command: { cmd: 'command', args: { first: 'a', second: 'b' } },
                conn: { adress: 'adress', port: 5054 },
                parseContext: { buffer: 'buffer', offset: 13 }
            };
            const error = new RedisError('msg', 500, ErrorInstance.REDIS, 'internal', true, redisDetails as any);

            expect(error.redisDetails.name).toBe('err name');
            expect(error.redisDetails.message).toBe('err msg');
            expect(error.redisDetails.stack).toBe('err stack');
            expect(error.redisDetails.code).toBe('err code');
            expect(error.redisDetails.command).toEqual({ cmd: 'command', args: { first: 'a', second: 'b' } });
            expect(error.redisDetails.conn).toEqual({ adress: 'adress', port: 5054 });
            expect(error.redisDetails.parseContext).toEqual({ buffer: 'buffer', offset: 13 });
        });
    });

    describe('type checking', () => {

        it('should be assignable to AppErrorTypeScope type', () => {
            const error: AppErrorTypeScope = new RedisError('msg', 500, ErrorInstance.REDIS, 'internal', true, mockRedisDetails as any);
            expect(error).toBeInstanceOf(RedisError);
        });

        it('should have proper TypeScript type inference', () => {
            const error = new RedisError('msg', 500, ErrorInstance.REDIS, 'internal', true, mockRedisDetails as any);

            // these should compile without TypeScript errors
            const message: string = error.message;
            const status: number = error.status;
            const redisDetails: any = error.redisDetails;

            expect(message).toBe('msg');
            expect(status).toBe(500);
            expect(redisDetails).toEqual(mockRedisDetails);
        });
    });
});

describe('Type Compatibility & Polymorphism', () => {

    test('AppErrorTypeScope should accept all three error types', () => {
        const apiError: AppErrorTypeScope = new ApiError('api error', 500, ErrorInstance.API, 'failed', true);
        const prismaError: AppErrorTypeScope = new PrismaError('prisma error', 500, ErrorInstance.PRISMA, 'prisma failed', true, { prsimaClientErrType: 'PrismaClientRustError', errorMessage: 'err msg', clientVersion: 'v4.18.2' } as any);
        const redisError: AppErrorTypeScope = new RedisError('redis error', 500, ErrorInstance.REDIS, 'redis failed', true, { name: 'err name', message: 'err msg' } as any);

        expect(apiError).toBeInstanceOf(ApiError);
        expect(prismaError).toBeInstanceOf(PrismaError);
        expect(redisError).toBeInstanceOf(RedisError);
    });

    test('All errors should be assignable to ApiError type', () => {
        const apiError: ApiError = new ApiError('api error', 500, ErrorInstance.API, 'failed', true);
        const prismaError: ApiError = new PrismaError('prisma error', 500, ErrorInstance.PRISMA, 'prisma failed', true, { prsimaClientErrType: 'PrismaClientRustError', errorMessage: 'err msg', clientVersion: 'v4.18.2' } as any);
        const redisError: ApiError = new RedisError('redis error', 500, ErrorInstance.REDIS, 'redis failed', true, { name: 'err name', message: 'err msg' } as any);

        expect(apiError).toBeInstanceOf(ApiError);
        expect(prismaError).toBeInstanceOf(ApiError);
        expect(redisError).toBeInstanceOf(ApiError);
    });

    test('instanceof checks should work correctly', () => {
        const prismaError = new PrismaError('msg', 500, ErrorInstance.PRISMA, 'internal', true, {} as any);
        expect(prismaError instanceof Error).toBe(true);
        expect(prismaError instanceof ApiError).toBe(true);
        expect(prismaError instanceof PrismaError).toBe(true);
        expect(prismaError instanceof RedisError).toBe(false);
    });

    test('should be able to check specific error types', () => {
        const errors: ApiError[] = [
            new ApiError('api msg', 500, ErrorInstance.API, 'internal api', true),
            new PrismaError('prisma msg', 500, ErrorInstance.PRISMA, 'internal prisma', true, {} as any),
            new RedisError('redis msg', 500, ErrorInstance.REDIS, 'internal redis', true, {} as any)
        ];

        const prismaErrors = errors.filter(e => e instanceof PrismaError);
        const redisErrors = errors.filter(e => e instanceof RedisError);
        const apiErrors = errors.filter(e => !(e instanceof PrismaError) && !(e instanceof RedisError));

        expect(prismaErrors).toHaveLength(1);
        expect(redisErrors).toHaveLength(1);
        expect(apiErrors).toHaveLength(1);
    });
});

describe('Error Comparison & Equality', () => {

    test('two errors with same params should be different instances', () => {
        const error1 = new ApiError('msg', 500, ErrorInstance.API, 'internal', true);
        const error2 = new ApiError('msg', 500, ErrorInstance.API, 'internal', true);

        expect(error1).not.toBe(error2);
        expect(error1.message).toBe(error2.message);
        expect(error1.status).toBe(error2.status);
        expect(error1.instance).toBe(error2.instance);
        expect(error1.internalCause).toBe(error2.internalCause);
        expect(error1.isOperational).toBe(error2.isOperational);
    });

    test('errors should have different stack traces', () => {
        const error1 = new ApiError('msg', 500, ErrorInstance.API, 'internal', true);
        const error2 = new ApiError('msg', 500, ErrorInstance.API, 'internal', true);

        if(error1.stack && error2.stack) expect(error1.stack).not.toBe(error2.stack);
    });

    test('prismaError should not equal redisError even with same params', () => {
        const prismaError = new PrismaError('msg', 500, ErrorInstance.PRISMA, 'internal', true, {} as any);
        const redisError = new RedisError('msg', 500, ErrorInstance.REDIS, 'internal', true, {} as any);
        expect(prismaError).not.toEqual(redisError);
        expect(prismaError.constructor.name).not.toBe(redisError.constructor.name);
    });
});

describe('Coverage Verification', () => {
    
    test('should have tested all public API surface', () => {
        const enumValues = Object.values(ErrorInstance);
        expect(enumValues.length).toBeGreaterThan(0);

        expect(ApiError).toBeDefined();
        expect(PrismaError).toBeDefined();
        expect(RedisError).toBeDefined();

        const apiError = new ApiError('msg', 500, ErrorInstance.API, 'internal', false);
        expect(apiError).toHaveProperty('message');
        expect(apiError).toHaveProperty('status');
        expect(apiError).toHaveProperty('instance');
        expect(apiError).toHaveProperty('internalCause');
        expect(apiError).toHaveProperty('isOperational');
        expect(apiError).toHaveProperty('code');
        expect(apiError).toHaveProperty('cause');
        expect(apiError).toHaveProperty('reqDetails');
    });
});