import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_TOKEN_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_TOKEN_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_TOKEN_EXPIRES || '14d';

function makeJti(): string {
    if(typeof crypto.randomUUID === 'function')
        return crypto.randomUUID();

    return crypto.randomBytes(16).toString('hex');
}

export function signAccessToken(userId: string) {
    return jwt.sign({ sub: userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions);
}

export function signRefreshToken(userId: string, jti?: string) {
    const tokenId = jti ?? makeJti();
    const token = jwt.sign({ sub: userId, jti: tokenId }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES } as jwt.SignOptions);
    return { token, jti: tokenId };
}

export function verifyAccessToken(token: string) {
    return jwt.verify(token, ACCESS_SECRET) as { sub: string; iat?: number; exp?: number };
}

export function verifyRefreshToken(token: string) {
    return jwt.verify(token, REFRESH_SECRET) as { sub: string; jti: string; iat?: number; exp?: number };
}
