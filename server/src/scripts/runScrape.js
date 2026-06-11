// Manual scrape runner for debugging: `npm run scrape`
import { getFixtures } from "../services/scraper.js";

const result = await getFixtures({ force: true });
console.log(`source: ${result.source}`);
if (result.error) console.log(`error:  ${result.error}`);
console.log(`matches: ${result.fixtures.length}`);
console.table(
  result.fixtures.map((m) => ({
    match: `${m.homeCode} v ${m.awayCode}`,
    state: m.state,
    score: m.score ?? "-",
  }))
);
