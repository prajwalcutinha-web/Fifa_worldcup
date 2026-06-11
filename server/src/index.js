import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    // The app serves a React SPA that relies on inline styles and loads avatars
    // from external hosts, so the strict default CSP is disabled here. Re-enable
    // with a tailored policy (script/style/img-src allowlists) before hardening.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
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

// ---- Serve the built frontend (single-origin deployment) ----
// In production the Express app also serves the compiled React app, so the whole
// site runs as one origin (no CORS/cookie cross-site issues). We check a few
// candidate locations so it works regardless of the exact deploy layout.
const clientCandidates = [
  path.resolve(__dirname, "../../dist"), // local dev: server/src -> repo/dist
  path.resolve(__dirname, "../dist"),    // cPanel: app/src -> app/dist
  path.resolve(process.cwd(), "dist"),   // app root cwd -> ./dist
];
const clientDir = clientCandidates.find((p) => existsSync(p));
if (clientDir) {
  app.use(express.static(clientDir));
  // SPA fallback: anything that isn't an /api route returns index.html.
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(clientDir, "index.html"));
  });
  console.log(`[static] serving frontend from ${clientDir}`);
}

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
