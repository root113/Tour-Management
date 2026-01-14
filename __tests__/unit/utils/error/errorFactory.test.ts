import { ApiError, ErrorInstance, PrismaError, RedisError } from "../../../../src/errors/ApiError";
import { __testInternals__, resolveError } from "../../../../src/utils/error/errorFactory.util";

import type { PrismaErrorDetails, RedisErrorDetails } from "../../../../src/models/errors/errorDetails.types";

const {
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
} = __testInternals__;

type MockRequestDetails = {
    requestId: string | string[] | undefined,
    method: string,
    endpoint: string,
    timestamp: string,
    params?: Record<string, any>,
    query?: Record<string, any>
    requestBody?: any,
    userAgent?: any
};

const requestDetails: MockRequestDetails = {
    requestId: 'id',
    method: 'GET',
    endpoint: '<endpoint>',
    timestamp: '2025/01/01',
    params: {} as Record<string, any>,
    query: {} as Record<string, any>,
    requestBody: {} as any,
    userAgent: {} as any
};

describe('resolveError:', () => {

    describe('return error as it is if it is already an instance of ApiError/PrismaError/RedisError:', () => {

        it('should return ApiError when passed ApiError as param', () => {
            const err = new ApiError('msg', 500, ErrorInstance.API, '_', true);
            expect(resolveError(err, requestDetails)).toBeDefined();
            expect(resolveError(err, requestDetails)).toBeInstanceOf(ApiError);
        });

        it('should return PrismaError when passed PrismaError as param', () => {
            const prismaErrDetails: PrismaErrorDetails = {
                prismaClientErrType: {},
                errorMessage: 'msg',
                clientVersion: 'v1.4.2'
            };
            const err = new PrismaError('msg', 500, ErrorInstance.REDIS, 'str', true, prismaErrDetails);

            expect(resolveError(err, requestDetails)).toBeDefined();
            expect(resolveError(err, requestDetails)).toBeInstanceOf(PrismaError);
            expect(resolveError(err, requestDetails)).toBeInstanceOf(ApiError);
        });

        it('should return RedisError when passed RedisError as param', () => {
            const redisErrDetails: RedisErrorDetails = { name: '_', message: 'msg' };
            const err = new RedisError('msg', 500, ErrorInstance.REDIS, 'str', true, redisErrDetails);

            expect(resolveError(err, requestDetails)).toBeDefined();
            expect(resolveError(err, requestDetails)).toBeInstanceOf(RedisError);
            expect(resolveError(err, requestDetails)).toBeInstanceOf(ApiError);
        });
    });

    describe('return an error object according to its root:', () => {

        it('should return ApiError with ErrorInstance.API as instance for generic errors', () => {
            const genericErr = new ApiError('msg', 500, ErrorInstance.API, 'str', false);
            expect(resolveError(genericErr, requestDetails).instance).toBeDefined();
            expect(resolveError(genericErr, requestDetails).instance).toMatch(ErrorInstance.API);
        });

        it('should return ApiError with ErrorInstance.PG as instance for postgres errors', () => {
            const pgErr = { code: '12345', severity: 'FATAL' };
            expect(resolveError(pgErr, requestDetails).instance).toBeDefined();
            expect(resolveError(pgErr, requestDetails).instance).toMatch(ErrorInstance.PG);
        });

        it('should return ApiError with ErrorInstance.NODE as instance for node system errors', () => {
            const nodeSysErr = { code: '12345', syscall: {}, errno: {} };
            expect(resolveError(nodeSysErr, requestDetails).instance).toBeDefined();
            expect(resolveError(nodeSysErr, requestDetails).instance).toMatch(ErrorInstance.NODE_SYS);
        });

        it('should return ApiError with ErrorInstance.HTTP as instance for http alike errors', () => {
            const httpErr = { status: 409 };
            expect(resolveError(httpErr, requestDetails).instance).toBeDefined();
            expect(resolveError(httpErr, requestDetails).instance).toMatch(ErrorInstance.HTTP);
        });

        it('should return ApiError with ErrorInstance.AGGREGATE as instance for aggregate errors', () => {
            const aggregateErr = { errors: [1, 2, 3] };
            expect(resolveError(aggregateErr, requestDetails).instance).toBeDefined();
            expect(resolveError(aggregateErr, requestDetails).instance).toMatch(ErrorInstance.AGGREGATE);
        });

        it('should return ApiError with ErrorInstance.NATIVE as instance for native errors', () => {
            const nativeErr = new Error('msg');
            expect(resolveError(nativeErr, requestDetails).instance).toBeDefined();
            expect(resolveError(nativeErr, requestDetails).instance).toMatch(ErrorInstance.NATIVE);
        });

        it('should return ApiError with ErrorInstance.UNCLASSIFIED as instance for any error which does not belong to any category', () => {
            const unclassifiedErr = { x: NaN, y: null, z: {} };
            expect(resolveError(unclassifiedErr, requestDetails).instance).toBeDefined();
            expect(resolveError(unclassifiedErr, requestDetails).instance).toMatch(ErrorInstance.UNCLASSIFIED);
        });

        it('should return ApiError with ErrorInstance.UNKNOWN as instance for any root error instance that is not an object', () => {
            const unknownErr: number = NaN;
            expect(resolveError(unknownErr, requestDetails).instance).toBeDefined();
            expect(resolveError(unknownErr, requestDetails).instance).toMatch(ErrorInstance.UNKNOWN);
        });

        it('should return PrismaError with ErrorInstance.PRISMA as instance for prisma errors', () => {
            const prismaErr = { name: 'PrismaClientKnownRequestError', code: 'P2025' };
            expect(resolveError(prismaErr, requestDetails).instance).toBeDefined();
            expect(resolveError(prismaErr, requestDetails).instance).toMatch(ErrorInstance.PRISMA);
        });

        it('should return RedisError with ErrorInstance.REDIS as instance for redis errors', () => {
            const redisErr = { message: 'ECONNREFUSED' };
            expect(resolveError(redisErr, requestDetails).instance).toBeDefined();
            expect(resolveError(redisErr, requestDetails).instance).toMatch(ErrorInstance.REDIS);
        });
    });
});

describe('apiGenericFactory:', () => {

    describe('property assignment validation:', () => {

        it('should assign e.message as ApiError.message', () => {
            const e = { message: 'msg' };
            expect(apiGenericFactory(e).message).toMatch(e.message);
        });

        it('should assign e.status as ApiError.status', () => {
            const e = { status: 512 };
            expect(apiGenericFactory(e).status).toBe(e.status);
        });

        it('should assign ErrorInstance.API as ApiError.instance', () => {
            const e = {};
            expect(apiGenericFactory(e).instance).toMatch(ErrorInstance.API);
        });

        it('should assign e.internalCause as ApiError.internalCause', () => {
            const e = { internalCause: 'placeholder' };
            expect(apiGenericFactory(e).internalCause).toMatch(e.internalCause);
        });

        it('should assign e.name as ApiError.internalCause', () => {
            const e = { name: 'placeholder' };
            expect(apiGenericFactory(e).internalCause).toMatch(e.name);
        });

        it('should assign true as ApiError.isOperational', () => {
            const e = {};
            expect(apiGenericFactory(e).isOperational).toBeTruthy();
        });

        it('should assign e.code as ApiError.code', () => {
            const e = { code: '1234' };
            expect(apiGenericFactory(e).code).toMatch(e.code);
        });

        it('should assign e.cause as ApiError.cause', () => {
            const e = { cause: { x: 1, y: 2 } };
            expect(apiGenericFactory(e).cause).toStrictEqual(e.cause);
        });

        it('should assign req as ApiError.reqDetails', () => {
            const e = {};
            expect(apiGenericFactory(e, requestDetails).reqDetails).toStrictEqual(requestDetails);
        });

        describe('assign default values:', () => {

            const emptyErr = {};

            it('should assign default message as ApiError.message', () => {
                expect(apiGenericFactory(emptyErr).message).toMatch('Internal error');
            });

            it('should assign default status (500) as ApiError.status', () => {
                expect(apiGenericFactory(emptyErr).status).toBe(500);
            });

            it('should assign default internalCause as ApiError.internalCause', () => {
                expect(apiGenericFactory(emptyErr).internalCause).toMatch('api_error');
            });

            it('should assign default cause (e itself) as ApiError.cause', () => {
                const e = { x: 1, y: 2 };
                expect(apiGenericFactory(e).cause).toBe(e);
            });
        });
    });

    describe('returned object validation:', () => {

        const err = {
            message: 'msg',
            internalCause: 'placeholder',
            status: 512,
            code: 'str',
            cause: 'str-c'
        };

        it('should return ApiError', () => {
            expect(apiGenericFactory(err, requestDetails)).toBeDefined();
            expect(apiGenericFactory(err, requestDetails)).toBeInstanceOf(ApiError);
        });

        it('should return ApiError with valid properties', () => {
            expect(apiGenericFactory(err, requestDetails).name).toBeDefined();
            expect(apiGenericFactory(err, requestDetails).message).toBeDefined();
            expect(apiGenericFactory(err, requestDetails).status).toBeDefined();
            expect(apiGenericFactory(err, requestDetails).instance).toBeDefined();
            expect(apiGenericFactory(err, requestDetails).internalCause).toBeDefined();
            expect(apiGenericFactory(err, requestDetails).isOperational).toBeDefined();
            expect(apiGenericFactory(err, requestDetails).code).toBeDefined();
            expect(apiGenericFactory(err, requestDetails).cause).toBeDefined();
            expect(apiGenericFactory(err, requestDetails).reqDetails).toBeDefined();

            expect(typeof apiGenericFactory(err, requestDetails).name).toBe('string');
            expect(typeof apiGenericFactory(err, requestDetails).message).toBe('string');
            expect(typeof apiGenericFactory(err, requestDetails).status).toBe('number');
            expect(typeof apiGenericFactory(err, requestDetails).instance).toBe('string');
            expect(typeof apiGenericFactory(err, requestDetails).internalCause).toBe('string');
            expect(typeof apiGenericFactory(err, requestDetails).isOperational).toBe('boolean');
            expect(typeof apiGenericFactory(err, requestDetails).code).toBe('string');
            expect(typeof apiGenericFactory(err, requestDetails).cause).toBe('string');
            expect(typeof apiGenericFactory(err, requestDetails).reqDetails).toBe('object');
        });

        it('should return ApiError with correct property values', () => {
            expect(apiGenericFactory(err, requestDetails)).toHaveProperty('name', 'ApiError');
            expect(apiGenericFactory(err, requestDetails)).toHaveProperty('message', err.message);
            expect(apiGenericFactory(err, requestDetails)).toHaveProperty('status', err.status);
            expect(apiGenericFactory(err, requestDetails)).toHaveProperty('instance', ErrorInstance.API);
            expect(apiGenericFactory(err, requestDetails)).toHaveProperty('isOperational', true);
            expect(apiGenericFactory(err, requestDetails)).toHaveProperty('internalCause', err.internalCause);
            expect(apiGenericFactory(err, requestDetails)).toHaveProperty('code', err.code);
            expect(apiGenericFactory(err, requestDetails)).toHaveProperty('cause', err.cause);
            expect(apiGenericFactory(err, requestDetails)).toHaveProperty('reqDetails', requestDetails);
        });
    });
});

describe('prismaErrorFactory:', () => {

    describe('property assignment validation:', () => {

        const emptyErr = {};

        describe('assign default values:', () => {

            it('should assign default message as PrismaError.message', () => {
                expect(prismaErrorFactory(emptyErr).message).toMatch('Prisma client error');
            });

            it('should assign default internalCause as PrismaError.internalCause', () => {
                expect(prismaErrorFactory(emptyErr).internalCause).toMatch('prisma_error');
            });

            it('should assign default code as PrismaError.code', () => {
                expect(prismaErrorFactory(emptyErr).code).toBeUndefined();
            });

            it('should assign default cause (e itself) as PrismaError.code', () => {
                const e = { foo: null };
                expect(prismaErrorFactory(e).cause).toBe(e);
            });

            describe('assign default values for prismaDetails:', () => {

                const e = { x: 1, y: 2, z: NaN };

                it('should assign default errorMessage (e itself as string) as PrismaError.prismaDetails.errorMessage', () => {
                    expect(prismaErrorFactory(e).prismaDetails.errorMessage).toMatch(String(e));
                });

                it('should assign default clientVersion as PrismaError.prismaDetails.clientVersion', () => {
                    expect(prismaErrorFactory(e).prismaDetails.clientVersion).toMatch('');
                });
            });
        });

        it('should set message as PrismaError.message', () => {
            const e = { message: 'msg' };
            expect(prismaErrorFactory(e).message).toMatch(e.message);
        });

        it('should set 409 as PrismaError.status when prismaCode is \'P2002\'', () => {
            const e = { code: 'P2002' };
            expect(prismaErrorFactory(e).status).toBe(409);
        });

        it('should set 404 as PrismaError.status when prismaCode is \'P2025\'', () => {
            const e = { code: 'P2025' };
            expect(prismaErrorFactory(e).status).toBe(404);
        });

        it('should set e.name as PrismaError.internalCause', () => {
            const e = { name: 'placeholder' };
            expect(prismaErrorFactory(e).internalCause).toMatch(e.name);
        });

        it('should set e.code as PrismaError.code', () => {
            const e = { code: 'str' };
            expect(prismaErrorFactory(e).code).toMatch(e.code);
        });

        it('should set e.cause as PrismaError.cause', () => {
            const e = { cause: 'str' };
            expect(prismaErrorFactory(e).cause).toBe(e.cause);
        });

        it('should set ErrorInstance.PRISMA as PrismaError.instance', () => {
            expect(prismaErrorFactory(emptyErr).instance).toMatch(ErrorInstance.PRISMA);
        });

        it('should set PrismaError.isOperational true', () => {
            expect(prismaErrorFactory(emptyErr).isOperational).toBeTruthy();
        });

        it('should set request details as PrismaError.reqDetails', () => {
            expect(prismaErrorFactory(emptyErr, requestDetails).reqDetails).toStrictEqual(requestDetails);
        });

        describe('set prisma details as PrismaError.prismaDetails:', () => {

            const err = { message: 'msg', clientVersion: 'v2.8.12', code: '1234', meta: { x: 1, y: 2 } };

            it('should set prismaClientErrType to e itself as PrismaError.prismaDetails.prismaClientErrType', () => {
                expect(prismaErrorFactory(err).prismaDetails.prismaClientErrType).toBeDefined();
                expect(prismaErrorFactory(err).prismaDetails).toHaveProperty('prismaClientErrType', err);
            });

            it('should set e.message as PrismaError.prismaDetails.errorMessage', () => {
                expect(prismaErrorFactory(err).prismaDetails.errorMessage).toBeDefined();
                expect(prismaErrorFactory(err).prismaDetails).toHaveProperty('errorMessage', err.message);
            });

            it('should set e.clientVersion as PrismaError.prismaDetails.clientVersion', () => {
                expect(prismaErrorFactory(err).prismaDetails.clientVersion).toBeDefined();
                expect(prismaErrorFactory(err).prismaDetails).toHaveProperty('clientVersion', err.clientVersion);
            });

            it('should set e.code as PrismaError.prismaDetails.prismaCode', () => {
                expect(prismaErrorFactory(err).prismaDetails.prismaCode).toBeDefined();
                expect(prismaErrorFactory(err).prismaDetails).toHaveProperty('prismaCode', err.code);
            });

            it('should set e.meta as PrismaError.prismaDetails.meta', () => {
                expect(prismaErrorFactory(err).prismaDetails.meta).toBeDefined();
                expect(prismaErrorFactory(err).prismaDetails).toHaveProperty('meta', err.meta);
            });
        });
    });

    describe('returned object validation:', () => {

        const err = {
            message: 'msg',
            name: 'placeholder',
            code: '1234',
            clientVersion: 'v1.17.4',
            meta: { x: 1, y: 2 },
            cause: 'str'
        };

        it('should return PrismaError', () => {
            expect(prismaErrorFactory(err, requestDetails)).toBeInstanceOf(ApiError);
            expect(prismaErrorFactory(err, requestDetails)).toBeInstanceOf(PrismaError);
        });

        it('should set valid properties for PrismaError', () => {
            expect(typeof prismaErrorFactory(err, requestDetails).name).toBe('string');
            expect(typeof prismaErrorFactory(err, requestDetails).message).toBe('string');
            expect(typeof prismaErrorFactory(err, requestDetails).status).toBe('number');
            expect(typeof prismaErrorFactory(err, requestDetails).instance).toBe('string');
            expect(typeof prismaErrorFactory(err, requestDetails).internalCause).toBe('string');
            expect(typeof prismaErrorFactory(err, requestDetails).isOperational).toBe('boolean');
            expect(typeof prismaErrorFactory(err, requestDetails).code).toBe('string');
            expect(typeof prismaErrorFactory(err, requestDetails).cause).toBe('string');
            expect(typeof prismaErrorFactory(err, requestDetails).reqDetails).toBe('object');
            expect(typeof prismaErrorFactory(err, requestDetails).prismaDetails).toBe('object');

            expect(typeof prismaErrorFactory(err, requestDetails).prismaDetails.prismaClientErrType).toBe('object');
            expect(typeof prismaErrorFactory(err, requestDetails).prismaDetails.errorMessage).toBe('string');
            expect(typeof prismaErrorFactory(err, requestDetails).prismaDetails.clientVersion).toBe('string');
            expect(typeof prismaErrorFactory(err, requestDetails).prismaDetails.prismaCode).toBe('string');
            expect(typeof prismaErrorFactory(err, requestDetails).prismaDetails.meta).toBe('object');
        });

        it('should set constructor name as PrismaError.name', () => {
            expect(prismaErrorFactory(err, requestDetails).name).toBeDefined();
            expect(prismaErrorFactory(err, requestDetails)).toHaveProperty('name', 'PrismaError');
        });

        it('should set message as PrismaError.message', () => {
            expect(prismaErrorFactory(err, requestDetails).message).toBeDefined();
            expect(prismaErrorFactory(err, requestDetails)).toHaveProperty('message', err.message);
        });

        it('should set status as PrismaError.status', () => {
            expect(prismaErrorFactory(err, requestDetails).status).toBeDefined();
            expect(prismaErrorFactory(err, requestDetails)).toHaveProperty('status', 500);
        });

        it('should set instance as PrismaError.instance', () => {
            expect(prismaErrorFactory(err, requestDetails).instance).toBeDefined();
            expect(prismaErrorFactory(err, requestDetails)).toHaveProperty('instance', ErrorInstance.PRISMA);
        });

        it('should set internalCause as PrismaError.internalCause', () => {
            expect(prismaErrorFactory(err, requestDetails).internalCause).toBeDefined();
            expect(prismaErrorFactory(err, requestDetails)).toHaveProperty('internalCause', err.name);
        });

        it('should set isOperational as PrismaError.isOperational', () => {
            expect(prismaErrorFactory(err, requestDetails).isOperational).toBeDefined();
            expect(prismaErrorFactory(err, requestDetails)).toHaveProperty('isOperational', true);
        });

        it('should set code as PrismaError.code', () => {
            expect(prismaErrorFactory(err, requestDetails).code).toBeDefined();
            expect(prismaErrorFactory(err, requestDetails)).toHaveProperty('code', err.code);
        });

        it('should set cause as PrismaError.cause', () => {
            expect(prismaErrorFactory(err, requestDetails).cause).toBeDefined();
            expect(prismaErrorFactory(err, requestDetails)).toHaveProperty('cause', err.cause);
        });

        it('should set prisma details as PrismaError.prismaDetails', () => {
            expect(prismaErrorFactory(err, requestDetails).prismaDetails).toBeDefined();
            expect(prismaErrorFactory(err, requestDetails).prismaDetails).toHaveProperty('prismaClientErrType', err);
            expect(prismaErrorFactory(err, requestDetails).prismaDetails).toHaveProperty('errorMessage', err.message);
            expect(prismaErrorFactory(err, requestDetails).prismaDetails).toHaveProperty('clientVersion', err.clientVersion);
            expect(prismaErrorFactory(err, requestDetails).prismaDetails).toHaveProperty('prismaCode', err.code);
            expect(prismaErrorFactory(err, requestDetails).prismaDetails).toHaveProperty('meta', err.meta);
        });

        it('should set request details as PrismaError.reqDetails', () => {
            expect(prismaErrorFactory(err, requestDetails).reqDetails).toBeDefined();
            expect(prismaErrorFactory(err, requestDetails)).toHaveProperty('reqDetails', requestDetails);
        });
    });
});

describe('redisErrorFactory:', () => {

    describe('property assignment validation:', () => {

        const errorInstance = {};

        describe('assign default values:', () => {

            it('should assign default message as RedisError.message', () => {
                expect(redisErrorFactory(errorInstance, requestDetails)).toHaveProperty('message', 'Redis error');
            });
            
            it('should assign default status (503) as RedisError.status', () => {
                expect(redisErrorFactory(errorInstance, requestDetails)).toHaveProperty('status', 503);
            });
            
            it('should assign default internalCause as RedisError.internalCause', () => {
                expect(redisErrorFactory(errorInstance, requestDetails)).toHaveProperty('internalCause', 'redis_error');
            });
            
            it('should assign default code as RedisError.code', () => {
                expect(redisErrorFactory(errorInstance, requestDetails)).toHaveProperty('code', undefined);
            });
            
            it('should assign default cause as RedisError.cause', () => {
                expect(redisErrorFactory(errorInstance, requestDetails)).toHaveProperty('cause', errorInstance);
            });

            describe('assign default values for redisDetails:', () => {

                it('should assign default name as RedisError.redisDetails.name', () => {
                    expect(redisErrorFactory(null, requestDetails).redisDetails).toHaveProperty('name', 'Redis error');
                });
                
                it('should assign default message as RedisError.redisDetails.message', () => {
                    expect(redisErrorFactory(errorInstance, requestDetails).redisDetails).toHaveProperty('message', 'Redis error');
                });
                
                it('should assign default command (undefined) as RedisError.redisDetails.command', () => {
                    expect(redisErrorFactory(errorInstance, requestDetails).redisDetails).toHaveProperty('command', undefined);
                });
                
                it('should assign default conn (undefined) as RedisError.redisDetails.conn', () => {
                    expect(redisErrorFactory(errorInstance, requestDetails).redisDetails).toHaveProperty('conn', undefined);
                });
            });
        });

        describe('assign values accordingly:', () => {

            it('should assign message as RedisError.message', () => {
                const err = { message: 'msg' };
                expect(redisErrorFactory(err).message).toBeDefined();
                expect(redisErrorFactory(err)).toHaveProperty('message', err.message);
            });

            it('should assign status as RedisError.status', () => {
                expect(redisErrorFactory({}).status).toBeDefined();
                expect(redisErrorFactory({})).toHaveProperty('status', 503);
            });

            it('should assign instance as RedisError.instance', () => {
                expect(redisErrorFactory({}).instance).toBeDefined();
                expect(redisErrorFactory({})).toHaveProperty('instance', ErrorInstance.REDIS);
            });

            it('should assign internalCause as RedisError.internalCause', () => {
                const err = { name: 'placeholder' };
                expect(redisErrorFactory(err).internalCause).toBeDefined();
                expect(redisErrorFactory(err)).toHaveProperty('internalCause', err.name);
            });

            it('should assign isOperational as RedisError.isOperational', () => {
                expect(redisErrorFactory({}).isOperational).toBeDefined();
                expect(redisErrorFactory({})).toHaveProperty('isOperational', true);
            });

            describe('assign redisDetails as RedisError.redisDetails', () => {

                const err = {
                    name: 'placeholder', 
                    message: 'msg', 
                    stack: 'stack...', 
                    code: 'str', 
                    parseContext: 'ctx',
                    command: 'cmd',
                    args: 'a...',
                    adress: 'a',
                    port: 9999
                };

                it('should assign name as RedisError.redisDetails.name', () => {
                    expect(redisErrorFactory(err).redisDetails).toHaveProperty('name', err.name);
                });

                it('should assign e.constructor.name as RedisError.redisDetails.name', () => {
                    const e = { constructor: { name: 'placeholder' } };
                    expect(redisErrorFactory(e).redisDetails).toHaveProperty('name', e.constructor.name);
                });

                it('should assign message as RedisError.redisDetails.message', () => {
                    expect(redisErrorFactory(err).redisDetails).toHaveProperty('message', err.message);
                });

                it('should assign stack as RedisError.redisDetails.stack', () => {
                    expect(redisErrorFactory(err).redisDetails).toHaveProperty('stack', err.stack);
                });

                it('should assign code as RedisError.redisDetails.code', () => {
                    expect(redisErrorFactory(err).redisDetails).toHaveProperty('code', err.code);
                });

                it('should assign command as RedisError.redisDetails.command', () => {
                    expect(redisErrorFactory(err).redisDetails).toHaveProperty('command');
                    expect(redisErrorFactory(err).redisDetails.command).toHaveProperty('cmd', err.command);
                    expect(redisErrorFactory(err).redisDetails.command).toHaveProperty('args', err.args);
                });

                it('should assign conn as RedisError.redisDetails.conn', () => {
                    expect(redisErrorFactory(err).redisDetails).toHaveProperty('conn');
                    expect(redisErrorFactory(err).redisDetails.conn).toHaveProperty('adress', err.adress);
                    expect(redisErrorFactory(err).redisDetails.conn).toHaveProperty('port', err.port);
                });

                it('should assign parseContext as RedisError.redisDetails.parseContext', () => {
                    expect(redisErrorFactory(err).redisDetails).toHaveProperty('parseContext', err.parseContext);
                });
            });

            it('should assign code as RedisError.code', () => {
                const errWithCode = { code: 'str' };
                const errNoCode = {};

                expect(redisErrorFactory(errWithCode).code).toBeDefined();
                expect(redisErrorFactory(errWithCode)).toHaveProperty('code', errWithCode.code);
                expect(redisErrorFactory(errNoCode).code).toBeUndefined();
                expect(redisErrorFactory(errNoCode)).toHaveProperty('code', undefined);
            });

            it('should assign cause as RedisError.cause', () => {
                const err = { a: 1, b: 2 };
                expect(redisErrorFactory(err).cause).toBeDefined();
                expect(redisErrorFactory(err)).toHaveProperty('cause', err);
            });

            it('should assign reqDetails as RedisError.reqDetails', () => {
                const err = {};
                expect(redisErrorFactory(err, requestDetails).reqDetails).toBeDefined();
                expect(redisErrorFactory(err, requestDetails)).toHaveProperty('reqDetails');
                expect(redisErrorFactory(err, requestDetails).reqDetails).toStrictEqual(requestDetails);
            });
        });
    });

    describe('returned object validation:', () => {

        const err = {
            message: 'msg',
            name: 'placeholder',
            stack: { x: 1, y: 2 },
            code: 'str',
            command: 'c',
            args: 'a',
            adress: 'adress',
            port: 9999,
            parseContext: 'str-pc'
        };

        it('should return RedisError', () => {
            expect(redisErrorFactory(err)).toBeDefined();
            expect(redisErrorFactory(err)).toBeInstanceOf(ApiError);
            expect(redisErrorFactory(err)).toBeInstanceOf(RedisError);
        });

        it('should return RedisError with valid properties', () => {
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('name', 'RedisError');
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('message');
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('status');
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('instance');
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('internalCause');
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('isOperational');
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('redisDetails');
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('code');
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('cause');
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('reqDetails');

            expect(redisErrorFactory(err, requestDetails).redisDetails).toHaveProperty('name');
            expect(redisErrorFactory(err, requestDetails).redisDetails).toHaveProperty('message');
            expect(redisErrorFactory(err, requestDetails).redisDetails).toHaveProperty('stack');
            expect(redisErrorFactory(err, requestDetails).redisDetails).toHaveProperty('code');
            expect(redisErrorFactory(err, requestDetails).redisDetails).toHaveProperty('command');
            expect(redisErrorFactory(err, requestDetails).redisDetails).toHaveProperty('conn');
            expect(redisErrorFactory(err, requestDetails).redisDetails).toHaveProperty('parseContext');

            expect(redisErrorFactory(err, requestDetails).redisDetails.command).toHaveProperty('cmd');
            expect(redisErrorFactory(err, requestDetails).redisDetails.command).toHaveProperty('args');
            expect(redisErrorFactory(err, requestDetails).redisDetails.conn).toHaveProperty('adress');
            expect(redisErrorFactory(err, requestDetails).redisDetails.conn).toHaveProperty('port');

            expect(typeof redisErrorFactory(err, requestDetails).message).toBe('string');
            expect(typeof redisErrorFactory(err, requestDetails).status).toBe('number');
            expect(typeof redisErrorFactory(err, requestDetails).instance).toBe('string');
            expect(typeof redisErrorFactory(err, requestDetails).internalCause).toBe('string');
            expect(typeof redisErrorFactory(err, requestDetails).isOperational).toBe('boolean');
            expect(typeof redisErrorFactory(err, requestDetails).redisDetails).toBe('object');
            expect(typeof redisErrorFactory(err, requestDetails).code).toBe('string');
            expect(typeof redisErrorFactory(err, requestDetails).cause).toBe('object');
            expect(typeof redisErrorFactory(err, requestDetails).reqDetails).toBe('object');
        });

        it('should return RedisError with correct properties', () => {
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('name', 'RedisError');
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('message', err.message);
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('status', 503);
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('instance', ErrorInstance.REDIS);
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('internalCause', err.name);
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('isOperational', true);
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('code', err.code);
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('cause', err);
            expect(redisErrorFactory(err, requestDetails)).toHaveProperty('reqDetails', requestDetails);

            expect(redisErrorFactory(err, requestDetails).redisDetails).toHaveProperty('name', err.name);
            expect(redisErrorFactory(err, requestDetails).redisDetails).toHaveProperty('message', err.message);
            expect(redisErrorFactory(err, requestDetails).redisDetails).toHaveProperty('stack', err.stack);
            expect(redisErrorFactory(err, requestDetails).redisDetails).toHaveProperty('code', err.code);
            expect(redisErrorFactory(err, requestDetails).redisDetails).toHaveProperty('command', { cmd: err.command, args: err.args });
            expect(redisErrorFactory(err, requestDetails).redisDetails).toHaveProperty('conn', { adress: err.adress, port: err.port });
            expect(redisErrorFactory(err, requestDetails).redisDetails).toHaveProperty('parseContext', err.parseContext);
        });
    });
});

describe('postgresErrorFactory:', () => {

    describe('property assignment validation:', () => {

        describe('default assignments\' validation:', () => {

            const err = {};

            it('should assign default message as ApiError.message', () => {
                expect(postgresErrorFactory(err).message).toBeDefined();
                expect(postgresErrorFactory(err)).toHaveProperty('message', 'Database error');
            });
            
            it('should assign default code (undefined) as ApiError.code', () => {
                expect(postgresErrorFactory(err).code).toBeUndefined();
                expect(postgresErrorFactory(err)).toHaveProperty('code', undefined);
            });
            
            it('should assign default status (500) as ApiError.status', () => {
                expect(postgresErrorFactory(err).status).toBeDefined();
                expect(postgresErrorFactory(err)).toHaveProperty('status', 500);
            });
            
            it('should assign default internalCause as ApiError.internalCause', () => {
                expect(postgresErrorFactory(err).internalCause).toBeDefined();
                expect(postgresErrorFactory(err)).toHaveProperty('internalCause', 'pg_error');
            });
            
            it('should assign default cause as ApiError.cause', () => {
                expect(postgresErrorFactory(err).cause).toBeDefined();
                expect(postgresErrorFactory(err)).toHaveProperty('cause', err);
            });
        });

        describe('assign values from param err', () => {

            const err = { message: 'msg', name: 'placeholder', code: '23505' };

            it('should assign message as ApiError.message', () => {
                expect(postgresErrorFactory(err).message).toBeDefined();
                expect(postgresErrorFactory(err)).toHaveProperty('message', err.message);
            });

            it('should assign status as ApiError.status', () => {
                expect(postgresErrorFactory(err).status).toBeDefined();
                expect(postgresErrorFactory(err)).toHaveProperty('status', 409);
            });

            it('should assign instance as ApiError.instance', () => {
                expect(postgresErrorFactory(err).instance).toBeDefined();
                expect(postgresErrorFactory(err)).toHaveProperty('instance', ErrorInstance.PG);
            });

            it('should assign internalCause as ApiError.internalCause', () => {
                expect(postgresErrorFactory(err).internalCause).toBeDefined();
                expect(postgresErrorFactory(err)).toHaveProperty('internalCause', err.name);
            });

            it('should assign isOperational as ApiError.isOperational', () => {
                expect(postgresErrorFactory(err).isOperational).toBeDefined();
                expect(postgresErrorFactory(err)).toHaveProperty('isOperational', true);
            });

            it('should assign code as ApiError.code', () => {
                expect(postgresErrorFactory(err).code).toBeDefined();
                expect(postgresErrorFactory(err)).toHaveProperty('code', err.code);
            });

            it('should assign cause as ApiError.cause', () => {
                expect(postgresErrorFactory(err).cause).toBeDefined();
                expect(postgresErrorFactory(err)).toHaveProperty('cause', err);
            });

            it('should assign reqDetails as ApiError.reqDetails', () => {
                expect(postgresErrorFactory(err).reqDetails).toBeDefined();
                expect(postgresErrorFactory(err)).toHaveProperty('reqDetails');
                
                expect(postgresErrorFactory(err, requestDetails).reqDetails).toHaveProperty('detail', undefined);
                expect(postgresErrorFactory(err, requestDetails).reqDetails).toHaveProperty('table', undefined);
                expect(postgresErrorFactory(err, requestDetails).reqDetails).toHaveProperty('constraint', undefined);
                expect(postgresErrorFactory(err, requestDetails).reqDetails).toHaveProperty('hint', undefined);
                expect(postgresErrorFactory(err, requestDetails).reqDetails).toHaveProperty('req', requestDetails);
            });
        });
    });
    
    describe('returned object validation:', () => {

        const err = { 
            message: 'msg', 
            code: 'str', 
            name: 'placeholder',
            detail: 'detail',
            table: 'table',
            constraint: 'constraint',
            hint: 'hint'
        };

        it('should return ApiError', () => {
            expect(postgresErrorFactory(err)).toBeDefined();
            expect(postgresErrorFactory(err)).toBeInstanceOf(ApiError);
        });

        it('should return ApiError with all properties as valid', () => {
            expect(postgresErrorFactory(err).name).toBeDefined();
            expect(postgresErrorFactory(err).message).toBeDefined();
            expect(postgresErrorFactory(err).status).toBeDefined();
            expect(postgresErrorFactory(err).instance).toBeDefined();
            expect(postgresErrorFactory(err).internalCause).toBeDefined();
            expect(postgresErrorFactory(err).isOperational).toBeDefined();
            expect(postgresErrorFactory(err).code).toBeDefined();
            expect(postgresErrorFactory(err).cause).toBeDefined();
            expect(postgresErrorFactory(err).reqDetails).toBeDefined();

            expect(typeof postgresErrorFactory(err).name).toBe('string');
            expect(typeof postgresErrorFactory(err).message).toBe('string');
            expect(typeof postgresErrorFactory(err).status).toBe('number');
            expect(typeof postgresErrorFactory(err).instance).toBe('string');
            expect(typeof postgresErrorFactory(err).internalCause).toBe('string');
            expect(typeof postgresErrorFactory(err).isOperational).toBe('boolean');
            expect(typeof postgresErrorFactory(err).code).toBe('string');
            expect(typeof postgresErrorFactory(err).cause).toBe('object');
            expect(typeof postgresErrorFactory(err).reqDetails).toBe('object');
        });

        it('should return ApiError with all properties as correct values', () => {
            expect(postgresErrorFactory(err, requestDetails)).toHaveProperty('name', 'ApiError');
            expect(postgresErrorFactory(err, requestDetails)).toHaveProperty('message', err.message);
            expect(postgresErrorFactory(err, requestDetails)).toHaveProperty('status', 500);
            expect(postgresErrorFactory(err, requestDetails)).toHaveProperty('instance', ErrorInstance.PG);
            expect(postgresErrorFactory(err, requestDetails)).toHaveProperty('internalCause', err.name);
            expect(postgresErrorFactory(err, requestDetails)).toHaveProperty('isOperational', true);
            expect(postgresErrorFactory(err, requestDetails)).toHaveProperty('code', err.code);
            expect(postgresErrorFactory(err, requestDetails)).toHaveProperty('cause', err);
            expect(postgresErrorFactory(err, requestDetails)).toHaveProperty('reqDetails');

            expect(postgresErrorFactory(err, requestDetails).reqDetails).toHaveProperty('detail', err.detail);
            expect(postgresErrorFactory(err, requestDetails).reqDetails).toHaveProperty('table', err.table);
            expect(postgresErrorFactory(err, requestDetails).reqDetails).toHaveProperty('constraint', err.constraint);
            expect(postgresErrorFactory(err, requestDetails).reqDetails).toHaveProperty('hint', err.hint);
            expect(postgresErrorFactory(err, requestDetails).reqDetails).toHaveProperty('req', requestDetails);
        });
    });
});

describe('nodeSysErrorFactory:', () => {

    describe('property assignment validation:', () => {
        
        it('should assign correct message as ApiError.message', () => {
            const err = { message: 'msg', name: 'placeholder', code: 'str' };
            expect(nodeSysErrorFactory(err).message).toBeDefined();
            expect(nodeSysErrorFactory(err)).toHaveProperty('message', err.message);
        });
        
        it('should assign correct code as ApiError.code', () => {
            const err = { message: 'msg', name: 'placeholder', code: 'str' };
            expect(nodeSysErrorFactory(err).code).toBeDefined();
            expect(nodeSysErrorFactory(err)).toHaveProperty('code', err.code);
        });

        describe('assign correct status as ApiError.status:', () => {
            
            it('should assign 403 if code === \'EACCES\' || \'EPERM\'', () => {
                const err1 = { code: 'EACCES' };
                const err2 = { code: 'EPERM' };

                expect(nodeSysErrorFactory(err1).status).toBeDefined();
                expect(nodeSysErrorFactory(err2).status).toBeDefined();
                expect(nodeSysErrorFactory(err1)).toHaveProperty('status', 403);
                expect(nodeSysErrorFactory(err2)).toHaveProperty('status', 403);
            });
            
            it('should assign 404 if code === \'ENOENT\'', () => {
                const err = { code: 'ENOENT' };
                expect(nodeSysErrorFactory(err).status).toBeDefined();
                expect(nodeSysErrorFactory(err)).toHaveProperty('status', 404);
            });
            
            describe('assign 502 if code involves keywords', () => {
                const errInstances = [
                    { code: 'ECONNREFUSED' },
                    { code: 'ETIMEDOUT' },
                    { code: 'EPIPE' },
                    { code: 'ENETUNREACH' }
                ] as Array<unknown>;

                test.each(errInstances)('should assign 502 as ApiError.status', (e) => {
                    expect(nodeSysErrorFactory(e).status).toBeDefined();
                    expect(nodeSysErrorFactory(e)).toHaveProperty('status', 502);
                });
            });
        });

        describe('assign correct internalCause:', () => {
            
            it('should assign code as ApiError.internalCause', () => {
                const err = { code: 'internalCause' };
                expect(nodeSysErrorFactory(err).internalCause).toBeDefined();
                expect(nodeSysErrorFactory(err)).toHaveProperty('internalCause', err.code);
            });
            
            it('should assign name as ApiError.internalCause', () => {
                const err = { name: 'internalCause' };
                expect(nodeSysErrorFactory(err).internalCause).toBeDefined();
                expect(nodeSysErrorFactory(err)).toHaveProperty('internalCause', err.name);
            });
        });

        describe('fallbacks validation:', () => {
            
            const err = {};

            it('should return default message', () => {
                expect(nodeSysErrorFactory(err).message).toBeDefined();
                expect(nodeSysErrorFactory(err)).toHaveProperty('message', 'System error');
            });
            
            it('should return default code', () => {
                expect(nodeSysErrorFactory(err).code).toBeUndefined();
                expect(nodeSysErrorFactory(err)).toHaveProperty('code', undefined);
            });

            it('should return default internalCause', () => {
                expect(nodeSysErrorFactory(err).internalCause).toBeDefined();
                expect(nodeSysErrorFactory(err)).toHaveProperty('internalCause', 'node_sys_error');
            });
            
            it('should return default status', () => {
                expect(nodeSysErrorFactory(err).status).toBeDefined();
                expect(nodeSysErrorFactory(err)).toHaveProperty('status', 500);
            });
        });
    });

    describe('returned object validation:', () => {
        
        const err = { name: 'placeholder', message: 'msg', code: 'ECONNREFUSED', syscall: 'str', path: '<path>' };

        it('should return new ApiError', () => {
            expect(nodeSysErrorFactory(err, requestDetails)).toBeDefined();
            expect(nodeSysErrorFactory(err, requestDetails)).not.toBeNull();
            expect(nodeSysErrorFactory(err, requestDetails)).toBeInstanceOf(ApiError);

            expect(nodeSysErrorFactory(err)).toBeDefined();
            expect(nodeSysErrorFactory(err)).not.toBeNull();
            expect(nodeSysErrorFactory(err)).toBeInstanceOf(ApiError);
        });
        
        it('should return ApiError with valid properties', () => {
            expect(nodeSysErrorFactory(err, requestDetails)).toHaveProperty('name', 'ApiError');
            expect(nodeSysErrorFactory(err, requestDetails)).toHaveProperty('message');
            expect(nodeSysErrorFactory(err, requestDetails)).toHaveProperty('status');
            expect(nodeSysErrorFactory(err, requestDetails)).toHaveProperty('instance');
            expect(nodeSysErrorFactory(err, requestDetails)).toHaveProperty('internalCause');
            expect(nodeSysErrorFactory(err, requestDetails)).toHaveProperty('isOperational');
            expect(nodeSysErrorFactory(err, requestDetails)).toHaveProperty('code');
            expect(nodeSysErrorFactory(err, requestDetails)).toHaveProperty('cause');
            expect(nodeSysErrorFactory(err, requestDetails)).toHaveProperty('reqDetails');

            expect(nodeSysErrorFactory(err, requestDetails).message).toMatch(err.message);
            expect(nodeSysErrorFactory(err, requestDetails).status).toBe(502);
            expect(nodeSysErrorFactory(err, requestDetails).instance).toMatch(ErrorInstance.NODE_SYS);
            expect(nodeSysErrorFactory(err, requestDetails).internalCause).toMatch(err.code);
            expect(nodeSysErrorFactory(err, requestDetails).isOperational).toBeTruthy();
            expect(nodeSysErrorFactory(err, requestDetails).code).toMatch(err.code);
            expect(nodeSysErrorFactory(err, requestDetails).cause).toBe(err);
            expect(nodeSysErrorFactory(err, requestDetails).reqDetails).toStrictEqual({ syscall: err.syscall, path: err.path, req: requestDetails });
        });
        
        it('should return ApiError with correct ApiError.message', () => {
            const e = { name: 'placeholder', code: 'ECONNREFUSED' };
            expect(nodeSysErrorFactory(err)).toHaveProperty('message', err.message);
            expect(nodeSysErrorFactory(e)).toHaveProperty('message', 'System error');
        });

        describe('return ApiError with correct ApiError.status', () => {
            const errInstances: Record<string, { name: string, message: string, code: string }> = {
                ENOENT: { name: err.name, message: err.message, code: 'ENOENT' },
                EACCES: { name: err.name, message: err.message, code: 'EACCES' },
                EPERM: { name: err.name, message: err.message, code: 'EPERM' },
                ECONNREFUSED: { name: err.name, message: err.message, code: 'ECONNREFUSED' },
                ETIMEDOUT: { name: err.name, message: err.message, code: 'ETIMEDOUT' },
                EPIPE: { name: err.name, message: err.message, code: 'EPIPE' },
                ENETUNREACH: { name: err.name, message: err.message, code: 'ENETUNREACH' }
            };
            
            it('should return 403 as status', () => {
                expect(nodeSysErrorFactory(errInstances['EACCES'])).toHaveProperty('status', 403);
                expect(nodeSysErrorFactory(errInstances['EPERM'])).toHaveProperty('status', 403);
            });

            it('should return 404 as status', () => {
                expect(nodeSysErrorFactory(errInstances['ENOENT'])).toHaveProperty('status', 404);
            });

            it('should return 502 as status', () => {
                expect(nodeSysErrorFactory(errInstances['ECONNREFUSED'])).toHaveProperty('status', 502);
                expect(nodeSysErrorFactory(errInstances['ETIMEDOUT'])).toHaveProperty('status', 502);
                expect(nodeSysErrorFactory(errInstances['EPIPE'])).toHaveProperty('status', 502);
                expect(nodeSysErrorFactory(errInstances['ENETUNREACH'])).toHaveProperty('status', 502);
            });
        });

        it('should return ApiError with correct ApiError.instance', () => {
            expect(nodeSysErrorFactory(err)).toHaveProperty('instance', ErrorInstance.NODE_SYS);
        });
        
        it('should return ApiError with correct ApiError.internalCause', () => {
            const e = { name: 'placeholder', message: 'msg' };
            expect(nodeSysErrorFactory(err)).toHaveProperty('internalCause', err.code);
            expect(nodeSysErrorFactory(e)).toHaveProperty('internalCause', e.name);
        });
        
        it('should return ApiError with correct ApiError.isOperational', () => {
            expect(nodeSysErrorFactory(err)).toHaveProperty('isOperational', true);
        });
        
        it('should return ApiError with correct ApiError.code', () => {
            expect(nodeSysErrorFactory(err)).toHaveProperty('code', err.code);
        });
        
        it('should return ApiError with correct ApiError.cause', () => {
            expect(nodeSysErrorFactory(err)).toHaveProperty('cause', err);
            expect(nodeSysErrorFactory(err).cause).toHaveProperty('name', err.name);
            expect(nodeSysErrorFactory(err).cause).toHaveProperty('message', err.message);
            expect(nodeSysErrorFactory(err).cause).toHaveProperty('code', err.code);
            expect(nodeSysErrorFactory(err).cause).toHaveProperty('syscall', err.syscall);
            expect(nodeSysErrorFactory(err).cause).toHaveProperty('path', err.path);
        });
        
        it('should return ApiError with correct ApiError.reqDetails', () => {
            const syscall: string = 'str';
            const path: string = '<path>';
            const e = { message: 'msg', code: 'ECONNREFUSED', syscall: syscall, path: path };
            
            expect(nodeSysErrorFactory(e, requestDetails)).toHaveProperty('reqDetails');
            expect(nodeSysErrorFactory(e, requestDetails).reqDetails).toHaveProperty('syscall', syscall);
            expect(nodeSysErrorFactory(e, requestDetails).reqDetails).toHaveProperty('path', path);
            expect(nodeSysErrorFactory(e, requestDetails).reqDetails).toHaveProperty('req', requestDetails);
        });
    });
});

describe('httpErrorFactory:', () => {

    describe('property assignment validation:', () => {

        describe('ApiError.message validation:', () => {

            it('should return ApiError with e.message as ApiError.message', () => {
                expect(httpErrorFactory({ message: 'msg' })).toHaveProperty('message');
                expect(httpErrorFactory({ message: 'msg' }).message).toBeDefined();
                expect(httpErrorFactory({ message: 'msg' }).message).toMatch('msg');
            });

            it('should return ApiError with e.response.data.message as ApiError.message', () => {
                const obj = { response: { data: { message: 'msg' } } };
                expect(httpErrorFactory(obj)).toHaveProperty('message');
                expect(httpErrorFactory(obj).message).toBeDefined();
                expect(httpErrorFactory(obj).message).toMatch('msg');
            });

            it('should return ApiError with default message as ApiError.message', () => {
                expect(httpErrorFactory({})).toHaveProperty('message');
                expect(httpErrorFactory({}).message).toBeDefined();
                expect(httpErrorFactory({}).message).toMatch('HTTP error');
            });
        });

        describe('ApiError.status validation:', () => {
            const validInstances: Array<any> = [
                { status: 200 },
                { statusCode: 204 },
                { response: { status: 300 } },
                { invalidProp: {} }
            ];

            const invalidStatuses: Array<any> = [
                { status: 'str' as string }, 
                { status: BigInt(123) as bigint }, 
                { status: undefined }, 
                { status: null }, 
                { status: [] }, 
                { status: {} }
            ];

            const invalidStatusCodes: Array<any> = [
                { statusCode: 'str' as string }, 
                { statusCode: BigInt(123) as bigint }, 
                { statusCode: undefined }, 
                { statusCode: null }, 
                { statusCode: [] }, 
                { statusCode: {} }
            ];

            it('should return ApiError with e.status as ApiError.status', () => {
                const e = validInstances.find(obj => 'status' in obj);
                expect(httpErrorFactory(e)).toHaveProperty('status');
                expect(httpErrorFactory(e).status).toBeDefined();
                expect(httpErrorFactory(e).status).toBe(200);
            });

            it('should return ApiError with e.statusCode as ApiError.status', () => {
                const e = validInstances.find(obj => 'statusCode' in obj);
                expect(httpErrorFactory(e)).toHaveProperty('status');
                expect(httpErrorFactory(e).status).toBeDefined();
                expect(httpErrorFactory(e).status).toBe(204);
            });
            
            it('should return ApiError with e.response.status as ApiError.status', () => {
                const e = validInstances.find(obj => 'response' in obj);
                expect(httpErrorFactory(e)).toHaveProperty('status');
                expect(httpErrorFactory(e).status).toBeDefined();
                expect(httpErrorFactory(e).status).toBe(300);
            });
            
            describe('should return ApiError with default status (500) as ApiError.status as a fallback for invalid status data', () => {

                it('no field provided as status/statusCode/response.status should return default status', () => {
                    const e = validInstances.filter(obj => 'invalidProp' in obj);
                    expect(httpErrorFactory(e)).toHaveProperty('status');
                    expect(httpErrorFactory(e).status).toBeDefined();
                    expect(httpErrorFactory(e).status).toBe(500);
                });

                test.each(invalidStatuses)('invalid e.status types should return default status', (err) => {
                    expect(httpErrorFactory(err)).toHaveProperty('status');
                    expect(httpErrorFactory(err).status).toBeDefined();
                    expect(httpErrorFactory(err).status).toBe(500);
                });

                test.each(invalidStatusCodes)('invalid e.statusCode types should return default status', (err) => {
                    expect(httpErrorFactory(err)).toHaveProperty('status');
                    expect(httpErrorFactory(err).status).toBeDefined();
                    expect(httpErrorFactory(err).status).toBe(500);
                });
            });
        });

        describe('ApiError.internalCause validation:', () => {

            it('should return ApiError with e.name as ApiError.internalCause', () => {
                const e = { name: 'placeholder' };
                expect(httpErrorFactory(e)).toHaveProperty('internalCause');
                expect(httpErrorFactory(e).internalCause).toBeDefined();
                expect(httpErrorFactory(e).internalCause).toMatch(e.name);
            });

            it('should return ApiError with default internalCause as ApiError.internalCause', () => {
                const e = { x: NaN };
                expect(httpErrorFactory(e)).toHaveProperty('internalCause');
                expect(httpErrorFactory(e).internalCause).toBeDefined();
                expect(httpErrorFactory(e).internalCause).toMatch('http_error');
            });
        });

        describe('ApiError.code validation:', () => {

            it('should return ApiError with e.code as ApiError.code', () => {
                const e = { code: 'str' };
                expect(httpErrorFactory(e)).toHaveProperty('code');
                expect(httpErrorFactory(e).code).toBeDefined();
                expect(httpErrorFactory(e).code).toMatch(e.code);
            });

            it('should return ApiError with default code (undefined) as ApiError.code (should be undefined)', () => {
                const e = { x: NaN };
                expect(httpErrorFactory(e)).toHaveProperty('code', undefined);
                expect(httpErrorFactory(e).code).toBeUndefined();
            });
        });

        describe('ApiError.cause validation:', () => {
            
            it('should return ApiError with e.response as ApiError.cause', () => {
                const e = { response: { a: 'str', b: NaN } };
                expect(httpErrorFactory(e)).toHaveProperty('cause');
                expect(httpErrorFactory(e).cause).toBeDefined();
                expect(httpErrorFactory(e).cause).toStrictEqual(e.response);
            });

            it('should return ApiError with default cause (e itself) as ApiError.cause', () => {
                const e = { a: 'str', b: NaN };
                expect(httpErrorFactory(e)).toHaveProperty('cause');
                expect(httpErrorFactory(e).cause).toBeDefined();
                expect(httpErrorFactory(e).cause).toStrictEqual(e);
            });
        });

        describe('ApiError.reqDetails validation:', () => {

            it('should return ApiError with proper reqDetails as ApiError.reqDetails', () => {
                const e = {
                    headers: ['a', 'b', 'c'],
                    response: { data: { x: 'str', y: {} } }
                };
                expect(httpErrorFactory(e, requestDetails)).toHaveProperty('reqDetails');
                expect(httpErrorFactory(e, requestDetails).reqDetails).toBeDefined();
                expect(httpErrorFactory(e, requestDetails).reqDetails).toHaveProperty('headers');
                expect(httpErrorFactory(e, requestDetails).reqDetails).toHaveProperty('body');
                expect(httpErrorFactory(e, requestDetails).reqDetails).toHaveProperty('req');
                expect(httpErrorFactory(e, requestDetails).reqDetails).toEqual({ headers: e.headers, body: e.response.data, req: requestDetails });
            });
        });
    });
    
    describe('returned object validation:', () => {

        it('should return ApiError with correct properties assigned', () => {
            const e = { message: 'msg', status: 200, name: 'placeholder', code: '123', headers: ['h1', 'h2', 'h3'], response: { data: 'data', _: { x: 1, y: 2 } } };
            
            expect(httpErrorFactory(e, requestDetails)).toBeInstanceOf(ApiError);
            expect(httpErrorFactory(e, requestDetails)).toHaveProperty('name', 'ApiError');
            expect(httpErrorFactory(e, requestDetails)).toHaveProperty('message', e.message);
            expect(httpErrorFactory(e, requestDetails)).toHaveProperty('status', e.status);
            expect(httpErrorFactory(e, requestDetails)).toHaveProperty('instance', ErrorInstance.HTTP);
            expect(httpErrorFactory(e, requestDetails)).toHaveProperty('internalCause', e.name);
            expect(httpErrorFactory(e, requestDetails)).toHaveProperty('isOperational', true);
            expect(httpErrorFactory(e, requestDetails)).toHaveProperty('code', e.code);
            expect(httpErrorFactory(e, requestDetails)).toHaveProperty('cause', e.response);
            expect(httpErrorFactory(e, requestDetails)).toHaveProperty('reqDetails');
            expect(httpErrorFactory(e, requestDetails).reqDetails).toHaveProperty('headers', e.headers);
            expect(httpErrorFactory(e, requestDetails).reqDetails).toHaveProperty('body', e.response.data);
            expect(httpErrorFactory(e, requestDetails).reqDetails).toHaveProperty('req', requestDetails);
        });
    });
});

describe('aggregateErrorFactory:', () => {

    describe('property assignment validation:', () => {

        it('e.message & e.internalCause sets to default when both are non-string and/or not provided', () => {
            const err = { message: NaN as number, name: NaN as number };
            const defaultMsg: string = 'Aggregate error: multiple errors occured';
            const defaultInternalCause: string = 'aggregate_error';

            expect(aggregateErrorFactory(err)).toHaveProperty('message', defaultMsg);
            expect(aggregateErrorFactory(err)).toHaveProperty('internalCause', defaultInternalCause);

            expect(aggregateErrorFactory(err).message).toBe(defaultMsg);
            expect(aggregateErrorFactory(err).internalCause).toBe(defaultInternalCause);

            expect(aggregateErrorFactory(err).message).not.toBe(err.message);
            expect(aggregateErrorFactory(err).internalCause).not.toBe(err.name);
        });

        describe('ApiError.cause assignment', () => {

            test('should set ApiError.cause to e.errors when provided', () => {
                const err = { errors: [1, 2, 3] };
                expect(aggregateErrorFactory(err)).toHaveProperty('cause', err.errors);
                expect(aggregateErrorFactory(err).cause).toEqual(err.errors);
            });

            test('should set ApiError.cause to param e itself when e.errors does not exist ', () => {
                expect(aggregateErrorFactory({ x: 'x', y: NaN })).toHaveProperty('cause', { x: 'x', y: NaN });
                expect(aggregateErrorFactory({ x: 'x', y: NaN }).cause).toEqual({ x: 'x', y: NaN });
            });
        });
    });
    
    describe('returned object validation:', () => {

        it('should return ApiError with correct property values', () => {
            const err = { message: 'msg', name: 'placeholder', errors: ['a', 'b', 'c'] };
            
            expect(aggregateErrorFactory(err)).toBeInstanceOf(ApiError);

            expect(aggregateErrorFactory(err)).toHaveProperty('name', 'ApiError');
            expect(aggregateErrorFactory(err)).toHaveProperty('message', 'msg');
            expect(aggregateErrorFactory(err)).toHaveProperty('status', 400);
            expect(aggregateErrorFactory(err)).toHaveProperty('instance', ErrorInstance.AGGREGATE);
            expect(aggregateErrorFactory(err)).toHaveProperty('internalCause', err.name);
            expect(aggregateErrorFactory(err)).toHaveProperty('isOperational', true);
            expect(aggregateErrorFactory(err)).toHaveProperty('code', undefined);
            expect(aggregateErrorFactory(err)).toHaveProperty('cause', err.errors);
            expect(aggregateErrorFactory(err)).toHaveProperty('reqDetails', { length: 3, req: undefined });

            expect(aggregateErrorFactory(err).name).toBe('ApiError');
            expect(aggregateErrorFactory(err).message).toBe('msg');
            expect(aggregateErrorFactory(err).status).toBe(400);
            expect(aggregateErrorFactory(err).instance).toBe(ErrorInstance.AGGREGATE);
            expect(aggregateErrorFactory(err).internalCause).toBe(err.name);
            expect(aggregateErrorFactory(err).isOperational).toBeTruthy();
            expect(aggregateErrorFactory(err).code).toBeUndefined();
            expect(aggregateErrorFactory(err).cause).toEqual(err.errors);
            expect(aggregateErrorFactory(err).reqDetails).toStrictEqual({ length: 3, req: undefined });
        });

        describe('ApiError.reqDetails properties assignment validation (.length & .req):', () => {

            test('should set ApiError.reqDetails.length to e.errors length', () => {
                expect(aggregateErrorFactory({ errors: [1, 2, 3] })).toHaveProperty('reqDetails.length', 3);
                expect(aggregateErrorFactory({ errors: [1, 2, 3] }).reqDetails).toHaveProperty('length', 3);
                expect(aggregateErrorFactory({ errors: [1, 2, 3] }).reqDetails).toStrictEqual({ length: 3, req: undefined });
            });

            test('should set ApiError.reqDetails.length to undefined when e.errors is not an array', () => {
                expect(aggregateErrorFactory({ errors: NaN as number })).toHaveProperty('reqDetails.length', undefined);
                expect(aggregateErrorFactory({ errors: NaN as number }).reqDetails).toHaveProperty('length', undefined);
                expect(aggregateErrorFactory({ errors: NaN as number }).reqDetails).toStrictEqual({ length: undefined, req: undefined });

                expect(aggregateErrorFactory({ errors: 'str' as string })).toHaveProperty('reqDetails.length', undefined);
                expect(aggregateErrorFactory({ errors: 'str' as string }).reqDetails).toHaveProperty('length', undefined);
                expect(aggregateErrorFactory({ errors: 'str' as string }).reqDetails).toStrictEqual({ length: undefined, req: undefined });

                expect(aggregateErrorFactory({ errors: BigInt(123) as bigint })).toHaveProperty('reqDetails.length', undefined);
                expect(aggregateErrorFactory({ errors: BigInt(123) as bigint }).reqDetails).toHaveProperty('length', undefined);
                expect(aggregateErrorFactory({ errors: BigInt(123) as bigint }).reqDetails).toStrictEqual({ length: undefined, req: undefined });

                expect(aggregateErrorFactory({ errors: undefined })).toHaveProperty('reqDetails.length', undefined);
                expect(aggregateErrorFactory({ errors: undefined }).reqDetails).toHaveProperty('length', undefined);
                expect(aggregateErrorFactory({ errors: undefined }).reqDetails).toStrictEqual({ length: undefined, req: undefined });

                expect(aggregateErrorFactory({ errors: null })).toHaveProperty('reqDetails.length', undefined);
                expect(aggregateErrorFactory({ errors: null }).reqDetails).toHaveProperty('length', undefined);
                expect(aggregateErrorFactory({ errors: null }).reqDetails).toStrictEqual({ length: undefined, req: undefined });

                expect(aggregateErrorFactory({ errors: {} })).toHaveProperty('reqDetails.length', undefined);
                expect(aggregateErrorFactory({ errors: {} }).reqDetails).toHaveProperty('length', undefined);
                expect(aggregateErrorFactory({ errors: {} }).reqDetails).toStrictEqual({ length: undefined, req: undefined });

                expect(aggregateErrorFactory({})).toHaveProperty('reqDetails.length', undefined);
                expect(aggregateErrorFactory({}).reqDetails).toHaveProperty('length', undefined);
                expect(aggregateErrorFactory({}).reqDetails).toStrictEqual({ length: undefined, req: undefined });
            });

            test('should set ApiError.reqDetails.req to undefined when req is not provided', () => {
                expect(aggregateErrorFactory({})).toHaveProperty('reqDetails.req', undefined);
                expect(aggregateErrorFactory({}).reqDetails).toHaveProperty('req', undefined);
                expect(aggregateErrorFactory({}).reqDetails).toStrictEqual({ length: undefined, req: undefined });

                expect(aggregateErrorFactory({}, undefined)).toHaveProperty('reqDetails.req', undefined);
                expect(aggregateErrorFactory({}, undefined).reqDetails).toHaveProperty('req', undefined);
                expect(aggregateErrorFactory({}, undefined).reqDetails).toStrictEqual({ length: undefined, req: undefined });
            });

            test('should set ApiError.reqDetails.req to requestDetails when provided as param', () => {
                expect(aggregateErrorFactory({}, requestDetails)).toHaveProperty('reqDetails.req', requestDetails);
                expect(aggregateErrorFactory({}, requestDetails).reqDetails).toEqual({ length: undefined, req: requestDetails});
            });
        });
    });
});

describe('nativeErrorFactory:', () => {

    describe('invalid param behavior:', () => {

        it('should return ApiError object with proper properties when params are invalid', () => {
            const err1 = undefined;
            const err2 = null;
            const req = undefined;

            expect(nativeErrorFactory(err1)).toBeInstanceOf(ApiError);
            expect(nativeErrorFactory(err2)).toBeInstanceOf(ApiError);
            expect(nativeErrorFactory(err1, req)).toBeInstanceOf(ApiError);
            expect(nativeErrorFactory(err2, req)).toBeInstanceOf(ApiError);

            expect(nativeErrorFactory(err1)).toHaveProperty('message', 'Internal server error');
            expect(nativeErrorFactory(err1)).toHaveProperty('status', 500);
            expect(nativeErrorFactory(err1)).toHaveProperty('instance', ErrorInstance.NATIVE);
            expect(nativeErrorFactory(err1)).toHaveProperty('internalCause', 'native_error');
            expect(nativeErrorFactory(err1)).toHaveProperty('isOperational', false);
            expect(nativeErrorFactory(err1)).toHaveProperty('code', undefined);
            expect(nativeErrorFactory(err1)).toHaveProperty('cause', err1);
            expect(nativeErrorFactory(err1)).toHaveProperty('reqDetails.stack', undefined);
            expect(nativeErrorFactory(err1)).toHaveProperty('reqDetails.req', undefined);

            expect(nativeErrorFactory(err2)).toHaveProperty('message', 'Internal server error');
            expect(nativeErrorFactory(err2)).toHaveProperty('status', 500);
            expect(nativeErrorFactory(err2)).toHaveProperty('instance', ErrorInstance.NATIVE);
            expect(nativeErrorFactory(err2)).toHaveProperty('internalCause', 'native_error');
            expect(nativeErrorFactory(err2)).toHaveProperty('isOperational', false);
            expect(nativeErrorFactory(err2)).toHaveProperty('code', undefined);
            expect(nativeErrorFactory(err2)).toHaveProperty('cause', err2);
            expect(nativeErrorFactory(err2)).toHaveProperty('reqDetails.stack', undefined);
            expect(nativeErrorFactory(err2)).toHaveProperty('reqDetails.req', undefined);

            expect(nativeErrorFactory(err1, req).reqDetails).toStrictEqual({ stack: undefined, req: undefined });
            expect(nativeErrorFactory(err2, req).reqDetails).toStrictEqual({ stack: undefined, req: undefined });
        });

        test('should set default ApiError.message when err.message is not a string', () => {
            expect(nativeErrorFactory({ message: undefined }).message).toBe('Internal server error');
            expect(nativeErrorFactory({ message: null }).message).toBe('Internal server error');
            expect(nativeErrorFactory({ message: NaN as number }).message).toBe('Internal server error');
            expect(nativeErrorFactory({ message: BigInt(123) as bigint }).message).toBe('Internal server error');
            expect(nativeErrorFactory({ message: [] as Array<unknown> }).message).toBe('Internal server error');
            expect(nativeErrorFactory({ message: {} as any }).message).toBe('Internal server error');
        });

        test('should set default ApiError.internalCause when err.name is not a string', () => {
            expect(nativeErrorFactory({ name: undefined }).internalCause).toBe('native_error');
            expect(nativeErrorFactory({ name: null }).internalCause).toBe('native_error');
            expect(nativeErrorFactory({ name: NaN as number }).internalCause).toBe('native_error');
            expect(nativeErrorFactory({ name: BigInt(123) as bigint }).internalCause).toBe('native_error');
            expect(nativeErrorFactory({ name: [] as Array<unknown>}).internalCause).toBe('native_error');
            expect(nativeErrorFactory({ name: {} as any }).internalCause).toBe('native_error');
        });
    });
    
    describe('returned ApiError object validation:', () => {
        const err = { message: 'msg', name: 'placeholder', code: 'example_code', x: NaN, y: { a: [], b: null } };

        it('should set properties correct', () => {
            expect(nativeErrorFactory(err)).toHaveProperty('message', 'msg');
            expect(nativeErrorFactory(err)).toHaveProperty('status', 500);
            expect(nativeErrorFactory(err)).toHaveProperty('instance', ErrorInstance.NATIVE);
            expect(nativeErrorFactory(err)).toHaveProperty('internalCause', 'placeholder');
            expect(nativeErrorFactory(err)).toHaveProperty('isOperational', false);
            expect(nativeErrorFactory(err)).toHaveProperty('code', 'example_code');
            expect(nativeErrorFactory(err)).toHaveProperty('cause', err);
            expect(nativeErrorFactory(err)).toHaveProperty('reqDetails', { stack: undefined, req: undefined });
            expect(nativeErrorFactory(err)).toHaveProperty('name', 'ApiError');

            expect(nativeErrorFactory(err).message).toBe('msg');
            expect(nativeErrorFactory(err).status).toBe(500);
            expect(nativeErrorFactory(err).instance).toBe(ErrorInstance.NATIVE);
            expect(nativeErrorFactory(err).internalCause).toBe('placeholder');
            expect(nativeErrorFactory(err).isOperational).toBeFalsy();
            expect(nativeErrorFactory(err).code).toBe('example_code');
            expect(nativeErrorFactory(err).cause).toBe(err);
            expect(nativeErrorFactory(err).name).toBe('ApiError');
            expect(nativeErrorFactory(err).reqDetails).toHaveProperty('stack', undefined);
            expect(nativeErrorFactory(err).reqDetails).toHaveProperty('req', undefined);
        });

        it('should set ApiError.reqDetails.stack & ApiError.reqDetails.req to err.stack & req when both are provided (both passed as param)', () => {
            const err = { stack: { a: 1, b: 2, c: 3 } };

            expect(nativeErrorFactory(err, requestDetails).reqDetails).toBeDefined();
            expect(nativeErrorFactory(err, requestDetails)).toHaveProperty('reqDetails', { stack: err.stack, req: requestDetails });
            expect(nativeErrorFactory(err, requestDetails).reqDetails).toHaveProperty('stack', err.stack);
            expect(nativeErrorFactory(err, requestDetails).reqDetails).toHaveProperty('req', requestDetails);
        });
    });
    
    describe('property assignment validation:', () => {

        test('should set ApiError.message to err.message (err is passed as param)', () => {
            const err = { message: 'msg', x: NaN, y: { a: [], b: null } };

            expect(nativeErrorFactory(err)).toHaveProperty('message', 'msg');
            expect(nativeErrorFactory(err).message).toBeDefined();
            expect(nativeErrorFactory(err).message).toBe('msg');
        });
        
        test('should set ApiError.message to fixed default message when err.message does not exist', () => {
            const err = { x: 'placeholder', y: { a: NaN, b: []} };

            expect(nativeErrorFactory(err)).toHaveProperty('message', 'Internal server error');
            expect(nativeErrorFactory(err).message).toBeDefined();
            expect(nativeErrorFactory(err).message).toBe('Internal server error');
        });
        
        test('should set ApiError.internalCause to err.name (err is passed as param)', () => {
            const err = { name: 'placeholder_name', x: NaN, y: { a: null, b: [] } };

            expect(nativeErrorFactory(err)).toHaveProperty('internalCause', 'placeholder_name');
            expect(nativeErrorFactory(err).internalCause).toBeDefined();
            expect(nativeErrorFactory(err).internalCause).toBe('placeholder_name');
        });
        
        test('should set ApiError.internalCause to fixed default internalCause when err.name does not exist', () => {
            const err = { x: 'placeholder', y: { a: NaN, b: []} };

            expect(nativeErrorFactory(err)).toHaveProperty('internalCause', 'native_error');
            expect(nativeErrorFactory(err).internalCause).toBeDefined();
            expect(nativeErrorFactory(err).internalCause).toBe('native_error');
        });
        
        test('should set ApiError.cause to err object itself passed as param', () => {
            const err = { x: 'some_value', y: NaN, z: [], q: {} };
            
            expect(nativeErrorFactory(err)).toHaveProperty('cause', err);
            expect(nativeErrorFactory(err).cause).toBeDefined();
            expect(nativeErrorFactory(err).cause).toBe(err);
        });
    });
});

describe('unclassifiedErrorFactory:', () => {

    describe('returned ApiError object:', () => {

        const expected = new ApiError(
            'Unknown error: error instance could not be classified',
            500, ErrorInstance.UNCLASSIFIED, 'unclassified_error', true, undefined
        );

        it('should return ApiError with expected properties', () => {
            expect(unclassifiedErrorFactory({})).toBeInstanceOf(ApiError);
            expect(unclassifiedErrorFactory({})).toHaveProperty('name', 'ApiError');
            expect(unclassifiedErrorFactory({}).name).toBe('ApiError');

            expect(unclassifiedErrorFactory({})).toHaveProperty('message', expected.message);
            expect(unclassifiedErrorFactory({ message: 'msg' })).toHaveProperty('message', 'msg');
            expect(unclassifiedErrorFactory({})).toHaveProperty('status', expected.status);
            expect(unclassifiedErrorFactory({})).toHaveProperty('instance', expected.instance);
            expect(unclassifiedErrorFactory({})).toHaveProperty('internalCause', expected.internalCause);
            expect(unclassifiedErrorFactory({})).toHaveProperty('isOperational', expected.isOperational);
            expect(unclassifiedErrorFactory({})).toHaveProperty('code', expected.code);
            expect(unclassifiedErrorFactory({})).toHaveProperty('cause', {});
            expect(unclassifiedErrorFactory({})).toHaveProperty('reqDetails', { undefined });
            
            expect(unclassifiedErrorFactory({}).message).toBe('Unknown error: error instance could not be classified');
            expect(unclassifiedErrorFactory({}).status).toBe(500);
            expect(unclassifiedErrorFactory({}).instance).toBe(ErrorInstance.UNCLASSIFIED);
            expect(unclassifiedErrorFactory({}).internalCause).toBe('unclassified_error');
            expect(unclassifiedErrorFactory({}).isOperational).toBe(true);
            expect(unclassifiedErrorFactory({}).code).toBeUndefined();
            expect(unclassifiedErrorFactory({}).cause).toStrictEqual({});
            expect(unclassifiedErrorFactory({}).reqDetails).toBeDefined();
            expect(unclassifiedErrorFactory({}).reqDetails).toStrictEqual({ req: undefined });
        });
    });

    describe('invalid param behavior:', () => {
        const err1 = undefined;
        const err2 = null;
        const details = undefined;

        it('should set ApiError.message properly', () => {
            expect(unclassifiedErrorFactory({})).toHaveProperty('message', 'Unknown error: error instance could not be classified');
            expect(unclassifiedErrorFactory({}).message).toBe('Unknown error: error instance could not be classified');

            expect(unclassifiedErrorFactory({ message: 'msg' })).toHaveProperty('message', 'msg');
            expect(unclassifiedErrorFactory({ message: 'msg' }).message).toBe('msg');
        });

        it('should return ApiError with err as cause and requestDetails', () => {
            expect(unclassifiedErrorFactory(err1)).toBeInstanceOf(ApiError);
            expect(unclassifiedErrorFactory(err1)).toHaveProperty('cause', err1);
            expect(unclassifiedErrorFactory(err1).cause).toBeUndefined();
            expect(unclassifiedErrorFactory(err1).reqDetails).toBeDefined();
            expect(unclassifiedErrorFactory(err1).reqDetails).toStrictEqual({ req: undefined });

            expect(unclassifiedErrorFactory(err2)).toBeInstanceOf(ApiError);
            expect(unclassifiedErrorFactory(err2)).toHaveProperty('cause', err2);
            expect(unclassifiedErrorFactory(err2).reqDetails).toBeDefined();
            expect(unclassifiedErrorFactory(err2).reqDetails).toStrictEqual({ req: undefined });

            expect(unclassifiedErrorFactory(err1, details)).toBeInstanceOf(ApiError);
            expect(unclassifiedErrorFactory(err1, details)).toHaveProperty('cause', err1);
            expect(unclassifiedErrorFactory(err1, details).reqDetails).toBeDefined();
            expect(unclassifiedErrorFactory(err2).reqDetails).toStrictEqual({ req: undefined });

            expect(unclassifiedErrorFactory(err2, details)).toBeInstanceOf(ApiError);
            expect(unclassifiedErrorFactory(err2, details)).toHaveProperty('cause', err2);
            expect(unclassifiedErrorFactory(err2, details).reqDetails).toBeDefined();
            expect(unclassifiedErrorFactory(err2).reqDetails).toStrictEqual({ req: undefined });
        });
    });
});

describe('unknownErrorObjectFacory:', () => {

    const expected = new ApiError(
        'Unknown error object (unable to map error properties)',
        500, ErrorInstance.UNKNOWN, 'unknown_error',
        true, undefined
    );

    describe('returned ApiError object:', () => {

        it('should return ApiError with expected properties', () => {
            expect(unknownErrorObjectFacory({})).toBeInstanceOf(ApiError);
            expect(unknownErrorObjectFacory({})).toHaveProperty('name', 'ApiError');
            expect(unknownErrorObjectFacory({}).name).toBe('ApiError');

            expect(unknownErrorObjectFacory({})).toHaveProperty('message', expected.message);
            expect(unknownErrorObjectFacory({})).toHaveProperty('status', expected.status);
            expect(unknownErrorObjectFacory({})).toHaveProperty('instance', expected.instance);
            expect(unknownErrorObjectFacory({})).toHaveProperty('internalCause', expected.internalCause);
            expect(unknownErrorObjectFacory({})).toHaveProperty('isOperational', expected.isOperational);
            expect(unknownErrorObjectFacory({})).toHaveProperty('code', expected.code);
            expect(unknownErrorObjectFacory({})).toHaveProperty('cause', {});
            expect(unknownErrorObjectFacory({})).toHaveProperty('reqDetails', { undefined });
            
            expect(unknownErrorObjectFacory({}).message).toBe('Unknown error object (unable to map error properties)');
            expect(unknownErrorObjectFacory({}).status).toBe(500);
            expect(unknownErrorObjectFacory({}).instance).toBe(ErrorInstance.UNKNOWN);
            expect(unknownErrorObjectFacory({}).internalCause).toBe('unknown_error');
            expect(unknownErrorObjectFacory({}).isOperational).toBe(true);
            expect(unknownErrorObjectFacory({}).code).toBeUndefined();
            expect(unknownErrorObjectFacory({}).cause).toStrictEqual({});
            expect(unknownErrorObjectFacory({}).reqDetails).toBeDefined();
            expect(unknownErrorObjectFacory({}).reqDetails).toStrictEqual({ req: undefined });
        });
    });

    describe('invalid param behavior:', () => {
        const err1 = undefined;
        const err2 = null;
        const details = undefined;

        test('should return ApiError with err as cause and no requestDetails', () => {
            expect(unknownErrorObjectFacory(err1)).toBeInstanceOf(ApiError);
            expect(unknownErrorObjectFacory(err1)).toHaveProperty('cause', err1);
            expect(unknownErrorObjectFacory(err1).cause).toBeUndefined();
            expect(unknownErrorObjectFacory(err1).reqDetails).toBeDefined();
            expect(unknownErrorObjectFacory(err1).reqDetails).toStrictEqual({ req: undefined });

            expect(unknownErrorObjectFacory(err2)).toBeInstanceOf(ApiError);
            expect(unknownErrorObjectFacory(err2)).toHaveProperty('cause', err2);
            expect(unknownErrorObjectFacory(err2).reqDetails).toBeDefined();
            expect(unknownErrorObjectFacory(err2).reqDetails).toStrictEqual({ req: undefined });

            expect(unknownErrorObjectFacory(err1, details)).toBeInstanceOf(ApiError);
            expect(unknownErrorObjectFacory(err1, details)).toHaveProperty('cause', err1);
            expect(unknownErrorObjectFacory(err1, details).reqDetails).toBeDefined();
            expect(unknownErrorObjectFacory(err2).reqDetails).toStrictEqual({ req: undefined });

            expect(unknownErrorObjectFacory(err2, details)).toBeInstanceOf(ApiError);
            expect(unknownErrorObjectFacory(err2, details)).toHaveProperty('cause', err2);
            expect(unknownErrorObjectFacory(err2, details).reqDetails).toBeDefined();
            expect(unknownErrorObjectFacory(err2).reqDetails).toStrictEqual({ req: undefined });
        });
    });
});