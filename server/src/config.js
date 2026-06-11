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
  liveScores: {
    // TheSportsDB is a free/open sports data API. The "3" test key works for
    // the free season/event endpoints without registration.
    sportsDbKey: process.env.SPORTSDB_KEY ?? "3",
    baseUrl: "https://www.thesportsdb.com/api/v1/json",
    cacheTtlMs: Number(process.env.LIVE_CACHE_TTL_MS ?? 30000),
  },
  worldcup: {
    // TheSportsDB league id for the FIFA World Cup, and the season to load.
    leagueId: process.env.WC_LEAGUE_ID ?? "4429",
    season: process.env.WC_SEASON ?? "2026",
  },
  serpapi: {
    // SerpAPI (Google Sports Results) for live scores + results.
    key: process.env.SERPAPI_KEY ?? "",
    keyBackup: process.env.SERPAPI_KEY_BACKUP ?? "",
    query: process.env.SERPAPI_QUERY ?? "fifa world cup",
    // gl=in localises Google sports times to India (IST).
    gl: process.env.SERPAPI_GL ?? "in",
  },
};
