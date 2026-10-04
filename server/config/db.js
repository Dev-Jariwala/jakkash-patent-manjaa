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

pool.on('error', (err) => {
    console.error('Unexpected error on idle database client', err);
});

function getDatabaseTargetLabel() {
    const port = process.env.DB_PORT || 5432;
    const database = process.env.DB_DATABASE || '';
    return `${host}:${port}/${database}`;
}

/** Temporary startup check — remove or slim down after DB testing. */
export async function verifyDatabaseConnection() {
    const target = getDatabaseTargetLabel();
    try {
        const ping = await pool.query('SELECT 1 AS ok');
        console.log(`Postgres connected (${target})`, ping.rows[0]);

        // const tables = await pool.query(
        //     `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
        // );
        // console.log('Public tables', tables.rows);

        return true;
    } catch (error) {
        console.warn(`Postgres connection unavailable (${target}): ${error.message}`);
        return false;
    }
}

export default pool;
