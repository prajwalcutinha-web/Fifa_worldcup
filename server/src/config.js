import dotenv from "dotenv";

dotenv.config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const isProd = process.env.NODE_ENV === "production";

// In production we refuse to boot with the insecure default secret.
const jwtSecret = required("JWT_SECRET", "dev-only-insecure-secret");
if (isProd && jwtSecret === "dev-only-insecure-secret") {
  throw new Error("JWT_SECRET must be set to a strong value in production.");
}

export const config = {
  isProd,
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:3000,http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
  // Where to send the user after a successful OAuth login.
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  jwt: {
    secret: jwtSecret,
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? jwtSecret + "-refresh",
  },
  cookie: {
    name: "wc26_session",
    secure: process.env.COOKIE_SECURE === "true" || isProd,
    // 7 days in ms
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
  mongo: {
    uri: process.env.MONGODB_URI ?? "",
    dbName: process.env.MONGODB_DB ?? "wc2026_predictor",
  },
  redis: {
    url: process.env.REDIS_URL ?? "",
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    callbackUrl:
      process.env.GOOGLE_CALLBACK_URL ?? "http://localhost:4000/api/auth/google/callback",
  },
  liveScores: {
    // TheSportsDB is a free/open sports data API. The "3" test key works for
    // the free livescore/events endpoints without registration.
    sportsDbKey: process.env.SPORTSDB_KEY ?? "3",
    baseUrl: "https://www.thesportsdb.com/api/v1/json",
    cacheTtlMs: Number(process.env.LIVE_CACHE_TTL_MS ?? 30000),
  },
  scrape: {
    sourceUrl:
      process.env.SCRAPE_SOURCE_URL ??
      "https://www.bbc.com/sport/football/world-cup/scores-fixtures",
    cacheTtlMs: Number(process.env.SCRAPE_CACHE_TTL_MS ?? 60000),
    userAgent: process.env.SCRAPE_USER_AGENT ?? "WC26PredictorBot/1.0",
  },
};
