import { Request, Response, NextFunction } from "express";
import { Logger } from "pino";
import { sanitizeObject, extractClientInfo } from "../../utils/logger.util";

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
    const log = (req as any).log as Logger;
    const startNs = process.hrtime.bigint();

    res.locals = res.locals || {};
    res.locals._reqStartNs = startNs;
    res.locals._reqFinished = false;
    res.locals._reqAborted = false;
    res.locals._reqErrorLogged = false;
    res.locals._reqLoggedFinal = false;

    try {
        log.info({
            event: 'request_start',
            method: req.method,
            originalUrl: req.originalUrl,
            params: sanitizeObject(req.params),
            query: sanitizeObject(req.query),
            client: extractClientInfo(req.headers),
            userId: (req as any).user?.id,
        }, 'handling request...');
    } catch(err) {
        log.debug({ err }, 'failed to emit request_start!');
    }

    const onAborted = () => {
        try {
            res.locals._reqAborted = true;
            const start = res.locals._reqStartNs ?? startNs;
            const durationMs = Math.round(Number(process.hrtime.bigint()-start)/1_000_000);

            log.warn({
                event: 'request_aborted',
                originalUrl: req.originalUrl,
                method: req.method,
                status: res.statusCode,
                durationMs,
                userId: (req as any).user?.id,
            }, 'request aborted by client');
        } catch(err) {
            log.debug({ err }, 'failed to emit request_aborted!');
        }
    };
    req.once('aborted', onAborted);

    res.once('finish', () => {
        try {
            res.locals._reqFinished = true;
            const start = res.locals._reqStartNs ?? startNs;
            const durationMs = Math.round(Number(process.hrtime.bigint()-start)/1_000_000);

            if(!res.locals._reqLoggedFinal) {
                res.locals._reqLoggedFinal = true;

                log.info({
                    event: 'request_end',
                    method: req.method,
                    originalUrl: req.originalUrl,
                    status: res.statusCode,
                    durationMs,
                    userId: (req as any).user?.id,
                }, 'request completed');
            }
        } catch(err) {
            log.debug({ err }, 'failed to emit request_end!');
        }
    });

    res.once('close', () => {
        try {
            if(res.locals._reqFinished) return;
            if(res.locals._reqAborted) return;

            const start = res.locals._reqStartNs ?? startNs;
            const durationMs = Math.round(Number(process.hrtime.bigint()-start)/1_000_000);

            if(!res.locals._reqLoggedFinal) {
                res.locals._reqLoggedFinal = true;

                log.warn({
                    event: 'request_close',
                    method: req.method,
                    originalUrl: req.originalUrl,
                    status: res.statusCode,
                    durationMs,
                    userId: (req as any).user?.id,
                }, 'request closed before finish');
            }
        } catch(err) {
            log.debug({ err }, 'failed to emit request_close!');
        }
    });

    const cleanup = () => {
        req.removeListener('aborted', onAborted);
    };
    res.once('finish', cleanup);
    res.once('finish', cleanup);

    next();
}