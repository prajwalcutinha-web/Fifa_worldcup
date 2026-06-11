import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { config } from "./config.js";
import { connectMongo } from "./db/mongo.js";
import { initCache } from "./services/cache.js";
import { store } from "./store/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.js";
import fixtureRoutes from "./routes/fixtures.js";
import predictionRoutes from "./routes/predictions.js";
import leaderboardRoutes from "./routes/leaderboard.js";
import leagueRoutes from "./routes/leagues.js";
import analyticsRoutes from "./routes/analytics.js";

// Initialise infrastructure (each degrades gracefully if not configured).
initCache();
await connectMongo();
await store.init();

const app = express();

// Trust the first proxy (needed for correct client IPs behind nginx/Heroku/etc).
app.set("trust proxy", 1);

// --- Security headers ---
app.use(
  helmet({
    // The API serves JSON only; a strict default CSP is fine. The frontend
    // (separate origin) sets its own CSP.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// --- CORS: explicit allowlist + credentials for cookie auth ---
app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / curl (no Origin header) and allowlisted origins.
      if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`Origin not allowed by CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(compression());
app.use(express.json({ limit: "100kb" })); // cap body size to limit abuse
app.use(cookieParser());
app.use(morgan(config.isProd ? "combined" : "dev"));

// --- Global rate limit (defends against brute force / scraping abuse) ---
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);

// Stricter limiter for auth endpoints (anti credential-stuffing).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later." },
});

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/fixtures", fixtureRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/leagues", leagueRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(notFound);
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`WC26 API listening on http://localhost:${config.port} (${config.isProd ? "prod" : "dev"})`);
  console.log(`Allowed origins: ${config.corsOrigins.join(", ")}`);
  console.log(
    `Google OAuth: ${config.google.clientId ? "enabled" : "disabled"} | ` +
      `Live scores: TheSportsDB (key ${config.liveScores.sportsDbKey})`
  );
});
