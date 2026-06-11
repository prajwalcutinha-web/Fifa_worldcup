// Tiny persistent JSON datastore.
// Keeps everything in memory and serialises to disk on every write.
// Writes are serialised through a promise chain to avoid race conditions.
// For production scale, swap this module for PostgreSQL / SQLite — the rest
// of the app only depends on the exported `db` helpers, not the storage.

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SEED_LEADERBOARD } from "./data/seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

const DEFAULT_STATE = {
  users: [], // { id, name, email, avatar, passwordHash, createdAt }
  predictions: [], // { id, userId, matchId, homeScore, awayScore, firstTeam, firstPlayer, double, createdAt, locked, points }
  leagues: [
    {
      id: "global",
      name: "Global League",
      type: "public",
      ownerId: "system",
      inviteCode: null,
      maxMembers: 1000000,
      members: SEED_LEADERBOARD.map((s) => s.id),
      createdAt: new Date().toISOString(),
    },
  ],
  // Seed members exist only on the leaderboard, not as login-able users.
  seedMembers: SEED_LEADERBOARD,
};

let state = null;
let writeChain = Promise.resolve();

async function load() {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf8");
    state = JSON.parse(raw);
    // Ensure newly-added keys exist when upgrading an old store.
    state = { ...structuredClone(DEFAULT_STATE), ...state };
  } catch {
    state = structuredClone(DEFAULT_STATE);
    await persist();
  }
}

async function persist() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const snapshot = JSON.stringify(state, null, 2);
  await fs.writeFile(STORE_PATH, snapshot, "utf8");
}

// Queue every write so concurrent requests can't corrupt the file.
function write(mutator) {
  writeChain = writeChain.then(async () => {
    mutator(state);
    await persist();
  });
  return writeChain;
}

export const db = {
  async init() {
    if (!state) await load();
  },
  get() {
    return state;
  },
  write,
};
