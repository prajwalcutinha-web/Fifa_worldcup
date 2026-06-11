import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { ChevronLeft, Minus, Plus, Search, Check, Loader2 } from "lucide-react";
import { api, type Match } from "../../lib/api";

type Page = "dashboard" | "fixtures" | "predict" | "leaderboard" | "leagues" | "analytics" | "profile";

interface PredictPageProps {
  onNavigate: (page: Page) => void;
}

const PLAYERS = [
  { name: "Lionel Messi", team: "ARG", pos: "FW", pct: 32, flag: "🇦🇷" },
  { name: "Kylian Mbappé", team: "FRA", pos: "FW", pct: 28, flag: "🇫🇷" },
  { name: "Antoine Griezmann", team: "FRA", pos: "FW", pct: 12, flag: "🇫🇷" },
  { name: "Ángel Di María", team: "ARG", pos: "MF", pct: 8, flag: "🇦🇷" },
  { name: "Olivier Giroud", team: "FRA", pos: "FW", pct: 6, flag: "🇫🇷" },
  { name: "Lautaro Martínez", team: "ARG", pos: "FW", pct: 5, flag: "🇦🇷" },
  { name: "Julián Álvarez", team: "ARG", pos: "FW", pct: 4, flag: "🇦🇷" },
];

type SubmitState = "idle" | "loading" | "success";

export function PredictPage({ onNavigate }: PredictPageProps) {
  const [homeScore, setHomeScore] = useState(2);
  const [awayScore, setAwayScore] = useState(1);
  const [firstTeam, setFirstTeam] = useState<"home" | "away" | "none" | null>(null);
  const [playerSearch, setPlayerSearch] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [doublePoints, setDoublePoints] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [match, setMatch] = useState<Match | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load fixtures and pick the first match the user can still predict.
  useEffect(() => {
    api.fixtures()
      .then(({ fixtures }) => {
        const predictable = fixtures.find((m) =>
          ["no-prediction", "predicted", "double", "upcoming"].includes(m.state)
        );
        if (predictable) setMatch(predictable);
      })
      .catch(() => {});
  }, []);

  // Display helpers (fall back to Argentina/France visuals before load).
  const homeName = match?.home ?? "Argentina";
  const awayName = match?.away ?? "France";
  const homeFlag = match?.homeFlag ?? "🇦🇷";
  const awayFlag = match?.awayFlag ?? "🇫🇷";
  const homeCode = match?.homeCode ?? "ARG";
  const awayCode = match?.awayCode ?? "FRA";

  const basePts = 14;
  const totalPts = doublePoints ? basePts * 2 : basePts;

  const filteredPlayers = PLAYERS.filter(
    (p) => !playerSearch || p.name.toLowerCase().includes(playerSearch.toLowerCase()) || p.team.toLowerCase().includes(playerSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!firstTeam || !selectedPlayer) return;
    setError(null);
    setSubmitState("loading");
    try {
      await api.submitPrediction({
        matchId: match?.id ?? 1,
        homeScore,
        awayScore,
        firstTeam,
        firstPlayer: selectedPlayer,
        double: doublePoints,
      });
      setSubmitState("success");
      setTimeout(() => onNavigate("fixtures"), 1500);
    } catch (err: any) {
      setError(err?.message ?? "Could not submit prediction");
      setSubmitState("idle");
    }
  };

  const ScoreButton = ({ dir, onClick }: { dir: "up" | "down"; onClick: () => void }) => (
    <button onClick={onClick}
      className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-90"
      style={{ background: "#252540", border: "1px solid #2A2A4E" }}>
      {dir === "up" ? <Plus size={18} color="#00B2A9" /> : <Minus size={18} color="#A0A0B0" />}
    </button>
  );

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: "#0D0D1A" }}>
      <div className="max-w-lg mx-auto px-4 md:px-8 pt-20 md:pt-24">

        {/* Back + Title */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 mb-6">
          <button onClick={() => onNavigate("fixtures")}
            className="p-2 rounded-xl hover:bg-white/5 transition-colors"
            style={{ border: "1px solid #2A2A4E" }}>
            <ChevronLeft size={20} color="#A0A0B0" />
          </button>
          <div>
            <h1 style={{ fontFamily: "Montserrat, sans-serif", fontSize: 20, fontWeight: 800, color: "#fff" }}>
              Predict Match
            </h1>
            <p style={{ fontSize: 13, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>
              {homeName} vs {awayName}{match ? ` · ${match.date} · ${match.time}` : ""}
            </p>
          </div>
        </motion.div>

        {/* Match header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-2xl p-5 mb-4 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1B0A3E, #002868)", border: "1px solid #2A2A4E" }}>
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: "linear-gradient(90deg, #002868, #E4002B, #006847, #00B2A9)" }} />
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-2">
              <span style={{ fontSize: 48 }}>{homeFlag}</span>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: 16, fontWeight: 800, color: "#fff" }}>{homeName}</span>
            </div>
            <div className="text-center">
              <span style={{ fontSize: 12, color: "#6B6B80", fontFamily: "Inter, sans-serif", display: "block" }}>{match?.group ?? "Group A"} · MD{match?.matchday ?? 1}</span>
              <span style={{ fontSize: 12, color: "#FFA500", fontFamily: "Inter, sans-serif", fontWeight: 600 }}>{match?.stadium ?? ""}</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <span style={{ fontSize: 48 }}>{awayFlag}</span>
              <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: 16, fontWeight: 800, color: "#fff" }}>{awayName}</span>
            </div>
          </div>
        </motion.div>

        {/* Score Picker */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-5 mb-4" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
          <p style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 20 }}>
            Final Score
          </p>
          <div className="flex items-center justify-center gap-6">
            {/* Home */}
            <div className="flex flex-col items-center gap-3">
              <span style={{ fontSize: 24 }}>{homeFlag}</span>
              <div className="flex items-center gap-3">
                <ScoreButton dir="down" onClick={() => setHomeScore(Math.max(0, homeScore - 1))} />
                <motion.span
                  key={homeScore}
                  initial={{ rotateX: -90, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="font-score"
                  style={{ fontFamily: "Orbitron, monospace", fontSize: 40, fontWeight: 700, color: "#fff", minWidth: 48, textAlign: "center" }}
                >
                  {homeScore}
                </motion.span>
                <ScoreButton dir="up" onClick={() => setHomeScore(homeScore + 1)} />
              </div>
              <span style={{ fontSize: 12, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>{homeCode}</span>
            </div>
            <span style={{ fontSize: 24, color: "#2A2A4E", fontWeight: 700 }}>—</span>
            {/* Away */}
            <div className="flex flex-col items-center gap-3">
              <span style={{ fontSize: 24 }}>{awayFlag}</span>
              <div className="flex items-center gap-3">
                <ScoreButton dir="down" onClick={() => setAwayScore(Math.max(0, awayScore - 1))} />
                <motion.span
                  key={awayScore}
                  initial={{ rotateX: -90, opacity: 0 }}
                  animate={{ rotateX: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="font-score"
                  style={{ fontFamily: "Orbitron, monospace", fontSize: 40, fontWeight: 700, color: "#fff", minWidth: 48, textAlign: "center" }}
                >
                  {awayScore}
                </motion.span>
                <ScoreButton dir="up" onClick={() => setAwayScore(awayScore + 1)} />
              </div>
              <span style={{ fontSize: 12, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>{awayCode}</span>
            </div>
          </div>
        </motion.div>

        {/* First Team to Score */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl p-5 mb-4" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
          <p style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
            First Team to Score
          </p>
          <div className="flex gap-3">
            {([
              { key: "home" as const, label: `${homeFlag} ${homeName}` },
              { key: "away" as const, label: `${awayFlag} ${awayName}` },
              { key: "none" as const, label: "No Goal" },
            ]).map(({ key, label }) => (
              <button key={key} onClick={() => setFirstTeam(key)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: firstTeam === key ? "rgba(0,178,169,0.2)" : "#252540",
                  border: firstTeam === key ? "2px solid #00B2A9" : "1px solid #2A2A4E",
                  color: firstTeam === key ? "#00B2A9" : "#A0A0B0",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                }}>
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* First Player to Score */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl p-5 mb-4" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
          <p style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
            First Player to Score
          </p>
          <div className="relative mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="#6B6B80" />
            <input
              value={playerSearch}
              onChange={(e) => setPlayerSearch(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              placeholder="Search player name..."
              className="w-full rounded-xl pl-9 pr-4 py-2.5 outline-none"
              style={{ background: "#252540", border: "1px solid #2A2A4E", color: "#fff", fontSize: 14, fontFamily: "Inter, sans-serif" }}
            />
          </div>
          <AnimatePresence>
            {searchOpen && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                className="rounded-xl overflow-hidden mb-4" style={{ border: "1px solid #2A2A4E", background: "#252540" }}>
                {filteredPlayers.map((p) => (
                  <button key={p.name} onMouseDown={() => { setSelectedPlayer(p.name); setPlayerSearch(p.name); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left">
                    <span style={{ fontSize: 18 }}>{p.flag}</span>
                    <div className="flex-1">
                      <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", fontFamily: "Inter, sans-serif" }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>{p.team} · {p.pos}</p>
                    </div>
                    <div className="text-right">
                      <p style={{ fontSize: 11, color: "#A0A0B0", fontFamily: "Inter, sans-serif" }}>{p.pct}% pick</p>
                      <div className="h-1 w-16 rounded-full mt-1" style={{ background: "#2A2A4E" }}>
                        <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: "#00B2A9" }} />
                      </div>
                    </div>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <div>
            <p style={{ fontSize: 12, color: "#6B6B80", fontFamily: "Inter, sans-serif", marginBottom: 8 }}>Popular picks:</p>
            <div className="flex flex-wrap gap-2">
              {PLAYERS.slice(0, 4).map((p) => (
                <button key={p.name}
                  onClick={() => { setSelectedPlayer(p.name); setPlayerSearch(p.name); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: selectedPlayer === p.name ? "rgba(0,178,169,0.2)" : "#252540",
                    border: selectedPlayer === p.name ? "1px solid #00B2A9" : "1px solid #2A2A4E",
                    color: selectedPlayer === p.name ? "#00B2A9" : "#A0A0B0",
                    fontFamily: "Inter, sans-serif",
                  }}>
                  {p.flag} {p.name.split(" ").pop()} <span style={{ color: "#6B6B80" }}>({p.pct}%)</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Double Points */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="rounded-2xl p-5 mb-4"
          style={{ background: doublePoints ? "rgba(255,215,0,0.08)" : "#1A1A2E", border: doublePoints ? "2px solid #FFD700" : "1px solid #2A2A4E" }}>
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: doublePoints ? "#FFD700" : "#fff", fontFamily: "Montserrat, sans-serif" }}>
                ⭐ Double Points Match
              </p>
              <p style={{ fontSize: 12, color: "#6B6B80", fontFamily: "Inter, sans-serif", marginTop: 2 }}>
                All points from this match ×2
              </p>
            </div>
            <button
              onClick={() => setDoublePoints(!doublePoints)}
              className="relative w-12 h-6 rounded-full transition-all"
              style={{ background: doublePoints ? "#FFD700" : "#252540", border: "none" }}
            >
              <motion.div
                animate={{ x: doublePoints ? 24 : 2 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="absolute top-1 w-4 h-4 rounded-full"
                style={{ background: doublePoints ? "#0D0D1A" : "#6B6B80" }}
              />
              {doublePoints && (
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 0.6 }}
                  className="absolute -top-1 -right-1 text-sm"
                >⭐</motion.span>
              )}
            </button>
          </div>
        </motion.div>

        {/* Points potential */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="rounded-2xl p-5 mb-4"
          style={{ background: "linear-gradient(135deg, #252540, #1A1A2E)", border: "1px solid #2A2A4E" }}>
          <p style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
            Points Potential
          </p>
          <div className="flex items-center justify-between mb-3">
            {[
              { label: "Score", pts: 3 },
              { label: "1st Team", pts: 5 },
              { label: "1st Player", pts: 6 },
            ].map((c, i) => (
              <div key={c.label} className="flex items-center gap-2">
                {i > 0 && <span style={{ color: "#2A2A4E" }}>+</span>}
                <div className="text-center">
                  <p className="font-score" style={{ fontFamily: "Orbitron, monospace", fontSize: 20, fontWeight: 700, color: "#00B2A9" }}>{c.pts}</p>
                  <p style={{ fontSize: 10, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>{c.label}</p>
                </div>
              </div>
            ))}
            <span style={{ color: "#2A2A4E", fontSize: 18, fontWeight: 700 }}>=</span>
            <div className="text-center">
              <motion.p
                key={totalPts}
                animate={{ scale: [1.2, 1] }}
                className="font-score"
                style={{ fontFamily: "Orbitron, monospace", fontSize: 28, fontWeight: 700, color: doublePoints ? "#FFD700" : "#fff" }}
              >
                {totalPts}
              </motion.p>
              <p style={{ fontSize: 10, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>pts{doublePoints ? " ×2" : ""}</p>
            </div>
          </div>
          {doublePoints && (
            <p style={{ fontSize: 12, color: "#FFD700", fontFamily: "Inter, sans-serif", textAlign: "center" }}>
              ⭐ Double Points active — max {totalPts} pts!
            </p>
          )}
        </motion.div>

        {/* Submit */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <button
            onClick={handleSubmit}
            disabled={!firstTeam || !selectedPlayer || submitState !== "idle"}
            className="w-full rounded-2xl py-4 flex items-center justify-center gap-3 transition-all hover:opacity-90 active:scale-98 mb-3"
            style={{
              background: !firstTeam || !selectedPlayer ? "#252540" : "#00B2A9",
              color: !firstTeam || !selectedPlayer ? "#6B6B80" : "#fff",
              fontWeight: 700, fontSize: 16, fontFamily: "Inter, sans-serif",
              cursor: !firstTeam || !selectedPlayer ? "not-allowed" : "pointer",
            }}
          >
            {submitState === "idle" && "✓ Submit Prediction"}
            {submitState === "loading" && <><Loader2 size={20} className="animate-spin" /> Submitting...</>}
            {submitState === "success" && <><Check size={20} /> Prediction Saved! 🎉</>}
          </button>
          <p style={{ fontSize: 12, color: "#FFA500", fontFamily: "Inter, sans-serif", textAlign: "center" }}>
            ⏰ Locks in 2h 14m
          </p>
          {error && (
            <p style={{ fontSize: 13, color: "#FF4444", fontFamily: "Inter, sans-serif", textAlign: "center", marginTop: 8 }}>
              {error}
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
