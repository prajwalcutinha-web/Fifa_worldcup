// Cache abstraction: uses Redis when REDIS_URL is configured and reachable,
// otherwise transparently falls back to an in-process Map with TTLs. This keeps
// the app fully functional in local dev without a Redis server, while using
// Redis for shared state/caching in production.

import Redis from "ioredis";
import { config } from "../config.js";

let redis = null;
let redisReady = false;

// In-memory fallback store: key -> { value, expiresAt }
const mem = new Map();

export function initCache() {
  if (!config.redis.url) {
    console.log("[cache] REDIS_URL not set — using in-memory cache fallback");
    return;
  }
  try {
    redis = new Redis(config.redis.url, {
      lazyConnect: false,
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    redis.on("ready", () => {
      redisReady = true;
      console.log("[cache] Redis connected");
    });
    redis.on("error", (err) => {
      redisReady = false;
      console.warn("[cache] Redis error — falling back to memory:", err.message);
    });
    redis.on("end", () => {
      redisReady = false;
    });
  } catch (err) {
    console.warn("[cache] Redis init failed — using memory:", err.message);
  }
}

export const cache = {
  async get(key) {
    if (redisReady && redis) {
      const raw = await redis.get(key);
      return raw ? JSON.parse(raw) : null;
    }
    const entry = mem.get(key);
    if (!entry) return null;
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      mem.delete(key);
      return null;
    }
    return entry.value;
  },

  async set(key, value, ttlMs) {
    if (redisReady && redis) {
      const payload = JSON.stringify(value);
      if (ttlMs) await redis.set(key, payload, "PX", ttlMs);
      else await redis.set(key, payload);
      return;
    }
    mem.set(key, { value, expiresAt: ttlMs ? Date.now() + ttlMs : 0 });
  },

  async del(key) {
    if (redisReady && redis) await redis.del(key);
    else mem.delete(key);
  },

  isRedis() {
    return redisReady;
  },
};
