import { Router } from "express";
import { store } from "../store/index.js";
import { cache } from "../services/cache.js";

const router = Router();

const CACHE_KEY = "leaderboard:global";
const TTL = 15000;

async function buildLeaderboard() {
  const [users] = await Promise.all([store.users.all()]);
  const entries = [
    ...store.seedMembers().map((m) => ({
      id: m.id, name: m.name, avatar: m.avatar, points: m.points, lastRank: m.lastRank, isUser: false,
    })),
    ...users.map((u) => ({
      id: u.id, name: u.name, avatar: u.avatar, points: u.points ?? 0, lastRank: u.lastRank ?? null, isUser: true,
    })),
  ];

  entries.sort((a, b) => b.points - a.points);
  return entries.map((e, i) => {
    const rank = i + 1;
    const movement = e.lastRank == null ? 0 : e.lastRank - rank;
    return { ...e, rank, movement };
  });
}

// GET /api/leaderboard -> ranked standings (cached briefly)
router.get("/", async (req, res, next) => {
  try {
    let board = await cache.get(CACHE_KEY);
    if (!board) {
      board = await buildLeaderboard();
      await cache.set(CACHE_KEY, board, TTL);
    }
    res.json({ leaderboard: board, cached: cache.isRedis() });
  } catch (err) {
    next(err);
  }
});

export default router;
export { buildLeaderboard };
