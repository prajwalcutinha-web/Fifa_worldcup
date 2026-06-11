import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { store } from "../store/index.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

function publicLeague(l) {
  return {
    id: l.id,
    name: l.name,
    type: l.type,
    memberCount: l.members.length,
    maxMembers: l.maxMembers,
    inviteCode: l.type === "private" ? l.inviteCode : null,
    ownerId: l.ownerId,
  };
}

// GET /api/leagues
router.get("/", async (req, res, next) => {
  try {
    const leagues = await store.leagues.all();
    res.json({ leagues: leagues.map(publicLeague) });
  } catch (err) {
    next(err);
  }
});

router.use(requireAuth);

const createSchema = z.object({
  name: z.string().trim().min(3).max(50),
  type: z.enum(["public", "private"]),
  maxMembers: z.number().int().min(10).max(500).default(100),
});

// POST /api/leagues -> create
router.post("/", validate(createSchema), async (req, res, next) => {
  try {
    const league = await store.leagues.create({
      name: req.body.name,
      type: req.body.type,
      ownerId: req.user.id,
      inviteCode: req.body.type === "private" ? nanoid(8).toUpperCase() : null,
      maxMembers: req.body.maxMembers,
      members: [req.user.id],
    });
    res.status(201).json({ league: publicLeague(league) });
  } catch (err) {
    next(err);
  }
});

const joinSchema = z.object({
  leagueId: z.string().optional(),
  inviteCode: z.string().trim().max(16).optional(),
});

// POST /api/leagues/join
router.post("/join", validate(joinSchema), async (req, res, next) => {
  try {
    const { leagueId, inviteCode } = req.body;
    let league = null;
    if (inviteCode) league = await store.leagues.findByInvite(inviteCode.toUpperCase());
    if (!league && leagueId) league = await store.leagues.findPublicById(leagueId);

    if (!league) return res.status(404).json({ error: "League not found or invalid code" });
    if (league.members.length >= league.maxMembers) {
      return res.status(409).json({ error: "League is full" });
    }
    if (league.members.includes(req.user.id)) {
      return res.json({ league: publicLeague(league), already: true });
    }

    await store.leagues.addMember(league.id, req.user.id);
    league.members.push(req.user.id);
    res.json({ league: publicLeague(league) });
  } catch (err) {
    next(err);
  }
});

export default router;
