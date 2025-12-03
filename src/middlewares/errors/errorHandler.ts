import { Request, Response, NextFunction } from "express";
import logger from "../../lib/logger";
import { ErrorInstance } from "../../errors/ApiError";
import { classifyError } from "../../utils/error/errorClassification.util";
import { resolveError } from "../../utils/error/errorFactory.util";

import type { RequestDetails } from "../../models/errors/requestDetails.types";

function assignRequestDetails(req: Request): RequestDetails {
    const requestId = (req.headers['x-request-id'] ?? (req as any).requestId);
    const reqDetails: RequestDetails = {
        requestId: requestId,
        method: req.method,
        endpoint: req.baseUrl + req.path,
        timestamp: new Date().toISOString(),
        params: req.params,
        query: req.query,
        requestBody: req.body,
        userAgent: req.get('User-Agent') ?? undefined
    };
    return reqDetails;
}

export async function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    const reqDetails: RequestDetails = assignRequestDetails(req);
    const reqId = reqDetails.requestId ?? req.headers['x-request-id'] ?? (req as any).requestId ?? '<undefined>';
    res.setHeader('x-request-id', reqId);
    const cls = classifyError(err);
    
    if(cls.conflict > 1) {
        logger.warn({
            requestId: reqId,
            matches: cls.matches,
            candidateKeys: cls?.meta?.candidateKeys ?? null
        }, '[errorHandler] classification conflict');
    }

    const appErr = resolveError(err, reqDetails);
    const logPayload = {
        requestId: reqId,
        instance: appErr.instance,
        status: appErr.status,
        internalCause: appErr.internalCause,
        isOperational: appErr.isOperational,
        code: appErr.code,
        message: appErr.message,
        reqDetails,
        originalError: (() => {
            try {
                return typeof err === 'object' ? JSON.parse(JSON.stringify(err, Object.getOwnPropertyNames(err))) : String(err);
            } catch(_) { return String(err) }
        })()
    };
    logger.error({ logPayload }, '[errorHandler] mapped error');

    // TODO:
    /*
     *  monitoring & metrics
     *  Alerting
     *  Fallbacks
     *  Recovery & graceful degradation
    */

    const clientBody: Record<string, unknown> = {
        status: appErr.status,
        message: sanitizeMessageForClient(appErr),
        code: appErr.code ?? undefined,
        instance: appErr.instance,
        requestId: reqId
    };

    if(appErr.isOperational) clientBody['isOperational'] = true;
    res.status(appErr.status ?? 500).json(clientBody);
}

function sanitizeMessageForClient(e: { message?: string, instance?: any }) {
    const msg = e?.message ?? 'Internal server error';
    const instance = String(e?.instance ?? '');
    if(instance === ErrorInstance.NATIVE || instance === ErrorInstance.UNKNOWN || instance === ErrorInstance.UNCLASSIFIED)
        return 'Internal server error';
    return msg;
}