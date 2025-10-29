import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.REDIS_URL;

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
    console.error('[redis] error:', err && err.message ? err.message : err);
});
client.on('connect', () => console.info('[redis] connect'));
client.on('ready', () => console.info('[redis] ready'));
client.on('reconnecting', (delay: any) => console.info(`[redis] reconnecting in ${delay}ms`));
client.on('end', () => console.info('[redis] connection ended'));

async function ensureConnected(attempts = 8) {
    let i = 0;
    while(i<attempts) {
        try {
            await client.connect();
            console.info('[redis] connected');
            return;
        } catch(e: any) {
            i++;
            console.warn(`[redis] connection attempt ${i} failed: ${e?.message ?? e}. Retyring...`);
            const backoff = Math.min(2000, Math.pow(2,i)*100);
            await new Promise((res) => setTimeout(res, backoff));
        }
    }
    console.error('[redis] could not connect after retries - continuing; ioredis will keep trying in background');
}

ensureConnected().catch((err) => console.error('[redis] ensureConnected error:', err));

export default client;