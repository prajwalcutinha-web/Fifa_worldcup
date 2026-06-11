// Live-data web scraper.
//
// Fetches a public football results/fixtures page and extracts match data with
// Cheerio. Results are cached for `cacheTtlMs` to avoid hammering the source
// (be a polite scraper). If the scrape fails for any reason we fall back to the
// seed fixtures so the API never goes dark.
//
// NOTE ON LEGALITY: Always confirm the target site's robots.txt and Terms of
// Service permit automated access, and prefer an official data API where one
// exists. This scraper identifies itself via a custom User-Agent and rate-limits
// itself through caching. Treat all scraped content as untrusted input.

import axios from "axios";
import * as cheerio from "cheerio";
import { config } from "../config.js";
import { FALLBACK_FIXTURES, TEAMS } from "../data/seed.js";

let cache = { data: null, fetchedAt: 0, source: "none" };

function flagFor(name) {
  const entry = Object.values(TEAMS).find(
    (t) => t.name.toLowerCase() === String(name).toLowerCase()
  );
  return entry ? entry.flag : "🏳️";
}

function codeFor(name) {
  const code = Object.keys(TEAMS).find(
    (k) => TEAMS[k].name.toLowerCase() === String(name).toLowerCase()
  );
  return code ?? String(name).slice(0, 3).toUpperCase();
}

// Normalise a scraped fixture into the shape the frontend expects.
function normalise(raw, index) {
  const homeCode = codeFor(raw.home);
  const awayCode = codeFor(raw.away);
  return {
    id: raw.id ?? index + 1,
    home: raw.home,
    homeCode,
    homeFlag: flagFor(raw.home),
    away: raw.away,
    awayCode,
    awayFlag: flagFor(raw.away),
    time: raw.time ?? "TBD",
    date: raw.date ?? "TBD",
    stadium: raw.stadium ?? "",
    city: raw.city ?? "",
    group: raw.group ?? "",
    matchday: raw.matchday ?? 1,
    state: raw.state ?? "upcoming",
    score: raw.score,
    minute: raw.minute,
    kickoff: raw.kickoff,
  };
}

// Parse a BBC-style scores/fixtures document. Site markup changes over time,
// so this is defensive: any parsing miss simply yields zero matches and the
// caller falls back to seed data.
function parseDocument(html) {
  const $ = cheerio.load(html);
  const matches = [];

  // BBC renders each fixture inside elements exposing team names via
  // aria-label or dedicated team-name spans. We try a couple of selectors.
  $("[class*='fixture'], li[class*='Fixture'], article[class*='Fixture']").each(
    (i, el) => {
      const node = $(el);
      const teamNames = node
        .find("[class*='team'] , [class*='Team'] , abbr")
        .map((_, t) => $(t).text().trim())
        .get()
        .filter(Boolean);

      if (teamNames.length < 2) return;
      const [home, away] = teamNames;

      const scoreText = node
        .find("[class*='score'], [class*='Score']")
        .first()
        .text()
        .trim();
      const score = /^\d+\s*[-–]\s*\d+$/.test(scoreText)
        ? scoreText.replace(/\s/g, "").replace("–", "-")
        : undefined;

      const isLive = /live|min|'/i.test(node.text()) && Boolean(score);

      matches.push({
        home,
        away,
        score,
        state: score ? (isLive ? "live" : "finished") : "upcoming",
      });
    }
  );

  return matches;
}

async function scrape() {
  const res = await axios.get(config.scrape.sourceUrl, {
    headers: {
      "User-Agent": config.scrape.userAgent,
      Accept: "text/html,application/xhtml+xml",
    },
    timeout: 10000,
    // Treat large pages defensively.
    maxContentLength: 8 * 1024 * 1024,
  });
  const parsed = parseDocument(res.data);
  return parsed.map(normalise);
}

/**
 * Returns live fixtures, using a short-lived cache. Falls back to seed data on
 * any failure. The response always includes a `source` flag for transparency.
 */
export async function getFixtures({ force = false } = {}) {
  const fresh = Date.now() - cache.fetchedAt < config.scrape.cacheTtlMs;
  if (!force && cache.data && fresh) {
    return { fixtures: cache.data, source: cache.source, cached: true };
  }

  try {
    const scraped = await scrape();
    if (scraped.length > 0) {
      cache = { data: scraped, fetchedAt: Date.now(), source: "scraped" };
      return { fixtures: scraped, source: "scraped", cached: false };
    }
    throw new Error("Scrape returned no matches");
  } catch (err) {
    // Graceful degradation: serve seed data and keep the app functional.
    const fallback = FALLBACK_FIXTURES.map(normalise);
    cache = { data: fallback, fetchedAt: Date.now(), source: "fallback" };
    return {
      fixtures: fallback,
      source: "fallback",
      cached: false,
      error: err.message,
    };
  }
}

export async function getLiveFixtures() {
  const { fixtures, source } = await getFixtures();
  return { fixtures: fixtures.filter((m) => m.state === "live"), source };
}
