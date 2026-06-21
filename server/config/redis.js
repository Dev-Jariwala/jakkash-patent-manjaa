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

export function createRedisConnection() {
  const config = getRedisConfig();
  if (config.url) {
    return new IORedis(config.url, { maxRetriesPerRequest: null });
  }
  return new IORedis(config);
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
  const redis = createRedisConnection();

  try {
    await redis.ping();
    console.log(`Redis connected (${target})`);
    return true;
  } catch (error) {
    console.error(`Redis connection failed (${target}):`, error.message);
    return false;
  } finally {
    redis.disconnect();
  }
}
