// Live results + scores via SerpAPI (Google Sports Results).
// The cron calls syncFixtures() every minute (gated to match windows) to store
// fixtures/scores in MongoDB; the app reads them with getStoredFixtures().

import axios from "axios";
import { config } from "../config.js";
import { isMongoConnected } from "../db/mongo.js";
import { Fixture } from "../models/index.js";
import { teamCode, teamFlag } from "../data/seed.js";

let memCache = []; // fallback when Mongo isn't connected

function hashId(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return (h % 1_000_000_000) || 1;
}

function keyFor(home, away) {
  return `${home}__${away}`.toLowerCase().replace(/\s+/g, "_");
}

// Best-effort parse of SerpAPI's relative date + time into an ISO timestamp.
function parseKickoff(dateText, timeText) {
  if (!dateText) return null;
  const now = new Date();
  let base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const d = String(dateText).toLowerCase();
  if (/tomorrow/.test(d)) base.setUTCDate(base.getUTCDate() + 1);
  else if (/yesterday/.test(d)) base.setUTCDate(base.getUTCDate() - 1);
  else if (!/today/.test(d)) {
    const parsed = Date.parse(`${dateText} ${now.getUTCFullYear()}`);
    if (!Number.isNaN(parsed)) base = new Date(parsed);
  }
  if (timeText) {
    const m = String(timeText).match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (m) {
      let hr = Number(m[1]); const min = Number(m[2]); const ap = (m[3] || "").toUpperCase();
      if (ap === "PM" && hr < 12) hr += 12;
      if (ap === "AM" && hr === 12) hr = 0;
      base.setUTCHours(hr, min, 0, 0);
    }
  }
  // Times come back localised to IST (gl=in); convert IST -> UTC for storage.
  if (config.serpapi.gl === "in") base = new Date(base.getTime() - 330 * 60 * 1000);
  return base.toISOString();
}

function classify(statusText, hasScore) {
  const s = (statusText || "").toLowerCase();
  if (/final|full.?time|\bft\b|ended|aggregate/.test(s)) return "finished";
  if (/live|half.?time|\bht\b|\d+['’]|min|et\b|aggregate/.test(s)) return "live";
  if (hasScore) return "live"; // has a score but no explicit final marker
  return "upcoming";
}

function mapGame(g, isSpotlight = false) {
  const teams = g.teams || [];
  if (teams.length < 2) return null;
  const home = teams[0].name;
  const away = teams[1].name;
  const hs = teams[0].score;
  const as = teams[1].score;
  const hasScore = hs !== undefined && hs !== null && hs !== "" && as !== undefined && as !== null && as !== "";
  const statusText = g.status || g.stage_result || (isSpotlight ? g.spotlight_type : "") || "";
  const minuteMatch = String(statusText).match(/(\d+)['’]/);
  const key = keyFor(home, away);
  return {
    id: hashId(key),
    key,
    home, homeCode: teamCode(home), homeFlag: teamFlag(home),
    away, awayCode: teamCode(away), awayFlag: teamFlag(away),
    time: g.time ? `${g.time} IST` : "",
    date: typeof g.date === "string" ? g.date : "",
    stadium: g.venue || g.stadium || "",
    city: "",
    group: g.stage || g.tournament_stage || "",
    matchday: 1,
    state: classify(statusText, hasScore),
    score: hasScore ? `${hs}-${as}` : null,
    minute: minuteMatch ? Number(minuteMatch[1]) : null,
    statusText: String(statusText),
    kickoff: parseKickoff(g.date, g.time),
    source: "serpapi",
  };
}

async function fetchSports() {
  const keys = [config.serpapi.key, config.serpapi.keyBackup].filter(Boolean);
  if (!keys.length) throw new Error("SERPAPI_KEY not configured");
  let lastErr;
  for (const key of keys) {
    try {
      const res = await axios.get("https://serpapi.com/search.json", {
        params: { engine: "google", q: config.serpapi.query, gl: config.serpapi.gl, hl: "en", api_key: key },
        timeout: 15000,
      });
      // SerpAPI returns an `error` field (e.g. quota) with HTTP 200 sometimes.
      if (res.data?.error) throw new Error(res.data.error);
      return res.data?.sports_results || null;
    } catch (err) {
      lastErr = err;
      // Try the next (backup) key on quota/auth errors.
      const status = err.response?.status;
      if (status && ![401, 403, 429].includes(status)) break;
    }
  }
  throw lastErr ?? new Error("SerpAPI request failed");
}

export function parseFixtures(sports) {
  if (!sports) return [];
  const byKey = new Map();
  for (const g of sports.games || []) {
    const f = mapGame(g);
    if (f) byKey.set(f.key, f);
  }
  // The spotlight is the featured live/finished game — it has the freshest score.
  if (sports.game_spotlight) {
    const f = mapGame(sports.game_spotlight, true);
    if (f) byKey.set(f.key, { ...(byKey.get(f.key) || {}), ...f });
  }
  return [...byKey.values()];
}

/** Fetch from SerpAPI and upsert fixtures into Mongo (or mem cache). */
export async function syncFixtures() {
  const sports = await fetchSports();
  const fixtures = parseFixtures(sports);
  if (!fixtures.length) return { synced: 0, source: "serpapi-empty" };

  if (isMongoConnected()) {
    for (const f of fixtures) {
      await Fixture.findOneAndUpdate({ key: f.key }, { $set: f }, { upsert: true });
    }
  } else {
    const map = new Map(memCache.map((x) => [x.key, x]));
    for (const f of fixtures) map.set(f.key, f);
    memCache = [...map.values()];
  }
  return { synced: fixtures.length, source: "serpapi" };
}

/** Read stored fixtures for the app. */
export async function getStoredFixtures() {
  let list;
  if (isMongoConnected()) {
    list = (await Fixture.find().lean()).map((d) => ({ ...d, _id: undefined }));
  } else {
    list = memCache;
  }
  list = [...list].sort((a, b) => (a.kickoff || a.date || "").localeCompare(b.kickoff || b.date || ""));
  return list;
}

/** True if any fixture is within its live window (used to gate the cron). */
export async function isMatchWindowOpen() {
  const list = await getStoredFixtures();
  const now = Date.now();
  return list.some((f) => {
    if (f.state === "live") return true;
    if (!f.kickoff) return false;
    const ko = Date.parse(f.kickoff);
    if (Number.isNaN(ko)) return false;
    return now >= ko - 10 * 60 * 1000 && now <= ko + 3 * 60 * 60 * 1000;
  });
}
