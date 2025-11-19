import { Router } from "express";
import argon2 from "argon2";
import { treeifyError, z } from "zod";

import prisma from "../prisma/client";
import { signAccessToken, verifyRefreshToken } from "../utils/jwt.util";
import { 
    createRefreshSession, 
    getCsrfForJti, 
    getUserIdForJti, 
    rotateRefreshToken,
    deleteRefreshAndCsrf,
} from "../services/auth.service";
import logger from "../lib/logger";

const router = Router();

const registerSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
    username: z.string()
});

const loginSchema = z.object({
    email: z.email(),
    password: z.string()
});

function cookieOptions(ttlSeconds: number) {
    const secure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
    return {
        httpOnly: true,
        secure,
        sameSite: 'strict' as const,
        domain: process.env.COOKIE_DOMAIN || 'localhost',
        path: '/',
        maxAge: ttlSeconds*1000
    };
}

//? REGISTER
router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if(!parsed.success) return res.status(400).json({ error: treeifyError(parsed.error) });

    const { email, password, username } = parsed.data;
    const exists = await prisma.user.findUnique({ where: { email } });
    if(exists) return res.status(409).json({ error: 'Email has already registered' });

    //? argon2id hashing
    const hash = await argon2.hash(password, { type: argon2.argon2id });
    const user = await prisma.user.create({ data: { email, passwordHash: hash, username } });

    res.status(201).json({ id: user.id, email: user.email, username: user.username });
});

//? LOGIN
router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if(!parsed.success) return res.status(400).json({ error: treeifyError(parsed.error) });

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if(!user) return res.status(401).json({ error: 'Invalid credentials!' });

    const ok = await argon2.verify(user.passwordHash, password);
    if(!ok) return res.status(401).json({ error: 'Invalid credentials!' });

    // issue access token
    const accessToken = signAccessToken(user.id);

    // create resfresh session
    const { refreshToken, jti, csrf, ttl } = await createRefreshSession(user.id);

    // set refresh token cookie (HttpOnly) and csrf cookie (accessible to JS)
    res.cookie('refresh_token', refreshToken, cookieOptions(ttl));

    // non-HTTP cookie to allow client read csrf and submit in header
    const secureFlag = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
    res.cookie('csrf_token', csrf, {
        httpOnly: false,
        secure: secureFlag,
        sameSite: 'strict' as const,
        domain: process.env.COOKIE_DOMAIN || 'localhost',
        path: '/',
        maxAge: ttl*1000
    });

    res.json({ accessToken, user: { id: user.id, email: user.email, username: user.username } });
});

/* 
    ? REFRESH
    * Client must:
    *   - send cookie `refresh_token` (HttpOnly set login)
    *   - include header `x-csrf-token` with value of `csrf_token` cookie
*/
router.post('/refresh', async (req, res) => {
    const refreshToken = req.cookies['refresh_token'];
    const csrfHeader = req.header('x-csrf-token');

    if(!refreshToken || !csrfHeader) return res.status(400).json({ error: 'Missing tokens!' });

    let payload;
    try {
        payload = verifyRefreshToken(refreshToken);
    } catch(err) {
        return res.status(401).json({ error: 'Invalid refresh token!' });
    }

    const jti = payload.jti;
    const userId = payload.sub;

    // check jti exists in redis
    const storedUserId = await getUserIdForJti(jti);
    if(!storedUserId || storedUserId !== userId)
        return res.status(401).json({ error: 'Refresh token revoked or invalid!' });

    const storedCsrf = await getCsrfForJti(jti);
    if(!storedCsrf || storedCsrf !== csrfHeader)
        return res.status(403).json({ error: 'Invalid CSRF token!' });

    // rotate refresh token
    const { refreshToken: newRefreshToken, jti: newJti, csrf: newCsrf, ttl } = await rotateRefreshToken(jti, userId);

    // new access token
    const accessToken = signAccessToken(userId);

    // set cookies
    res.cookie('refresh_token', newRefreshToken, cookieOptions(ttl));
    const secureFlag = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
    res.cookie('csrf_token', newCsrf, {
        httpOnly: false,
        secure: secureFlag,
        sameSite: 'strict' as const,
        domain: process.env.COOKIE_DOMAIN || 'localhost',
        path: '/',
        maxAge: ttl*1000
    });

    res.json({ accessToken });
});

//? LOGOUT
router.post('/logout', async (req, res) => {
    const refreshToken = req.cookies['refresh_token'];
    const csrfHeader = req.header('x-csrf-token');
    if(!refreshToken || !csrfHeader) return res.status(400).json({ error: 'Missing tokens!' });

    let payload;
    try {
        payload = verifyRefreshToken(refreshToken);
    } catch(err) {
        // clear cookies anyway
        logger.warn({ err }, 'Could not verify refresh token. Clearing cookies anyway...');
        res.clearCookie('refresh_token', { path: '/' });
        res.clearCookie('csrf_token', { path: '/' });
        // send successful status due to indempotency and to avoid leaking information
        return res.status(204);
    }

    const jti = payload.jti;

    const storedCsrf = await getCsrfForJti(jti);
    if(storedCsrf && storedCsrf !== csrfHeader)
        return res.status(403).json({ error: 'Invalid CSRF token' });

    await deleteRefreshAndCsrf(jti);

    // clear cookies
    res.clearCookie('refresh_token', { path: '/' });
    res.clearCookie('csrf_token', { path: '/' });

    res.json({ ok: true });
});

export default router;