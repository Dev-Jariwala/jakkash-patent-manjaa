import pkg from 'pg';
const { Pool } = pkg;

// Local Postgres runs with ssl = off, hosted ones (Neon/Supabase) require TLS.
// Default to SSL for any remote host; DB_SSL=true/false overrides.
const host = process.env.DB_HOST;
const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host);
const useSsl = process.env.DB_SSL ? process.env.DB_SSL === 'true' : !isLocal;

const pool = new Pool({
    max: process.env.DB_CONNECTION_LIMIT,
    host,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT,
    ssl: useSsl ? {
        rejectUnauthorized: false, // Use true with proper certificates
    } : false,
});


export default pool;
