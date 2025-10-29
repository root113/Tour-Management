import redis from "../lib/redisClient";
import { signRefreshToken } from "../utils/jwt.util";
import { randomBytes } from "crypto";

const REFRESH_KEY_PREFIX = "refresh:";
const CSRF_KEY_PREFIX = "csrf:";

//? Store refresh jti in Redis keyed by jti with value = userId and TTL matching token TTL
export async function storeRefreshJti(jti: string, userId: string, ttlSeconds: number) {
    await redis.set(`${REFRESH_KEY_PREFIX}${jti}`, userId, 'EX', ttlSeconds);
}

//? store csrf value for a jti
export async function storeCsrfForJti(jti: string, csrfValue: string, ttlSeconds: number) {
    await redis.set(`${CSRF_KEY_PREFIX}${jti}`, csrfValue, 'EX', ttlSeconds);
}

export async function getUserIdForJti(jti: string) {
    return await redis.get(`${REFRESH_KEY_PREFIX}${jti}`);
}

export async function getCsrfForJti(jti: string) {
    return await redis.get(`${CSRF_KEY_PREFIX}${jti}`);
}

export async function deleteRefreshAndCsrf(jti: string) {
    await redis.del(`${REFRESH_KEY_PREFIX}${jti}`, `${CSRF_KEY_PREFIX}${jti}`);
}

export function generateCsrf() {
    return randomBytes(24).toString('hex');
}

export async function createRefreshSession(userId: string) {
    const { token, jti } = signRefreshToken(userId);
    const ttl = parseRefreshExpiresToSeconds(process.env.JWT_REFRESH_TOKEN_EXPIRES || '14d');
    const csrf = generateCsrf();

    await storeRefreshJti(jti, userId, ttl);
    await storeCsrfForJti(jti, csrf, ttl);

    return { refreshToken: token, jti, csrf, ttl };
}

//? Rotate refresh token
export async function rotateRefreshToken(oldJti: string, userId: string) {
    await deleteRefreshAndCsrf(oldJti);
    return await createRefreshSession(userId);
}

function parseRefreshExpiresToSeconds(s: string) {
    if (s.endsWith('d')) {
        const days = parseInt(s.slice(0, -1), 10);
        return days*24*60*60;
    }
    if (s.endsWith('h')) {
        const hours = parseInt(s.slice(0, -1), 10);
        return hours*3600;
    }
    if (s.endsWith('m')) {
        const mins = parseInt(s.slice(0, -1), 10);
        return mins*60;
    }
    // fallback seconds
    const secs = parseInt(s, 10);
    return isNaN(secs) ? 14*24*60*60 : secs;
}