import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

dotenv.config({ path: path.join(serverRoot, '.env') });

function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    console.error(`Missing ${name} in server/.env`);
    process.exit(1);
  }
  return value;
}

const host = requireEnv('DB_HOST');
const user = requireEnv('DB_USER');
const database = requireEnv('DB_DATABASE');
const port = process.env.DB_PORT || '5432';
const password = process.env.DB_PASSWORD ?? '';

const isLocal = ['localhost', '127.0.0.1', '::1'].includes(host);
const useSsl = process.env.DB_SSL ? process.env.DB_SSL === 'true' : !isLocal;
const sslmode = useSsl ? 'require' : 'disable';

const auth = password
  ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
  : encodeURIComponent(user);
const hostForUrl = host.includes(':') ? `[${host}]` : host;
const databaseUrl =
  `postgres://${auth}@${hostForUrl}:${port}/${encodeURIComponent(database)}?sslmode=${sslmode}`;

const dbmateBin = path.join(serverRoot, 'node_modules', '.bin', 'dbmate');

const child = spawn(dbmateBin, process.argv.slice(2), {
  cwd: serverRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    DATABASE_URL: databaseUrl,
    DBMATE_MIGRATIONS_DIR: './migrations',
    DBMATE_NO_DUMP_SCHEMA: 'true',
  },
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});
