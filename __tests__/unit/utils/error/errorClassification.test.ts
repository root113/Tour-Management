import { __testInternals__ } from "../../../../src/utils/error/errorClassification.util";
import { ApiError, PrismaError, RedisError, ErrorInstance } from "../../../../src/errors/ApiError";

type MockPrismaDetails = {
    prismaClientErrType: any,
    errorMessage: string,
    clientVersion: string,
    prismaCode?: string | undefined,
    meta?: any
};

type MockRedisDetails = {
    name: string,
    message: string,
    stack?: string,
    code?: string,
    command?: { cmd: string, args?: any[] } | undefined,
    conn?: { adress?: string, port?: number } | undefined,
    parseContext?: { buffer?: string, offset?: number }
};

const {
    isApiError,
    isPrismaKnownError,
    isPrismaAnyError,
    isRedisError,
    isPostgresError,
    isNodeSysError,
    isHttpError,
    isAggregateError,
    isNativeError,
    _assignPrimary,
    _isObject,
    _isFiveCharCode,
    _isPrismaCode
} = __testInternals__;

function __foo() { return 'test type: function' }

describe('isApiError:', () => {

    beforeEach(() => jest.clearAllMocks());
    afterEach(() => jest.resetAllMocks());

    it('isObject check should return false for invalid params', () => {
        expect(isApiError(undefined)).toBeFalsy();
        expect(isApiError(null)).toBeFalsy();
        expect(isApiError('str' as string)).toBeFalsy();
        expect(isApiError(BigInt(234) as bigint)).toBeFalsy();
        expect(isApiError(NaN as number)).toBeFalsy();
        expect(isApiError(true as boolean)).toBeFalsy();
        expect(isApiError(__foo())).toBeFalsy();
    });

    it('should return true when object is an Error instance and has status & instance fields', () => {
        const errApi = new ApiError('msg', 500 as number, ErrorInstance.AGGREGATE as string, 'internal', true);
        const errPrisma = new PrismaError('msg', 409 as number, ErrorInstance.PRISMA as string, 'internal', true, {} as MockPrismaDetails);
        const errRedis = new RedisError('msg', 412 as number, ErrorInstance.REDIS as string, 'internal', false, {} as MockRedisDetails);

        expect(isApiError(errApi)).toBeTruthy();
        expect(isApiError(errPrisma)).toBeTruthy();
        expect(isApiError(errRedis)).toBeTruthy();
    });

    it('should return false when instance is Error but does not have status and/or instance fields', () => {
        class _MockError extends Error {
            private readonly status?: number;
            private readonly instance?: ErrorInstance | string;

            constructor(message: string, status?: number, instance?: ErrorInstance | string) {
                super(message);
                if(status) this.status = status;
                if(instance) this.instance = instance;
            }
        }

        const err1 = new _MockError('msg');
        const err2 = new _MockError('msg', 200);

        expect(isApiError(err1)).toBeFalsy();
        expect(isApiError(err2)).toBeFalsy();
    });

    it('should return false when has status & instance fields but not an instanceof Error', () => {
        const err = { status: 123, instance: ErrorInstance.API } as object;
        expect(isApiError(err)).toBeFalsy();
    });
    
    it('should return false for invalid status and/or instance types', () => {
        class _MockError extends Error {
            private readonly status?: any;
            private readonly instance?: any;

            constructor(message: string, status?: any, instance?: any) {
                super(message);
                if(status) this.status = status;
                if(instance) this.instance = instance;
            }
        }

        const err1 = new _MockError('msg', 'str');
        const err2 = new _MockError('msg', undefined);
        const err3 = new _MockError('msg', null);
        const err4 = new _MockError('msg', true);
        const err5 = new _MockError('msg', {});
        const err6 = new _MockError('msg', []);

        const err7 = new _MockError('msg', NaN, 123 as number);
        const err8 = new _MockError('msg', NaN, undefined);
        const err9 = new _MockError('msg', NaN, null);
        const err10 = new _MockError('msg', NaN, false);
        const err11 = new _MockError('msg', NaN, {});
        const err12 = new _MockError('msg', NaN, []);

        expect(isApiError(err1)).toBeFalsy();
        expect(isApiError(err2)).toBeFalsy();
        expect(isApiError(err3)).toBeFalsy();
        expect(isApiError(err4)).toBeFalsy();
        expect(isApiError(err5)).toBeFalsy();
        expect(isApiError(err6)).toBeFalsy();
        expect(isApiError(err7)).toBeFalsy();
        expect(isApiError(err8)).toBeFalsy();
        expect(isApiError(err9)).toBeFalsy();
        expect(isApiError(err10)).toBeFalsy();
        expect(isApiError(err11)).toBeFalsy();
        expect(isApiError(err12)).toBeFalsy();
    });

    it('should return true for valid status and/or instance types', () => {
        const status: number = 500;
        const instance: string = ErrorInstance.API;
        const err = new ApiError('msg', status, instance, 'internal', true);
        expect(isApiError(err)).toBeTruthy();
    });
});

describe('isPrismaKnownError:', () => {
    beforeEach(() => jest.clearAllMocks());
    afterEach(() => jest.resetAllMocks());

    it('isObject check should return false for invalid params', () => {
        expect(isPrismaKnownError(undefined)).toBeFalsy();
        expect(isPrismaKnownError(null)).toBeFalsy();
        expect(isPrismaKnownError('str' as string)).toBeFalsy();
        expect(isPrismaKnownError(BigInt(234) as bigint)).toBeFalsy();
        expect(isPrismaKnownError(NaN as number)).toBeFalsy();
        expect(isPrismaKnownError(true as boolean)).toBeFalsy();
        expect(isPrismaKnownError(__foo())).toBeFalsy();
    });

    it('should return false for invalid and/or wrong e.name', () => {
        const propsAll = { msg: 'message_all', name: 'name_all', code: 'P2006' };
        const propsNoCode = { msg: 'message_no_code', name: 'PrismaClientKnownRequestError' };
        const propsNoName = { msg: 'message_no_name', code: 'code' };
        const propsRemoved = { msg: 'message_removed' };

        expect(isPrismaKnownError(propsAll)).toBeFalsy();
        expect(isPrismaKnownError(propsNoCode)).toBeFalsy();
        expect(isPrismaKnownError(propsNoName)).toBeFalsy();
        expect(isPrismaKnownError(propsRemoved)).toBeFalsy();
    });

    describe('e.code validation:', () => {
        const invalidChars = [
            '',
            ' ',
            'P',
            'P1',
            'P12',
            'P123',
            'P12345',
            'P123456',
            'P123456789',
            'p1234',
        ] as Array<string>;
        const invalidCodes: [...any] = [
            undefined,
            null,
            NaN,
            23 as number,
            BigInt(123) as bigint,
            true as boolean
        ];
        const errCases = new Array<{ name?: string, code?: any }>;

        invalidChars.forEach((c) => errCases.push({ name: 'PrismaClientKnownRequestError', code: c as string }));
        invalidCodes.forEach((c) => errCases.push({ name: 'PrismaClientKnownRequestError', code: c }));

        test.each(errCases)('return false for each invalid e.code', (err) => {
            expect(isPrismaKnownError(err)).toBeFalsy();
        });
    });

    describe('e.name verification:', () => {
        const invalidNames: Array<string> = [
            'sdfdggsdg',
            'Ojsdfjo',
            '324fgg33',
            'PrismaClientUnknownRequestError',
            'PrismaClientRustError',
            'RedisError',
            ' ',
            ''
        ];
        const errCases = new Array<{ name: string, code: string }>;
        invalidNames.forEach((n) => errCases.push({ name: n, code: 'P1234'}));
        
        const e: { name: string, code: string } = { name: 'PrismaClientKnownRequestError', code: 'P1234' } as any;
        test('return true for only, each matching correct e.name', () => expect(isPrismaKnownError(e)).toBeTruthy());

        test.each(errCases)('return false for each incorrect e.name', (err) => {
            expect(isPrismaKnownError(err)).toBeFalsy();
        });
    });
});

describe('isPrismaAnyError:', () => {
    beforeEach(() => jest.clearAllMocks());
    afterEach(() => jest.resetAllMocks());

    it('isObject check should return false for invalid params', () => {
        expect(isPrismaAnyError(undefined)).toBeFalsy();
        expect(isPrismaAnyError(null)).toBeFalsy();
        expect(isPrismaAnyError('str' as string)).toBeFalsy();
        expect(isPrismaAnyError(BigInt(234) as bigint)).toBeFalsy();
        expect(isPrismaAnyError(NaN as number)).toBeFalsy();
        expect(isPrismaAnyError(true as boolean)).toBeFalsy();
        expect(isPrismaAnyError(__foo())).toBeFalsy();
    });

    describe('e.name verification:', () => {
        const errCases = [
            { name: '' as string, code: NaN as number, clientVersion: NaN as number },
            { name: ' ' as string, code: NaN as number, clientVersion: NaN as number },
            { name: 'prisma' as string, code: NaN as number, clientVersion: NaN as number },
            { name: 'prismaSomeError' as string, code: NaN as number, clientVersion: NaN as number },
            { name: 'rismaError' as string, code: NaN as number, clientVersion: NaN as number },
        ];

        test.each(errCases)('return false for each e.name which does not start with Prisma', (err) => {
            expect(isPrismaAnyError(err)).toBeFalsy();
        });
    });

    test('should return true for e.name starts with Prisma', () => {
        const err: { name: string, code: string, clientVersion: string } = { name: 'PrismaSomeError', code: 'P1234', clientVersion: '' };
        expect(isPrismaAnyError(err)).toBeTruthy();
    });

    describe('error property type validation:', () => {
        const errCases = [
            // is name string and starts with `Prisma`
            { name: undefined, code: NaN as number, clientVersion: NaN as number },
            { name: null, code: NaN as number, clientVersion: NaN as number },
            { name: NaN as number, code: NaN as number, clientVersion: NaN as number },
            { name: BigInt(123) as bigint, code: NaN as number, clientVersion: NaN as number },
            { name: true as boolean, code: NaN as number, clientVersion: NaN as number },
            { name: {}, code: NaN as number, clientVersion: NaN as number },
            { name: [], code: NaN as number, clientVersion: NaN as number },
            
            // is code string & isPrismaCode
            { name: NaN as number, code: undefined, clientVersion: NaN as number },
            { name: NaN as number, code: null, clientVersion: NaN as number },
            { name: NaN as number, code: NaN as number, clientVersion: NaN as number },
            { name: NaN as number, code: BigInt(123) as bigint, clientVersion: NaN as number },
            { name: NaN as number, code: true as boolean, clientVersion: NaN as number },
            { name: NaN as number, code: {}, clientVersion: NaN as number },
            { name: NaN as number, code: [], clientVersion: NaN as number },

            // is clientVersion string
            { name: NaN as number, code: NaN as number, clientVersion: undefined },
            { name: NaN as number, code: NaN as number, clientVersion: null },
            { name: NaN as number, code: NaN as number, clientVersion: NaN as number },
            { name: NaN as number, code: NaN as number, clientVersion: BigInt(123) as bigint },
            { name: NaN as number, code: NaN as number, clientVersion: true as boolean },
            { name: NaN as number, code: NaN as number, clientVersion: {} },
            { name: NaN as number, code: NaN as number, clientVersion: [] }
        ];

        test.each(errCases)('return false for each invalid property type', (err) => { 
            expect(isPrismaAnyError(err)).toBeFalsy()
        });
    });
});

describe('isRedisError:', () => {
    beforeEach(() => jest.clearAllMocks());
    afterEach(() => jest.resetAllMocks());

    it('isObject check should return false for invalid params', () => {
        expect(isRedisError(undefined)).toBeFalsy();
        expect(isRedisError(null)).toBeFalsy();
        expect(isRedisError('str' as string)).toBeFalsy();
        expect(isRedisError(BigInt(234) as bigint)).toBeFalsy();
        expect(isRedisError(NaN as number)).toBeFalsy();
        expect(isRedisError(true as boolean)).toBeFalsy();
        expect(isRedisError(__foo())).toBeFalsy();
    });

    describe('does e.name matches with keys:', () => {
        const errCases: Array<{ message: number, name: string }> = [
            { message: NaN as number, name: 'RedisError' },
            { message: NaN as number, name: 'ParserError' },
            { message: NaN as number, name: 'ReplyError' },
            { message: NaN as number, name: 'AbortError' },
            { message: NaN as number, name: 'InterruptError' }
        ];

        test.each(errCases)('return true for each correct e.name keys', (err) => {
            expect(isRedisError(err)).toBeTruthy();
        });
    });

    test('should return false for incorrect e.name keys', () => {
        const err: { message: number, name: string } = { message: NaN as number, name: 'invalid_name' };
        expect(isRedisError(err)).toBeFalsy();
    });

    test('should return false for invalid Regex', () => {
        const err: { message: string, name: string } = { message: 'invalid_message', name: 'invalid_name' };
        expect(isRedisError(err)).toBeFalsy();
    });

    describe('e.name Regex validation:', () => {
        const errCases: Array<{ message: string, name: string }> = [
            { message: 'redis', name: 'invalid_name' },
            { message: 'Redis', name: 'invalid_name' },
            { message: 'ECONNREFUSED', name: 'invalid_name' },
            { message: 'CLUSTER', name: 'invalid_name' }
        ];
        test.each(errCases)('return true for each valid regex', (err) => {
            expect(isRedisError(err)).toBeTruthy();
        });
    });

    test('should return false when either e.name and/or e.message is missing', () => {
        const err1 = { message: 'invalid_message' };
        const err2 = { name: 'invalid_name' };
        const err3 = {};
        expect(isRedisError(err1)).toBeFalsy();
        expect(isRedisError(err2)).toBeFalsy();
        expect(isRedisError(err3)).toBeFalsy();
    });

    describe('e.message validation - string:', () => {
        const errCases: Array<{ message: any, name: string }> = [
            { message: undefined, name: 'invalid_name' },
            { message: null, name: 'invalid_name' },
            { message: NaN as number, name: 'invalid_name' },
            { message: BigInt(123) as bigint, name: 'invalid_name' },
            { message: true as boolean, name: 'invalid_name' },
            { message: {}, name: 'invalid_name' },
            { message: [], name: 'invalid_name' }
        ];
        test.each(errCases)('return false for each non-string error type', (err) => {
            expect(isRedisError(err)).toBeFalsy();
        });
    });
});

describe('isPostgresError:', () => {
    beforeEach(() => jest.clearAllMocks());
    afterEach(() => jest.resetAllMocks());

    it('isObject check should return false for invalid params', () => {
        expect(isPostgresError(undefined)).toBeFalsy();
        expect(isPostgresError(null)).toBeFalsy();
        expect(isPostgresError('str' as string)).toBeFalsy();
        expect(isPostgresError(BigInt(234) as bigint)).toBeFalsy();
        expect(isPostgresError(NaN as number)).toBeFalsy();
        expect(isPostgresError(true as boolean)).toBeFalsy();
        expect(isPostgresError(__foo())).toBeFalsy();
    });

    it('should return false if e.code and/or keyword properties missing', () => {
        const errNoCode: { code: string } = { code: '12345' };
        const errNoProps = {};
        expect(isPostgresError(errNoCode)).toBeFalsy();
        expect(isPostgresError(errNoProps)).toBeFalsy();
    });

    describe('e.code validation:', () => {
        let errCases: Array<unknown> = [
            { code: undefined, table: {} as any },
            { code: null, table: {} as any },
            { code: NaN as number, table: {} as any },
            { code: 123 as number, table: {} as any },
            { code: BigInt(123) as bigint, table: {} as any },
            { code: true as boolean, table: {} as any },
            { code: {}, table: {} as any },
            { code: [], table: {} as any },
            { code: 'invalid_string' as string, table: {} as any }
        ];

        test.each(errCases)('return false for each invalid code', (err) => {
            expect(isPostgresError(err)).toBeFalsy();
        });

        errCases.splice(0, errCases.length);

        errCases = [
            { code: '12345' as string, severity: {} as any },
            { code: '12345' as string, routine: {} as any },
            { code: '12345' as string, table: {} as any },
            { code: '12345' as string, constraint: {} as any },
        ];

        test.each(errCases)('return true for each error when any of the properties e.(severity | routine | table | constraint) exists', (err) => {
            expect(isPostgresError(err)).toBeTruthy();
        });
    });
});

describe('isNodeSysError:', () => {
    beforeEach(() => jest.clearAllMocks());
    afterEach(() => jest.resetAllMocks());

    it('isObject check should return false for invalid params', () => {
        expect(isNodeSysError(undefined)).toBeFalsy();
        expect(isNodeSysError(null)).toBeFalsy();
        expect(isNodeSysError('str' as string)).toBeFalsy();
        expect(isNodeSysError(BigInt(234) as bigint)).toBeFalsy();
        expect(isNodeSysError(NaN as number)).toBeFalsy();
        expect(isNodeSysError(true as boolean)).toBeFalsy();
        expect(isNodeSysError(__foo())).toBeFalsy();
    });

    test('should return false if code does not exist in error object', () => {
        const err = { syscall: {}, errno: {} };
        expect(isNodeSysError(err)).toBeFalsy();
    });

    test('should return true if code provided and other checks are valid', () => {
        const errWithSyscall = { code: '12345' as string, syscall: {} };
        const errWithErrno = { code: '12345' as string, errno: {} };
        expect(isNodeSysError(errWithSyscall)).toBeTruthy();
        expect(isNodeSysError(errWithErrno)).toBeTruthy();
    });

    describe('e.code 5-char validation:', () => {
        const errCases: Array<{ code: string, syscall?: any, errno?: any }> = [
            { code: '1234567' as string, syscall: {} },
            { code: '1234567' as string, errno: {} },
            { code: '123' as string, syscall: {} },
            { code: '123' as string, errno: {} },
            { code: '' as string, syscall: {} },
            { code: '' as string, errno: {} },
            { code: ' ' as string, syscall: {} },
            { code: ' ' as string, errno: {} }
        ];

        test.each(errCases)('return false for each non-five char e.code', (err) => {
            expect(isNodeSysError(err)).toBeFalsy();
        });
    });
});

describe('isHttpError:', () => {
    beforeEach(() => jest.clearAllMocks());
    afterEach(() => jest.resetAllMocks());

    it('isObject check should return false for invalid params', () => {
        expect(isHttpError(undefined)).toBeFalsy();
        expect(isHttpError(null)).toBeFalsy();
        expect(isHttpError('str' as string)).toBeFalsy();
        expect(isHttpError(BigInt(234) as bigint)).toBeFalsy();
        expect(isHttpError(NaN as number)).toBeFalsy();
        expect(isHttpError(true as boolean)).toBeFalsy();
        expect(isHttpError(__foo())).toBeFalsy();
    });

    describe('e.status or e.statusCode type validation:', () => {
        const errCases: Array<{ status?: any, statusCode?: any }> = [
            { status: undefined },
            { status: null },
            { status: ' ' as string },
            { status: BigInt(123) as bigint },
            { status: true as boolean },
            { status: {} },
            { status: [] },

            { statusCode: undefined },
            { statusCode: null },
            { statusCode: ' ' as string },
            { statusCode: BigInt(123) as bigint },
            { statusCode: true as boolean },
            { statusCode: {} },
            { statusCode: [] }
        ];

        test.each(errCases)('return false for each invalid status code type', (err) => {
            expect(isHttpError(err)).toBeFalsy();
        });
    });

    it('should return true for valid status code when other checks are valid', () => {
        const err1 = { status: 500 as number };
        const err2 = { statusCode: 500 as number };
        expect(isHttpError(err1)).toBeTruthy();
        expect(isHttpError(err2)).toBeTruthy();
    });

    it('should return false for incorrect status code', () => {
        const err1 = { status: 0 as number };
        const err2 = { status: 790 as number };
        const err3 = { status: NaN as number };
        const err4 = { statusCode: -500 as number };
        const err5 = { statusCode: 1289893 as number };
        const err6 = { statusCode: NaN as number };
        
        expect(isHttpError(err1)).toBeFalsy();
        expect(isHttpError(err2)).toBeFalsy();
        expect(isHttpError(err3)).toBeFalsy();
        expect(isHttpError(err4)).toBeFalsy();
        expect(isHttpError(err5)).toBeFalsy();
        expect(isHttpError(err6)).toBeFalsy();
    });

    describe('does e.status/e.statusCode match with expected statuses:', () => {
        const statusCodes = [
            400, 401, 402, 403, 404, 405, 406, 407, 408, 409,
            410, 411, 412, 413, 414, 415, 416, 417, 418, 421,
            422, 423, 424, 425, 426, 428, 429, 431, 451, 500,
            501, 502, 503, 504, 505, 506, 507, 508, 510, 511
        ];
        const errCases: Array<{ status?: number, statusCode?: number }> = new Array;
        
        statusCodes.forEach((c) => {
            errCases.push({ status: c });
            errCases.push({ statusCode: c });
        });

        test.each(errCases)('return true for each correct status code', (err) => {
            expect(isHttpError(err)).toBeTruthy();
        });
    });
});

describe('isAggregateError:', () => {
    beforeEach(() => jest.clearAllMocks());
    afterEach(() => jest.resetAllMocks());

    it('isObject check should return false for invalid params', () => {
        expect(isAggregateError(undefined)).toBeFalsy();
        expect(isAggregateError(null)).toBeFalsy();
        expect(isAggregateError('str' as string)).toBeFalsy();
        expect(isAggregateError(BigInt(234) as bigint)).toBeFalsy();
        expect(isAggregateError(NaN as number)).toBeFalsy();
        expect(isAggregateError(true as boolean)).toBeFalsy();
        expect(isAggregateError(__foo())).toBeFalsy();
    });

    it('should return false if e.errors does not exist', () => {
        const err1 = {};
        const err2 = { value: 123 };
        const err3 = { values: [1, 2, 3] };

        expect(isAggregateError(err1)).toBeFalsy();
        expect(isAggregateError(err2)).toBeFalsy();
        expect(isAggregateError(err3)).toBeFalsy();
    });

    describe('e.errors validation - is an array:', () => {
        const errCases: Array<unknown> = [
            { undefined },
            { errors: undefined },
            { errors: null },
            { errors: NaN as number },
            { errors: BigInt(123) as bigint },
            { errors: true as boolean },
            { errors: {} }
        ];

        test.each(errCases)('return false for each invalid e.errors', (err) => {
            expect(isAggregateError(err)).toBeFalsy();
        });
    });

    test('should return true if e.errors is an array with length 0', () => {
        const err: { errors: any[] } = { errors: [] };
        expect(isAggregateError(err)).toBeTruthy();
    });

    test('should return true if e.errors is an array with length greater than 0', () => {
        const manyErrors: [...object[]] = [ { a: 1 } as any, { b: 2 } as any, { c: 3 } as any ];
        const err: { errors: any[] } = { errors: manyErrors };
        expect(isAggregateError(err)).toBeTruthy();
    });
});

describe('isNativeError:', () => {
    beforeEach(() => jest.clearAllMocks());
    afterEach(() => jest.resetAllMocks());

    it('isObject check should return false for invalid params', () => {
        expect(isNativeError(undefined)).toBeFalsy();
        expect(isNativeError(null)).toBeFalsy();
        expect(isNativeError('str' as string)).toBeFalsy();
        expect(isNativeError(BigInt(234) as bigint)).toBeFalsy();
        expect(isNativeError(NaN as number)).toBeFalsy();
        expect(isNativeError(true as boolean)).toBeFalsy();
        expect(isNativeError(__foo())).toBeFalsy();
    });

    describe('error instance validation:', () => {
        const errCases: Array<unknown> = [
            undefined,
            null,
            NaN,
            123 as number,
            BigInt(123) as bigint,
            true as boolean,
            {},
            []
        ];

        test.each(errCases)('return false for each invalid instance', (err) => {
            expect(isNativeError(err)).toBeFalsy();
        });

        const errInstances: Array<ApiError | PrismaError | RedisError | Error> = [
            new Error('msg'),
            new ApiError('msg', 400, ErrorInstance.API as string, 'internal', true),
            new PrismaError('msg', 400, ErrorInstance.PRISMA as string, 'internal', true, {} as MockPrismaDetails),
            new RedisError('msg', 400, ErrorInstance.REDIS as string, 'internal', true, {} as MockRedisDetails)
        ];

        test.each(errInstances)('return true for each valid instance', (err) => {
            expect(isNativeError(err)).toBeTruthy();
        });
    });
    
    it('should return false if either e.message and/or e.name does not exist when other conditions are false', () => {
        const err1 = {};
        const err2 = { message: 'str' };
        const err3 = { name: 'str' };
        
        expect(isNativeError(err1)).toBeFalsy();
        expect(isNativeError(err2)).toBeFalsy();
        expect(isNativeError(err3)).toBeFalsy();
    });
    
    describe('string typecheck - e.message & e.name:', () => {
        const errCases: Array<{ message?: any, name?: any }> = [
            { message: undefined },
            { message: null },
            { message: NaN as number},
            { message: BigInt(123) as bigint },
            { message: true as boolean },
            { message: {} },
            { message: [] },

            { name: undefined },
            { name: null },
            { name: NaN as number},
            { name: BigInt(123) as bigint },
            { name: true as boolean },
            { name: {} },
            { name: [] },

            { message: undefined, name: undefined },
            { message: null, name: null },
            { message: NaN as number, name: NaN as number },
            { message: BigInt(123) as bigint, name: BigInt(123) as bigint },
            { message: true as boolean, name: true as boolean },
            { message: {}, name: {} },
            { message: [], name: [] },
        ];
        
        test.each(errCases)('return false for each invalid (non-string) e.name and/or e.message', (err) => {
            expect(isNativeError(err)).toBeFalsy();
        });
    });
});

describe('_assignPrimary:', () => {
    beforeEach(() => jest.clearAllMocks());
    afterEach(() => jest.resetAllMocks());

    it('should return ErrorInstance.UNCLASSIFIED for invalid array elements', () => {
        const errInstance = [
            undefined,
            null,
            'str' as string,
            NaN as number,
            BigInt(123) as bigint,
            true as boolean,
            {},
            []
        ] as ErrorInstance[];
        expect(_assignPrimary(errInstance)).toBe(ErrorInstance.UNCLASSIFIED);
    });

    test('should assign primary instance according to weights', () => {
        const instances1: ErrorInstance[] = [ ErrorInstance.NATIVE, ErrorInstance.API ];
        const instances2: ErrorInstance[] = [ ErrorInstance.NATIVE, ErrorInstance.PRISMA ];
        const instances3: ErrorInstance[] = [ ErrorInstance.NATIVE, ErrorInstance.REDIS ];
        const instances4: ErrorInstance[] = [ ErrorInstance.NATIVE, ErrorInstance.PG ];
        const instances5: ErrorInstance[] = [ ErrorInstance.NATIVE, ErrorInstance.NODE_SYS ];
        const instances6: ErrorInstance[] = [ ErrorInstance.NATIVE, ErrorInstance.HTTP ];
        const instances7: ErrorInstance[] = [ ErrorInstance.NATIVE, ErrorInstance.AGGREGATE ];
        const instances8: ErrorInstance[] = [ ErrorInstance.UNKNOWN, ErrorInstance.NATIVE ];
        const instances9: ErrorInstance[] = [ ErrorInstance.UNKNOWN, ErrorInstance.UNCLASSIFIED ];
        const instances10: ErrorInstance[] = [ ErrorInstance.UNKNOWN, ErrorInstance.UNKNOWN ];
        const instances11: ErrorInstance[] = [];

        expect(_assignPrimary(instances1)).toBe(ErrorInstance.API);
        expect(_assignPrimary(instances2)).toBe(ErrorInstance.PRISMA);
        expect(_assignPrimary(instances3)).toBe(ErrorInstance.REDIS);
        expect(_assignPrimary(instances4)).toBe(ErrorInstance.PG);
        expect(_assignPrimary(instances5)).toBe(ErrorInstance.NODE_SYS);
        expect(_assignPrimary(instances6)).toBe(ErrorInstance.HTTP);
        expect(_assignPrimary(instances7)).toBe(ErrorInstance.AGGREGATE);
        expect(_assignPrimary(instances8)).toBe(ErrorInstance.NATIVE);
        expect(_assignPrimary(instances9)).toBe(ErrorInstance.UNCLASSIFIED);
        expect(_assignPrimary(instances10)).toBe(ErrorInstance.UNKNOWN);
        expect(_assignPrimary(instances11)).toBe(ErrorInstance.UNCLASSIFIED);
    });
});

describe('internal arrow functions:', () => {

    describe('_isObject:', () => {

        it('should return false if object is null or undefined', () => {
            expect(_isObject(undefined)).toBeFalsy();
            expect(_isObject(null)).toBeFalsy();
        });

        it('should return false is object is not of type \'object\'', () => {
            expect(_isObject(123 as number)).toBeFalsy();
            expect(_isObject(BigInt(123) as bigint)).toBeFalsy();
            expect(_isObject('str' as string)).toBeFalsy();
            expect(_isObject(true as boolean)).toBeFalsy();
        });

        it('should return true when object is of type \'object\'', () => {
            expect(_isObject({})).toBeTruthy();
            expect(_isObject([])).toBeTruthy();
        });
    });

    describe('_isFiveCharCode:', () => {

        it('should return false if param is less/more than 5 chars', () => {
            const moreThan5CharStr: string = '123456';
            const lesstThan5CharStr: string = '1234';
            const emptyStr: string = '';
            const blankStr: string = '     ';
            const symbolStr: string = '-!?^%';

            expect(_isFiveCharCode(moreThan5CharStr)).toBeFalsy();
            expect(_isFiveCharCode(lesstThan5CharStr)).toBeFalsy();
            expect(_isFiveCharCode(emptyStr)).toBeFalsy();
            expect(_isFiveCharCode(blankStr)).toBeFalsy();
            expect(_isFiveCharCode(symbolStr)).toBeFalsy();
        });

        test('should return true if param is exactly 5 chars', () => {
            expect(_isFiveCharCode('12345')).toBeTruthy();
        });
    });
    
    describe('_isPrismaCode', () => {

        it('should return false if param is not 5-char string', () => {
            const moreThan5CharStr: string = '123456';
            const lesstThan5CharStr: string = '1234';
            const emptyStr: string = '';
            const blankStr: string = '     ';
            const symbolStr: string = '-!?^%';

            expect(_isPrismaCode(moreThan5CharStr)).toBeFalsy();
            expect(_isPrismaCode(lesstThan5CharStr)).toBeFalsy();
            expect(_isPrismaCode(emptyStr)).toBeFalsy();
            expect(_isPrismaCode(blankStr)).toBeFalsy();
            expect(_isPrismaCode(symbolStr)).toBeFalsy();
        });

        describe('param of type string validation: start with \'P\':', () => {
            const letters: Array<string> = [
                'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
                'K', 'L', 'M', 'N', 'O', 'Q', 'R', 'S', 'T', 'U',
                'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e',
                'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
                'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y',
                'z', '0', '1', '2', '3', '4', '5', '6', '7', '8',
                '9', '.', ':', ',', ';', '`', '<', '>', '¨', '~',
                '@', 'æ', '"', '\'', '!', '£', '#', '^', '+', '$',
                '%', '½', '&', '/', '{', '(', '[', ')', ']', '=',
                '}', '?', '\\', '*', '-', '_'
            ];
            const strCases: Array<string> = new Array;
            letters.forEach((l) => strCases.push((l + '1234') as string));
            
            test.each(strCases)('return false for each invalid string which does not start with \'P\'', (s) => {
                expect(_isPrismaCode(s)).toBeFalsy();
            });
        });

        test('should return true if param is a 5-char string and starts with \'P\'', () => {
            expect(_isPrismaCode('P1234' as string)).toBeTruthy();
        });
    });
});