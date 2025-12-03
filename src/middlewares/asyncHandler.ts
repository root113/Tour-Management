import { RequestHandler } from "express";

export default function asyncHandler(fn: RequestHandler): RequestHandler {
    return function (req, res, next) {
        try {
            const result = fn(req, res, next);
            return Promise.resolve(result).catch(next);
        } catch(err) {
            next(err);
        }
    };
}