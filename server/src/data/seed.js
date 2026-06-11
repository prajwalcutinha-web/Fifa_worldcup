// Seed / fallback data for the WC26 Predictor League.
// Used when the live scraper is unavailable so the app always has content.
// Shape matches what the React frontend expects for a Match.

export const TEAMS = {
  ARG: { name: "Argentina", flag: "🇦🇷" },
  FRA: { name: "France", flag: "🇫🇷" },
  BRA: { name: "Brazil", flag: "🇧🇷" },
  GER: { name: "Germany", flag: "🇩🇪" },
  ESP: { name: "Spain", flag: "🇪🇸" },
  JPN: { name: "Japan", flag: "🇯🇵" },
  ENG: { name: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿" },
  POR: { name: "Portugal", flag: "🇵🇹" },
  USA: { name: "USA", flag: "🇺🇸" },
  MEX: { name: "Mexico", flag: "🇲🇽" },
  CAN: { name: "Canada", flag: "🇨🇦" },
  MAR: { name: "Morocco", flag: "🇲🇦" },
  NED: { name: "Netherlands", flag: "🇳🇱" },
  SEN: { name: "Senegal", flag: "🇸🇳" },
  AUS: { name: "Australia", flag: "🇦🇺" },
  KSA: { name: "Saudi Arabia", flag: "🇸🇦" },
  GHA: { name: "Ghana", flag: "🇬🇭" },
};

export const FALLBACK_FIXTURES = [
  { id: 1, home: "Argentina", homeCode: "ARG", homeFlag: "🇦🇷", away: "France", awayCode: "FRA", awayFlag: "🇫🇷", time: "18:00", date: "Jun 14", stadium: "MetLife Stadium", city: "New Jersey", group: "Group A", matchday: 1, state: "live", score: "1-1", minute: 67, kickoff: "2026-06-14T18:00:00Z" },
  { id: 2, home: "Brazil", homeCode: "BRA", homeFlag: "🇧🇷", away: "Germany", awayCode: "GER", awayFlag: "🇩🇪", time: "15:00", date: "Jun 15", stadium: "AT&T Stadium", city: "Dallas", group: "Group D", matchday: 1, state: "upcoming", kickoff: "2026-06-15T15:00:00Z" },
  { id: 3, home: "Spain", homeCode: "ESP", homeFlag: "🇪🇸", away: "Japan", awayCode: "JPN", awayFlag: "🇯🇵", time: "21:00", date: "Jun 15", stadium: "SoFi Stadium", city: "Los Angeles", group: "Group B", matchday: 1, state: "upcoming", kickoff: "2026-06-15T21:00:00Z" },
  { id: 4, home: "England", homeCode: "ENG", homeFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", away: "Portugal", awayCode: "POR", awayFlag: "🇵🇹", time: "18:00", date: "Jun 16", stadium: "Rose Bowl", city: "Los Angeles", group: "Group C", matchday: 1, state: "upcoming", kickoff: "2026-06-16T18:00:00Z" },
  { id: 5, home: "USA", homeCode: "USA", homeFlag: "🇺🇸", away: "Mexico", awayCode: "MEX", awayFlag: "🇲🇽", time: "20:00", date: "Jun 16", stadium: "Estadio Azteca", city: "Mexico City", group: "Group E", matchday: 1, state: "upcoming", kickoff: "2026-06-16T20:00:00Z" },
  { id: 6, home: "Canada", homeCode: "CAN", homeFlag: "🇨🇦", away: "Morocco", awayCode: "MAR", awayFlag: "🇲🇦", time: "18:00", date: "Jun 17", stadium: "BC Place", city: "Vancouver", group: "Group F", matchday: 1, state: "upcoming", kickoff: "2026-06-17T18:00:00Z" },
  { id: 7, home: "Netherlands", homeCode: "NED", homeFlag: "🇳🇱", away: "Senegal", awayCode: "SEN", awayFlag: "🇸🇳", time: "15:00", date: "Jun 17", stadium: "Gillette Stadium", city: "Boston", group: "Group G", matchday: 1, state: "upcoming", kickoff: "2026-06-17T15:00:00Z" },
  { id: 8, home: "Australia", homeCode: "AUS", homeFlag: "🇦🇺", away: "Saudi Arabia", awayCode: "KSA", awayFlag: "🇸🇦", time: "15:00", date: "Jun 12", stadium: "Levi's Stadium", city: "San Francisco", group: "Group H", matchday: 1, state: "finished", score: "2-0", kickoff: "2026-06-12T15:00:00Z" },
  { id: 9, home: "Portugal", homeCode: "POR", homeFlag: "🇵🇹", away: "Ghana", awayCode: "GHA", awayFlag: "🇬🇭", time: "21:00", date: "Jun 12", stadium: "Hard Rock Stadium", city: "Miami", group: "Group C", matchday: 1, state: "finished", score: "3-2", kickoff: "2026-06-12T21:00:00Z" },
];

// A handful of demo league members so the leaderboard is populated before
// real users sign up. Real users are appended dynamically.
export const SEED_LEADERBOARD = [
  { id: "seed-1", name: "John D.", avatar: "", points: 142, lastRank: 3 },
  { id: "seed-2", name: "Sarah M.", avatar: "", points: 138, lastRank: 1 },
  { id: "seed-3", name: "Alex K.", avatar: "", points: 135, lastRank: 8 },
  { id: "seed-4", name: "Mike R.", avatar: "", points: 128, lastRank: 2 },
  { id: "seed-5", name: "Lisa T.", avatar: "", points: 125, lastRank: 6 },
];
