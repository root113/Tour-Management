import { Client } from "pg";
import { startServer } from "../index";

const MAX_RETRIES = 30;
const RETRY_DELAY_MS = 2000;

function getConnectionString(): string {
    if(process.env.DATABASE_URL) return process.env.DATABASE_URL;

    const USER = process.env.POSTGRES_USER;
    const PASSWORD = process.env.POSTGRES_PASSWORD;
    const HOST = 'db_pg_container';
    const PORT = process.env.PG_PORT;
    const DB = process.env.POSTGRES_DB;

    return `postgresql://${USER}:${encodeURIComponent(PASSWORD!)}@${HOST}:${PORT}/${DB}`;
}

async function waitForPostgres() {
    const conn = getConnectionString();
    
    for(let i=0; i<MAX_RETRIES; i++) {
        try {
            const client = new Client({ connectionString: conn });
            await client.connect();
            await client.query('SELECT 1');
            await client.end();
            console.log('Postgres is ready');
            return;
        } catch(err) {
            // TODO: replace with a convenient error handler
            console.error(err);
            const attempt = i+1;
            console.log(`Postgres not ready (attempt ${attempt}/${MAX_RETRIES}). Retrying in ${RETRY_DELAY_MS}ms...`);
            await new Promise((res) => setTimeout(res, RETRY_DELAY_MS));
        }
    }
    // TODO: replace with custom error handler
    throw new Error('Postgres did not become ready in time!');
}

async function start() {
    await waitForPostgres();
    await startServer();
    console.log('App started');
}

start().catch((err) => {
    // TODO: optionally, implement custom error handler
    console.error('Failed to start process: ', err);
    process.exit(1);
});