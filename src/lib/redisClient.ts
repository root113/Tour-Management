import Redis from "ioredis";
import dotenv from "dotenv";

import logger from "../lib/logger";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL;
if(!REDIS_URL) throw new Error('REDIS_URL is required!');

/**
 *? ioredis options:
 *? - lazyConnect: true -> the connection is not established automatically at instantiation.
 *? - maxRetriesPerRequest: null -> allow internal retry logic for requests.
 *? - retryStrategy -> exponential backoff for reconnect attempts.
*/
const client = new Redis(REDIS_URL!, {
    lazyConnect: true,
    connectTimeout: 10000,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
        const delay = Math.min(2000, Math.pow(2, times)*100);
        return delay;
    },
    reconnectOnError(err) {
        return true;
    },
});

// Attach handlers to avoid "Unhandled error event"
client.on('error', (err) => {
    // don't throw, just log. ioredis will continue trying to connect
    logger.error({ err }, '[redis] error:');
});
client.on('connect', () => logger.info('[redis] connect'));
client.on('ready', () => logger.info('[redis] ready'));
client.on('reconnecting', (delay: any) => logger.info(`[redis] reconnecting in ${delay}ms...`));
client.on('end', () => logger.info('[redis] connection ended'));

async function ensureConnected(attempts = 8) {
    let i = 0;
    while(i<attempts) {
        try {
            const attempt = i+1;
            await client.connect();
            logger.info({ attempt }, '[redis] connected');
            return;
        } catch(e: any) {
            i++;
            logger.warn({ e }, `[redis] connection attempt ${i} failed. Retyring...`);
            const backoff = Math.min(2000, Math.pow(2,i)*100);
            await new Promise((res) => setTimeout(res, backoff));
        }
    }
    logger.error('[redis] could not connect after retries - continuing; ioredis will keep trying in background');
}

ensureConnected().catch((err) => logger.error({ err }, '[redis] ensureConnected error!'));

export default client;