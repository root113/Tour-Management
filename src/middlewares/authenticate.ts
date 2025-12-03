import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt.util";
import prisma from "../prisma/client";

declare global {
    namespace Express {
        interface Request {
            user?: { id: string, email?: string, role?: string };
        }
    }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
    const header = req.header('authorization');
    if(!header?.startsWith('Bearer ')) return res.status(401).json({ error:'Missing Authorization header!' });

    const token = header.slice(7);
    try {
        const payload = verifyAccessToken(token);
        const user = await prisma.user.findUnique({ where: { id: payload.sub } });
        if(!user) return res.status(401).json({ error: 'User not found!' });

        req.user = { id: user.id, email: user.email, role: user.role };
        next();
    } catch(_) {
        return res.status(401).json({ error: 'Invalid or expired access token!' });
    }
}