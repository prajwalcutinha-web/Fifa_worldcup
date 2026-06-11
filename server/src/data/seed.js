// Country -> flag emoji + 3-letter code helpers for real fixture data.
// No dummy fixtures or fake leaderboard members here — all match data comes
// from the live World Cup feed (TheSportsDB), and the leaderboard is built
// only from real registered users.

const COUNTRY = {
  Argentina: ["ARG", "🇦🇷"], France: ["FRA", "🇫🇷"], Brazil: ["BRA", "🇧🇷"],
  Germany: ["GER", "🇩🇪"], Spain: ["ESP", "🇪🇸"], Japan: ["JPN", "🇯🇵"],
  England: ["ENG", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"], Portugal: ["POR", "🇵🇹"], USA: ["USA", "🇺🇸"],
  "United States": ["USA", "🇺🇸"], Mexico: ["MEX", "🇲🇽"], Canada: ["CAN", "🇨🇦"],
  Morocco: ["MAR", "🇲🇦"], Netherlands: ["NED", "🇳🇱"], Senegal: ["SEN", "🇸🇳"],
  Australia: ["AUS", "🇦🇺"], "Saudi Arabia": ["KSA", "🇸🇦"], Ghana: ["GHA", "🇬🇭"],
  Belgium: ["BEL", "🇧🇪"], Croatia: ["CRO", "🇭🇷"], Italy: ["ITA", "🇮🇹"],
  Uruguay: ["URU", "🇺🇾"], Colombia: ["COL", "🇨🇴"], Switzerland: ["SUI", "🇨🇭"],
  Denmark: ["DEN", "🇩🇰"], Poland: ["POL", "🇵🇱"], "South Korea": ["KOR", "🇰🇷"],
  "Korea Republic": ["KOR", "🇰🇷"], Serbia: ["SRB", "🇷🇸"], "Czech Republic": ["CZE", "🇨🇿"],
  Czechia: ["CZE", "🇨🇿"], "South Africa": ["RSA", "🇿🇦"], "Bosnia-Herzegovina": ["BIH", "🇧🇦"],
  "Bosnia and Herzegovina": ["BIH", "🇧🇦"], Iran: ["IRN", "🇮🇷"], Qatar: ["QAT", "🇶🇦"],
  Ecuador: ["ECU", "🇪🇨"], "Costa Rica": ["CRC", "🇨🇷"], Tunisia: ["TUN", "🇹🇳"],
  Cameroon: ["CMR", "🇨🇲"], Nigeria: ["NGA", "🇳🇬"], Egypt: ["EGY", "🇪🇬"],
  Algeria: ["ALG", "🇩🇿"], "Ivory Coast": ["CIV", "🇨🇮"], Wales: ["WAL", "🏴󠁧󠁢󠁷󠁬󠁳󠁿"],
  Scotland: ["SCO", "🏴󠁧󠁢󠁳󠁣󠁴󠁿"], Austria: ["AUT", "🇦🇹"], Sweden: ["SWE", "🇸🇪"],
  Norway: ["NOR", "🇳🇴"], Turkey: ["TUR", "🇹🇷"], "Turkiye": ["TUR", "🇹🇷"],
  Ukraine: ["UKR", "🇺🇦"], Greece: ["GRE", "🇬🇷"], Peru: ["PER", "🇵🇪"],
  Chile: ["CHI", "🇨🇱"], Paraguay: ["PAR", "🇵🇾"], "New Zealand": ["NZL", "🇳🇿"],
  Jordan: ["JOR", "🇯🇴"], Uzbekistan: ["UZB", "🇺🇿"], Jamaica: ["JAM", "🇯🇲"],
  Panama: ["PAN", "🇵🇦"], Honduras: ["HON", "🇭🇳"], Mali: ["MLI", "🇲🇱"],
  "Cape Verde": ["CPV", "🇨🇻"], "DR Congo": ["COD", "🇨🇩"], Slovenia: ["SVN", "🇸🇮"],
  Slovakia: ["SVK", "🇸🇰"], Hungary: ["HUN", "🇭🇺"], Romania: ["ROU", "🇷🇴"],
};

export function teamCode(name) {
  const c = COUNTRY[name];
  if (c) return c[0];
  return String(name ?? "")
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")[0]
    .slice(0, 3)
    .toUpperCase();
}

export function teamFlag(name) {
  const c = COUNTRY[name];
  return c ? c[1] : "⚽";
}
