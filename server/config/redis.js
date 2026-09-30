import IORedis from "ioredis";

export function getRedisConfig() {
  if (process.env.REDIS_URL) {
    return { url: process.env.REDIS_URL };
  }

  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  };
}

export function createRedisConnection(overrideOptions = {}) {
  const config = getRedisConfig();
  const options = {
    maxRetriesPerRequest: null,
    ...overrideOptions,
  };

  const client = config.url
    ? new IORedis(config.url, options)
    : new IORedis({ ...config, ...options });

  // Attach error listener to prevent Node.js EventEmitter unhandled 'error' event log spam
  client.on("error", (err) => {
    // BullMQ/ioredis handles reconnections; errors can be caught at invocation sites or queue worker level
  });

  return client;
}

function getRedisTargetLabel() {
  const config = getRedisConfig();
  if (config.url) {
    return config.url.replace(/:([^:@/]+)@/, ":***@");
  }
  return `${config.host}:${config.port}`;
}

export async function verifyRedisConnection() {
  const target = getRedisTargetLabel();
  const redis = createRedisConnection({
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    retryStrategy: () => null,
  });

  try {
    await redis.ping();
    console.log(`Redis connected (${target})`);
    return true;
  } catch (error) {
    console.warn(`Redis connection unavailable (${target}): ${error.message}`);
    return false;
  } finally {
    try {
      redis.disconnect();
    } catch (_) {}
  }
}
