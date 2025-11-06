import pino from "pino";

const NODE_ENV = process.env.NODE_ENV || 'development';
const LOG_LEVEL = process.env.LOG_LEVEL || (NODE_ENV === 'production' ? 'info' : 'debug');

let logger: pino.Logger;

if(NODE_ENV === 'production') {
    logger = pino({ level: LOG_LEVEL });
} else {
    // development: pretty-print using pino.transport with pino-pretty
    // pino.transport requires recent pino; this works with pino >= 7
    logger = pino({
        level: LOG_LEVEL,
        transport: {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'dd-mm-yyyy HH:MM:ss.l o',
                ignore: 'pid,hostname'
            }
        }
    } as any); // cast because types vary; this is safe at runtime
}

export default logger;
export { logger };