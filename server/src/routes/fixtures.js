import { Router } from "express";
import { getFixtures, getLiveFixtures } from "../services/scraper.js";
import { getLiveScores } from "../services/liveScores.js";

const router = Router();

// Overlay live scores (from TheSportsDB) onto the fixtures list by team code.
function overlayLive(fixtures, live) {
  if (!live.length) return fixtures;
  return fixtures.map((m) => {
    const match = live.find(
      (l) =>
        (l.homeCode === m.homeCode && l.awayCode === m.awayCode) ||
        (l.home && m.home && l.home.toLowerCase() === m.home.toLowerCase())
    );
    if (!match) return m;
    return { ...m, state: "live", score: match.score ?? m.score, minute: match.minute };
  });
}

// GET /api/fixtures  -> all fixtures with live scores overlaid
router.get("/", async (req, res, next) => {
  try {
    const force = req.query.refresh === "true";
    const [base, live] = await Promise.all([getFixtures({ force }), getLiveScores()]);
    const fixtures = overlayLive(base.fixtures, live.fixtures);
    res.json({
      fixtures,
      source: base.source,
      liveSource: live.source,
      liveCount: live.fixtures.length,
      cached: base.cached,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/fixtures/live -> live matches (TheSportsDB, then scraper fallback)
router.get("/live", async (req, res, next) => {
  try {
    const live = await getLiveScores();
    if (live.fixtures.length > 0) return res.json(live);
    res.json(await getLiveFixtures()); // fallback to scraper-detected live
  } catch (err) {
    next(err);
  }
});

export default router;
