import app from "./app";
import type { Server } from "http";

export async function startServer(PORT = Number(process.env.APP_PORT)): Promise<Server> {
    return new Promise((resolve, reject) => {
        try {
            const server = app.listen(PORT, () => {
                console.log('Server is listening on port: ', PORT);
                resolve(server);
            });
            // TODO: optionally handle server errors with a custom middleware
            server.on('error', (err) => {
                console.error('Server error: ', err);
                reject(err);
            });
        } catch(err) {
            // TODO: implement a better error handler
            reject(err);
        }
    });
}

if(require.main === module) {
    startServer().catch((err) => {
        console.error('Failed to start server: ', err);
        process.exit(1);
    });
}