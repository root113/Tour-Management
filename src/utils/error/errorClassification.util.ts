import { ErrorInstance } from "../../errors/ApiError";

export interface ErrorClassificationResult {
    matches: ErrorInstance[];
    conflict: number;
    primary: ErrorInstance;
    meta?: Record<string, unknown>;
}

const _isObject = (v: unknown): v is Record<string, unknown> => (v !== null && v !== undefined) && typeof v === 'object';
const _isFiveCharCode = (s: string) => /^[0-9A-Z]{5}$/.test(s);
const _isPrismaCode = (s: string) => _isFiveCharCode(s) && s.startsWith('P');

function isApiError(e: unknown): boolean {
    if(!_isObject(e)) return false;
    let isCheck: boolean = false;
    const condition: boolean = (e as any) instanceof Error && 'status' in (e as any) && 'instance' in (e as any);
    if(condition) isCheck = true;
    return isCheck ? typeof (e as any).status === 'number' && typeof (e as any).instance === 'string' : isCheck;
}

function isPrismaKnownError(e: unknown): boolean {
    if(!_isObject(e)) return false;
    
    let isCheck: boolean = false;
    const condition: boolean = 
        (e as any)?.name === 'PrismaClientKnownRequestError' && 
        typeof (e as any)?.code === 'string' && 
        _isPrismaCode((e as any).code);
    
    if(condition) isCheck = true;
    return isCheck;
}

function isPrismaAnyError(e: unknown): boolean {
    if(!_isObject(e)) return false;
    
    let isCheck: boolean = false;
    const condition: boolean = 
        typeof (e as any)?.clientVersion === 'string' || 
        (typeof (e as any)?.name === 'string' && (e as any).name.startsWith?.('Prisma')) || 
        (typeof (e as any)?.code === 'string' && _isPrismaCode((e as any).code));
    
    if(condition) isCheck = true;
    return isCheck;
}

function isRedisError(e: unknown): boolean {
    if(!_isObject(e)) return false;
    
    let isCheck: boolean = false;
    const errKeys: [...string[]] = [
        'RedisError',
        'ParserError',
        'ReplyError',
        'AbortError',
        'InterruptError'
    ];

    const msgRegex: RegExp = /\b(redis|Redis|ECONNREFUSED|CLUSTER)\b/;
    const isMessage: boolean = (e as any)?.message ? typeof (e as any).message === 'string' && msgRegex.test((e as any).message) : false;
    const hasProperty: boolean = (e as any)?.name ? errKeys.includes((e as any).name) : false;
    const condition: boolean = hasProperty || isMessage;
    
    if(condition) isCheck = true;
    return isCheck;
}

function isPostgresError(e: unknown): boolean {
    if(!_isObject(e)) return false;
    let isCheck: boolean = false;
    
    const isCode: boolean = (e as any)?.code ? typeof (e as any).code === 'string' && _isFiveCharCode((e as any).code) : false;
    const isKeyWord: boolean = (e as any)?.severity || (e as any)?.routine || (e as any)?.table || (e as any)?.constraint;
    const condition: boolean = isCode && isKeyWord;
    
    if(condition) isCheck = true;
    return isCheck;
}

function isNodeSysError(e: unknown): boolean {
    if(!_isObject(e)) return false;
    let isCheck: boolean = false;
    
    const hasCode: boolean = (e as any)?.code ? typeof (e as any).code === 'string' : false;
    const hasProperty: boolean = (e as any) != null ? 'code' in (e as any) && ('syscall' in (e as any) || 'errno' in (e as any)) : false;
    const isFiveChar: boolean = _isFiveCharCode((e as any)?.code) ? hasProperty : false;
    const condition: boolean = hasCode && isFiveChar;
    
    if(condition) isCheck = true;
    return isCheck;
}

function isHttpError(e: unknown): boolean {
    if(!_isObject(e)) return false;
    
    let isCheck: boolean = false;
    const statusCodes: [...number[]] = [
        400, 401, 402, 403, 404, 405, 406, 407, 408, 409,
        410, 411, 412, 413, 414, 415, 416, 417, 418, 421,
        422, 423, 424, 425, 426, 428, 429, 431, 451, 500,
        501, 502, 503, 504, 505, 506, 507, 508, 510, 511
    ];

    const isStatus: boolean = (e as any)?.status || (e as any)?.statusCode ? typeof (e as any).status === 'number' || typeof (e as any).statusCode === 'number' : false;
    const hasCode: boolean = statusCodes.includes((e as any)?.status) || statusCodes.includes((e as any)?.statusCode);
    const condition: boolean = isStatus && hasCode;
    
    if(condition) isCheck = true;
    return isCheck;
}

function isAggregateError(e: unknown): boolean {
    if(!_isObject(e)) return false;
    let isCheck: boolean = false;
    const condition: boolean = (e as any)?.errors ? Array.isArray((e as any).errors) && (e as any).errors.length >= 0 : false;
    if(condition) isCheck = true;
    return isCheck;
}

function isNativeError(e: unknown): boolean {
    if(!_isObject(e)) return false;
    let isCheck: boolean = false;
    
    const isInstance: boolean = (e as any) instanceof Error;
    const isProperty: boolean = (e as any)?.message && (e as any)?.name;
    const isPropertyType: boolean = typeof (e as any)?.message === 'string' && typeof (e as any)?.name === 'string';
    const isMergedCondition: boolean = isProperty ? isPropertyType : false;
    const condition: boolean = isInstance ? isInstance : isMergedCondition;
    
    if(condition) isCheck = true;
    return isCheck;
}

function isUnclassifiedError(e: unknown): boolean {
    if(!_isObject(e)) return false;
    
    let isCheck: boolean = false;
    const isAnyErr = 
        isApiError(e) ||
        isPrismaKnownError(e) ||
        isPrismaAnyError(e) ||
        isRedisError(e) ||
        isPostgresError(e) ||
        isNodeSysError(e) ||
        isHttpError(e) ||
        isAggregateError(e) ||
        isNativeError(e);
    
    if(!isAnyErr) isCheck = true;
    return isCheck;
}

function isUnknownError(e: unknown): boolean {
    if(!_isObject(e)) return true;
    return false;
}

//! order matters
const PRIORITY: ErrorInstance[] = [
    ErrorInstance.API,
    ErrorInstance.PRISMA,
    ErrorInstance.REDIS,
    ErrorInstance.PG,
    ErrorInstance.NODE_SYS,
    ErrorInstance.HTTP,
    ErrorInstance.AGGREGATE,
    ErrorInstance.NATIVE,
    ErrorInstance.UNCLASSIFIED,
    ErrorInstance.UNKNOWN
];

function _assignPrimary(instanceArray: ErrorInstance[]): ErrorInstance {
    return PRIORITY.find(p => instanceArray.includes(p)) ?? ErrorInstance.UNCLASSIFIED;
}

export function classifyError(e: unknown): ErrorClassificationResult {
    const matches: ErrorInstance[] = [];

    if(isApiError(e)) matches.push(ErrorInstance.API);
    if(isPrismaKnownError(e) || isPrismaAnyError(e)) matches.push(ErrorInstance.PRISMA);
    if(isRedisError(e)) matches.push(ErrorInstance.REDIS);
    if(isPostgresError(e)) matches.push(ErrorInstance.PG);
    if(isNodeSysError(e)) matches.push(ErrorInstance.NODE_SYS);
    if(isHttpError(e)) matches.push(ErrorInstance.HTTP);
    if(isAggregateError(e)) matches.push(ErrorInstance.AGGREGATE);
    if(isNativeError(e)) matches.push(ErrorInstance.NATIVE);
    if(isUnclassifiedError(e)) matches.push(ErrorInstance.UNCLASSIFIED);
    if(isUnknownError(e)) matches.push(ErrorInstance.UNKNOWN);
    
    // fallback: unknown error
    if(matches.length === 0) matches.push(ErrorInstance.UNKNOWN);

    const primary: ErrorInstance = _assignPrimary(matches);
    const result: ErrorClassificationResult = {
        matches,
        conflict: matches.length,
        primary,
        meta: { 
            //! lightweight diagnostic, avoid including stacks and heavy structures
            candidateKeys: _isObject(e) ? Object.keys(e as any).slice(0, 50) : [] 
        }
    };
    return result;
}

export const __testInternals__ = {
    isApiError,
    isPrismaKnownError,
    isPrismaAnyError,
    isRedisError,
    isPostgresError,
    isNodeSysError,
    isHttpError,
    isAggregateError,
    isNativeError,
    isUnclassifiedError,
    isUnknownError,
    _assignPrimary,
    _isObject,
    _isFiveCharCode,
    _isPrismaCode
};