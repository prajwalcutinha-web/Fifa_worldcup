import { Router } from "express";
import { z } from "zod";
import { store } from "../store/index.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { getStoredFixtures } from "../services/serpapi.js";

const router = Router();

const predictionSchema = z.object({
  matchId: z.number().int().positive(),
  homeScore: z.number().int().min(0).max(99),
  awayScore: z.number().int().min(0).max(99),
  firstTeam: z.enum(["home", "away", "none"]).optional(),
  firstPlayer: z.string().trim().max(60).optional(),
  double: z.boolean().optional().default(false),
});

router.use(requireAuth);

// GET /api/predictions -> current user's predictions
router.get("/", async (req, res, next) => {
  try {
    res.json({ predictions: await store.predictions.byUser(req.user.id) });
  } catch (err) {
    next(err);
  }
});

// POST /api/predictions -> create or update (upsert)
router.post("/", validate(predictionSchema), async (req, res, next) => {
  try {
    const body = req.body;
    const fixtures = await getStoredFixtures();
    const match = fixtures.find((m) => m.id === body.matchId);
    if (!match) return res.status(404).json({ error: "Match not found" });

    // Server-side lock enforcement (spec: locked 10 min before kickoff; here we
    // also block any match already live/finished/locked).
    if (["live", "finished", "locked"].includes(match.state)) {
      return res.status(409).json({ error: "Predictions are locked for this match" });
    }
    if (match.kickoff) {
      const lockAt = new Date(match.kickoff).getTime() - 10 * 60 * 1000;
      if (Date.now() >= lockAt) {
        return res.status(409).json({ error: "Predictions lock 10 minutes before kickoff" });
      }
    }

    // Only one Double Points selection per user.
    if (body.double) await store.predictions.clearDoubleExcept(req.user.id, body.matchId);

    const saved = await store.predictions.upsert(req.user.id, body.matchId, {
      ...body,
      matchday: match.matchday ?? 1,
    });
    res.status(201).json({ prediction: saved });
  } catch (err) {
    next(err);
  }
});

// POST /api/predictions/potential -> compute potential points
router.post("/potential", validate(predictionSchema), (req, res) => {
  const max =
    3 +
    (req.body.firstTeam && req.body.firstTeam !== "none" ? 5 : 0) +
    (req.body.firstPlayer ? 6 : 0);
  res.json({ potential: req.body.double ? max * 2 : max, doubled: req.body.double });
});

export default router;
