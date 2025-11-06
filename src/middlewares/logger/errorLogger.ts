import { Request, Response, NextFunction } from "express";
import logger from "../../lib/logger";

export async function errorLogger(err: any, req: Request, res: Response, next: NextFunction) {
    const log = (req as any).log || logger;

    log.error({ err, url: req.originalUrl, method: req.method }, 'Unhandled error!');
    const status = err?.status || 500;
    const message = process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err?.message || 'Internal Server Error';
    res.status(status).json({ message });
}