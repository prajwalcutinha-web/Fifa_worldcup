import { Router } from "express";
import { store } from "../store/index.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

function aggregateByMatchday(preds) {
  const map = new Map();
  for (const p of preds) {
    const md = p.matchday ?? 1;
    map.set(md, (map.get(md) ?? 0) + (p.points ?? 0));
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([matchday, points]) => ({ matchday, points }));
}

// GET /api/analytics -> current user's prediction analytics
router.get("/", async (req, res, next) => {
  try {
    const preds = await store.predictions.byUser(req.user.id);
    const scored = preds.filter((p) => p.locked || (p.points ?? 0) > 0);
    const totalPoints = preds.reduce((sum, p) => sum + (p.points ?? 0), 0);
    const correct = scored.filter((p) => (p.points ?? 0) > 0).length;
    const accuracy = scored.length ? Math.round((correct / scored.length) * 100) : 0;
    const doubleUsed = preds.filter((p) => p.double).length;

    res.json({
      totalPredictions: preds.length,
      scoredPredictions: scored.length,
      totalPoints,
      correct,
      accuracy,
      doubleUsed,
      pointsByMatchday: aggregateByMatchday(preds),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
