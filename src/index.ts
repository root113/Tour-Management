import app from "./app";
import logger from "./lib/logger";
import type { Server } from "http";

export async function startServer(PORT = Number(process.env.APP_PORT)): Promise<Server> {
    return new Promise((resolve, reject) => {
        try {
            const server = app.listen(PORT, () => {
                logger.info({ port: PORT }, 'Server is listening...');
                (server as any).keepAliveTimeout = 61_000;
                (server as any).headersTimeout = 65_000;
                resolve(server);
            });
            // TODO: optionally handle server errors with a custom middleware
            server.on('error', (err) => {
                logger.error({ err }, 'Server error!');
                reject(err);
            });

            // process-level handlers
            process.on('unhandledRejection', (reason) => {
                logger.error({ reason }, 'unhandledRejection');
            });
            process.on('uncaughtException', (err) => {
                logger.fatal({ err }, 'uncaughtException - exiting...');
                process.exit(1);
            });

        } catch(err) {
            // TODO: implement a better error handler
            logger.error({ err }, 'Failed starting server!');
            reject(err);
        }
    });
}

if(require.main === module) {
    startServer().catch((err) => {
        logger.error({ err }, 'Failed to start server!');
        process.exit(1);
    });
}