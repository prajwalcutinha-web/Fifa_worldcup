// Cron entry point — run every minute.
// Connects to MongoDB, and (to respect SerpAPI quota) only calls SerpAPI when a
// match is in its live window OR the fixture store is empty (initial load).
// Stores/updates fixtures + live scores in the database, then exits.

import { connectMongo } from "../db/mongo.js";
import { initCache } from "../services/cache.js";
import { store } from "../store/index.js";
import { syncFixtures, getStoredFixtures, isMatchWindowOpen } from "../services/serpapi.js";

const FORCE = process.argv.includes("--force");

initCache();
await connectMongo();
await store.init();

const stored = await getStoredFixtures();
const windowOpen = await isMatchWindowOpen();

if (FORCE || stored.length === 0 || windowOpen) {
  const r = await syncFixtures();
  console.log(`[sync ${new Date().toISOString()}] ${JSON.stringify(r)} (stored before: ${stored.length}, window: ${windowOpen})`);
} else {
  console.log(`[sync ${new Date().toISOString()}] skipped — no live window (stored: ${stored.length})`);
}

process.exit(0);
