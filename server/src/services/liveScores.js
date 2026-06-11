// Live score streaming via TheSportsDB — a free/open sports data API.
// Results are cached (Redis or in-memory) for `cacheTtlMs` so we poll politely
// and serve many clients from one upstream call. Falls back to the scraper /
// seed fixtures (via the fixtures service) when no live soccer data is found.

import axios from "axios";
import { config } from "../config.js";
import { cache } from "./cache.js";
import { TEAMS } from "../data/seed.js";

const CACHE_KEY = "live:soccer";

// TheSportsDB status strings that indicate an in-progress match.
const LIVE_STATUSES = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INPLAY"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN", "Match Finished"]);

function codeFor(name) {
  const code = Object.keys(TEAMS).find(
    (k) => TEAMS[k].name.toLowerCase() === String(name).toLowerCase()
  );
  return code ?? String(name ?? "").slice(0, 3).toUpperCase();
}
function flagFor(name) {
  const entry = Object.values(TEAMS).find(
    (t) => t.name.toLowerCase() === String(name).toLowerCase()
  );
  return entry ? entry.flag : "🏳️";
}

function mapEvent(ev, i) {
  const home = ev.strHomeTeam ?? "";
  const away = ev.strAwayTeam ?? "";
  const hs = ev.intHomeScore;
  const as = ev.intAwayScore;
  const hasScore = hs !== null && hs !== undefined && as !== null && as !== undefined;
  const status = ev.strStatus || ev.strProgress || "";
  const isLive = LIVE_STATUSES.has(String(status).toUpperCase()) || LIVE_STATUSES.has(status);
  const isFinished = FINISHED_STATUSES.has(status) || FINISHED_STATUSES.has(String(status).toUpperCase());
  const minuteMatch = String(ev.strProgress ?? status).match(/(\d+)/);
  return {
    id: Number(ev.idEvent) || i + 1,
    home, homeCode: codeFor(home), homeFlag: flagFor(home),
    away, awayCode: codeFor(away), awayFlag: flagFor(away),
    time: ev.strTime ?? ev.strEventTime ?? "",
    date: ev.dateEvent ?? "",
    stadium: ev.strVenue ?? "",
    city: "",
    group: ev.strLeague ?? "",
    matchday: 1,
    state: isLive ? "live" : isFinished ? "finished" : "upcoming",
    score: hasScore ? `${hs}-${as}` : undefined,
    minute: isLive && minuteMatch ? Number(minuteMatch[1]) : undefined,
  };
}

function todayUtc() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

async function fetchLive() {
  // Free v1 endpoint: the day's soccer events (includes in-progress matches
  // with scores + status). v2 /livescore requires a paid key.
  const url = `${config.liveScores.baseUrl}/${config.liveScores.sportsDbKey}/eventsday.php?d=${todayUtc()}&s=Soccer`;
  const res = await axios.get(url, { timeout: 9000, headers: { Accept: "application/json" } });
  const events = res.data?.events;
  if (!Array.isArray(events)) return [];
  return events.map(mapEvent).filter((m) => m.state === "live");
}

/**
 * Returns currently-live soccer matches. Cached + resilient.
 */
export async function getLiveScores() {
  const cached = await cache.get(CACHE_KEY);
  if (cached) return { fixtures: cached, source: "thesportsdb", cached: true };

  try {
    const live = await fetchLive();
    await cache.set(CACHE_KEY, live, config.liveScores.cacheTtlMs);
    return { fixtures: live, source: "thesportsdb", cached: false };
  } catch (err) {
    return { fixtures: [], source: "live-unavailable", cached: false, error: err.message };
  }
}
