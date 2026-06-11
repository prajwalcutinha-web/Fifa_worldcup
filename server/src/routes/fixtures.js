import { Router } from "express";
import { getStoredFixtures, syncFixtures } from "../services/serpapi.js";

const router = Router();

// GET /api/fixtures -> fixtures + live results, read from the database
// (kept fresh by the per-minute cron). If the store is empty, sync once.
router.get("/", async (req, res, next) => {
  try {
    let fixtures = await getStoredFixtures();
    let synced = false;
    if (fixtures.length === 0 || req.query.refresh === "true") {
      await syncFixtures().catch(() => {});
      fixtures = await getStoredFixtures();
      synced = true;
    }
    res.json({ fixtures, source: "serpapi", count: fixtures.length, synced });
  } catch (err) {
    next(err);
  }
});

// GET /api/fixtures/live -> only in-progress matches
router.get("/live", async (req, res, next) => {
  try {
    const fixtures = (await getStoredFixtures()).filter((m) => m.state === "live");
    res.json({ fixtures, source: "serpapi" });
  } catch (err) {
    next(err);
  }
});

export default router;
