import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Filter, Search, RefreshCw } from "lucide-react";
import { api, type Match as ApiMatch } from "../../lib/api";

type Page = "dashboard" | "fixtures" | "predict" | "leaderboard" | "leagues" | "analytics" | "profile";

interface FixturesProps {
  onNavigate: (page: Page) => void;
}

type MatchState = "no-prediction" | "predicted" | "double" | "locked" | "live" | "finished";

interface Match {
  id: number;
  home: string; homeCode: string; homeFlag: string;
  away: string; awayCode: string; awayFlag: string;
  time: string; date: string; stadium: string; city: string;
  group: string; matchday: number;
  state: MatchState;
  prediction?: string;
  score?: string;
  pts?: number;
  minute?: number;
}

const MATCHES: Match[] = [
  { id: 1, home: "Argentina", homeCode: "ARG", homeFlag: "🇦🇷", away: "France", awayCode: "FRA", awayFlag: "🇫🇷", time: "18:00", date: "Jun 14", stadium: "MetLife Stadium", city: "New Jersey", group: "Group A", matchday: 1, state: "live", prediction: "2-1", score: "1-1", minute: 67 },
  { id: 2, home: "Brazil", homeCode: "BRA", homeFlag: "🇧🇷", away: "Germany", awayCode: "GER", awayFlag: "🇩🇪", time: "15:00", date: "Jun 15", stadium: "AT&T Stadium", city: "Dallas", group: "Group D", matchday: 1, state: "predicted", prediction: "1-0" },
  { id: 3, home: "Spain", homeCode: "ESP", homeFlag: "🇪🇸", away: "Japan", awayCode: "JPN", awayFlag: "🇯🇵", time: "21:00", date: "Jun 15", stadium: "SoFi Stadium", city: "Los Angeles", group: "Group B", matchday: 1, state: "double", prediction: "3-1" },
  { id: 4, home: "England", homeCode: "ENG", homeFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", away: "Portugal", awayCode: "POR", awayFlag: "🇵🇹", time: "18:00", date: "Jun 16", stadium: "Rose Bowl", city: "Los Angeles", group: "Group C", matchday: 1, state: "no-prediction" },
  { id: 5, home: "USA", homeCode: "USA", homeFlag: "🇺🇸", away: "Mexico", awayCode: "MEX", awayFlag: "🇲🇽", time: "20:00", date: "Jun 16", stadium: "Estadio Azteca", city: "Mexico City", group: "Group E", matchday: 1, state: "no-prediction" },
  { id: 6, home: "Canada", homeCode: "CAN", homeFlag: "🇨🇦", away: "Morocco", awayCode: "MAR", awayFlag: "🇲🇦", time: "18:00", date: "Jun 17", stadium: "BC Place", city: "Vancouver", group: "Group F", matchday: 1, state: "no-prediction" },
  { id: 7, home: "Netherlands", homeCode: "NED", homeFlag: "🇳🇱", away: "Senegal", awayCode: "SEN", awayFlag: "🇸🇳", time: "15:00", date: "Jun 17", stadium: "Gillette Stadium", city: "Boston", group: "Group G", matchday: 1, state: "locked" },
  { id: 8, home: "Australia", homeCode: "AUS", homeFlag: "🇦🇺", away: "Saudi Arabia", awayCode: "KSA", awayFlag: "🇸🇦", time: "15:00", date: "Jun 12", stadium: "Levi's Stadium", city: "San Francisco", group: "Group H", matchday: 1, state: "finished", score: "2-0", pts: 14 },
  { id: 9, home: "Portugal", homeCode: "POR", homeFlag: "🇵🇹", away: "Ghana", awayCode: "GHA", awayFlag: "🇬🇭", time: "21:00", date: "Jun 12", stadium: "Hard Rock Stadium", city: "Miami", group: "Group C", matchday: 1, state: "finished", score: "3-2", pts: 3 },
];

const STATE_CONFIGS: Record<MatchState, { label: string; color: string; bg: string; borderStyle: string }> = {
  "no-prediction": { label: "Predict Now →", color: "#00B2A9", bg: "rgba(0,178,169,0.1)", borderStyle: "1px dashed #2A2A4E" },
  "predicted": { label: "✓ Predicted", color: "#00B2A9", bg: "rgba(0,178,169,0.1)", borderStyle: "1px solid #00B2A9" },
  "double": { label: "⭐ Double Points", color: "#FFD700", bg: "rgba(255,215,0,0.1)", borderStyle: "2px solid #FFD700" },
  "locked": { label: "🔒 Locked", color: "#6B6B80", bg: "rgba(107,107,128,0.1)", borderStyle: "1px solid #2A2A4E" },
  "live": { label: "🔴 LIVE", color: "#E4002B", bg: "rgba(228,0,43,0.1)", borderStyle: "2px solid #E4002B" },
  "finished": { label: "Finished", color: "#6B6B80", bg: "transparent", borderStyle: "1px solid #2A2A4E" },
};

export function Fixtures({ onNavigate }: FixturesProps) {
  const [filter, setFilter] = useState<"all" | "upcoming" | "live" | "finished">("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [matches, setMatches] = useState<Match[]>(MATCHES);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<string>("");

  const loadFixtures = async (refresh = false) => {
    setLoading(true);
    try {
      const { fixtures, source } = await api.fixtures(refresh);
      // Map the API shape to the component's MatchState model.
      const mapped: Match[] = fixtures.map((m: ApiMatch) => ({
        ...m,
        state: (m.state === "upcoming" ? "no-prediction" : m.state) as MatchState,
      }));
      setMatches(mapped);
      setSource(source);
    } catch {
      // Keep the seed MATCHES already in state so the UI still renders.
      setSource("offline");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFixtures();
    // Refresh live data periodically (every 60s) for live scores.
    const interval = setInterval(() => loadFixtures(true), 60000);
    return () => clearInterval(interval);
  }, []);

  const filtered = matches.filter((m) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "live" && m.state === "live") ||
      (filter === "upcoming" && ["no-prediction", "predicted", "double"].includes(m.state)) ||
      (filter === "finished" && ["finished", "locked"].includes(m.state));
    const matchesSearch =
      !search ||
      m.homeCode.toLowerCase().includes(search.toLowerCase()) ||
      m.awayCode.toLowerCase().includes(search.toLowerCase()) ||
      m.city.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: "#0D0D1A" }}>
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-20 md:pt-24">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: "Montserrat, sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
            📅 Fixtures
          </h1>
          <p style={{ fontSize: 14, color: "#6B6B80", fontFamily: "Inter, sans-serif", marginBottom: 20 }}>
            Matchday 3 · FIFA World Cup 2026
            {source && (
              <span style={{ marginLeft: 8, fontSize: 11, color: source === "scraped" ? "#00B2A9" : "#FFA500" }}>
                · {source === "scraped" ? "🟢 live data" : source === "fallback" ? "🟡 sample data" : "⚪ offline"}
              </span>
            )}
            <button
              onClick={() => loadFixtures(true)}
              className="ml-2 inline-flex items-center gap-1 align-middle"
              style={{ color: "#00B2A9", fontSize: 11, fontFamily: "Inter, sans-serif" }}
              title="Refresh live data"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" color="#6B6B80" />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search team or city..."
              className="w-full rounded-xl pl-9 pr-4 py-3 outline-none"
              style={{ background: "#1A1A2E", border: "1px solid #2A2A4E", color: "#fff", fontSize: 14, fontFamily: "Inter, sans-serif" }}
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
            {(["all", "upcoming", "live", "finished"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-full whitespace-nowrap transition-all"
                style={{
                  background: filter === f ? "#00B2A9" : "#1A1A2E",
                  color: filter === f ? "#fff" : "#A0A0B0",
                  fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif",
                  border: "1px solid",
                  borderColor: filter === f ? "#00B2A9" : "#2A2A4E",
                  flexShrink: 0,
                }}>
                {f === "live" && "🔴 "}{f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="flex flex-col gap-3">
          {filtered.map((m, i) => {
            const cfg = STATE_CONFIGS[m.state];
            const isExpanded = expanded === m.id;

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-0.5 transition-transform"
                style={{
                  background: m.state === "double" ? "linear-gradient(135deg, #1A1A2E, #252520)" : "#1A1A2E",
                  border: cfg.borderStyle,
                  boxShadow: m.state === "live" ? "0 0 20px rgba(228,0,43,0.15)" : m.state === "double" ? "0 0 20px rgba(255,215,0,0.1)" : "none"
                }}
                onClick={() => setExpanded(isExpanded ? null : m.id)}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <span style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>
                    {m.group} · {m.date} · {m.time}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: cfg.bg, color: cfg.color, fontFamily: "Inter, sans-serif" }}>
                    {m.state === "live" ? (
                      <span className="flex items-center gap-1">
                        <motion.span animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                          className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: "#E4002B" }} />
                        LIVE {m.minute}'
                      </span>
                    ) : cfg.label}
                  </span>
                </div>

                {/* Main */}
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3 flex-1">
                    <span style={{ fontSize: 32 }}>{m.homeFlag}</span>
                    <div>
                      <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>{m.homeCode}</p>
                      <p style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>{m.home}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center px-4">
                    {(m.state === "live" || m.state === "finished") && m.score ? (
                      <span className="font-score" style={{ fontFamily: "Orbitron, monospace", fontSize: 24, fontWeight: 700, color: m.state === "live" ? "#E4002B" : "#fff" }}>
                        {m.score}
                      </span>
                    ) : m.prediction ? (
                      <div className="text-center">
                        <span className="font-score" style={{ fontFamily: "Orbitron, monospace", fontSize: 20, fontWeight: 700, color: m.state === "double" ? "#FFD700" : "#00B2A9" }}>
                          {m.prediction}
                        </span>
                        <p style={{ fontSize: 10, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>your pick</p>
                      </div>
                    ) : (
                      <span style={{ color: "#2A2A4E", fontSize: 20, fontWeight: 700 }}>vs</span>
                    )}
                    {m.state === "finished" && m.pts !== undefined && (
                      <span className="mt-1 px-2 py-0.5 rounded-full text-xs font-bold"
                        style={{ background: "rgba(0,178,169,0.2)", color: "#00B2A9", fontFamily: "Inter, sans-serif" }}>
                        🎯 +{m.pts} pts
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-1 justify-end">
                    <div className="text-right">
                      <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>{m.awayCode}</p>
                      <p style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>{m.away}</p>
                    </div>
                    <span style={{ fontSize: 32 }}>{m.awayFlag}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between px-4 pb-3">
                  <span style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>
                    📍 {m.stadium}, {m.city}
                  </span>
                  {["no-prediction", "predicted", "double"].includes(m.state) && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onNavigate("predict"); }}
                      className="px-3 py-1 rounded-lg text-xs font-semibold"
                      style={{ background: m.state === "double" ? "rgba(255,215,0,0.2)" : "rgba(0,178,169,0.2)", color: m.state === "double" ? "#FFD700" : "#00B2A9", fontFamily: "Inter, sans-serif" }}>
                      {m.state === "no-prediction" ? "Predict →" : "Edit →"}
                    </button>
                  )}
                </div>

                {/* Expanded breakdown */}
                <AnimatePresence>
                  {isExpanded && m.state === "finished" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t" style={{ borderColor: "#2A2A4E" }}>
                        <p style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif", marginTop: 12, marginBottom: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                          Points Breakdown
                        </p>
                        <div className="flex gap-4">
                          {[
                            { label: "Score", pts: 3, correct: true },
                            { label: "1st Team", pts: 5, correct: false },
                            { label: "1st Player", pts: 6, correct: false },
                          ].map((b) => (
                            <div key={b.label} className="flex items-center gap-1.5">
                              <span style={{ fontSize: 14 }}>{b.correct ? "✅" : "❌"}</span>
                              <div>
                                <p style={{ fontSize: 10, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>{b.label}</p>
                                <p style={{ fontSize: 12, fontWeight: 700, color: b.correct ? "#00B2A9" : "#6B6B80", fontFamily: "Space Mono, monospace" }}>
                                  {b.correct ? `+${b.pts}` : "0"}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
