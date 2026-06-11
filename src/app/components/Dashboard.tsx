import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Star, ChevronRight, AlertCircle } from "lucide-react";
import { api } from "../../lib/api";

type Page = "dashboard" | "fixtures" | "predict" | "leaderboard" | "leagues" | "analytics" | "profile";

interface DashboardProps {
  user: { name: string; avatar: string; email: string };
  onNavigate: (page: Page) => void;
}

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

function Countdown({ deadline }: { deadline: Date }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const update = () => {
      const diff = deadline.getTime() - Date.now();
      if (diff <= 0) return;
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTime({ d, h, m, s });
      setTick((t) => !t);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const totalHours = time.d * 24 + time.h;
  const color = totalHours < 1 ? "#FF4444" : totalHours < 6 ? "#FFA500" : "#00B2A9";

  return (
    <div className="flex gap-3 justify-center md:justify-start">
      {[{ v: time.d, l: "Days" }, { v: time.h, l: "Hrs" }, { v: time.m, l: "Min" }, { v: time.s, l: "Sec" }].map(({ v, l }) => (
        <div key={l} className="flex flex-col items-center">
          <motion.span
            key={`${l}-${v}`}
            animate={{ scale: l === "Sec" && tick ? [1, 1.08, 1] : 1 }}
            transition={{ duration: 0.1 }}
            className="font-score"
            style={{ fontSize: 32, fontWeight: 700, color, lineHeight: 1, fontFamily: "Orbitron, monospace" }}
          >
            {String(v).padStart(2, "0")}
          </motion.span>
          <span style={{ fontSize: 10, color: "#6B6B80", fontFamily: "Inter, sans-serif", fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>{l}</span>
        </div>
      ))}
    </div>
  );
}

export function Dashboard({ user, onNavigate }: DashboardProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [rank, setRank] = useState<number | null>(null);
  const [rankMovement, setRankMovement] = useState(0);
  const [miniBoard, setMiniBoard] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);

  useEffect(() => {
    api.analytics().then(setAnalytics).catch(() => {});
    api.leaderboard()
      .then(({ leaderboard }) => {
        setMiniBoard(
          leaderboard.slice(0, 5).map((e) => ({
            rank: e.rank, name: e.isUser ? "You" : e.name, pts: e.points,
            change: e.movement, isMe: e.isUser, avatar: e.name,
          }))
        );
        const me = leaderboard.find((e) => e.isUser);
        if (me) { setRank(me.rank); setRankMovement(me.movement); }
      })
      .catch(() => {});
    api.fixtures()
      .then(({ fixtures }) => {
        const next = fixtures
          .filter((m) => ["no-prediction", "predicted", "double", "upcoming"].includes(m.state))
          .slice(0, 4)
          .map((m) => ({
            id: m.id, home: m.homeFlag, homeCode: m.homeCode, away: m.awayFlag, awayCode: m.awayCode,
            time: `${m.date} • ${m.time}`, stadium: m.stadium, group: m.group,
            predicted: m.state === "predicted" || m.state === "double", score: "",
          }));
        if (next.length) setUpcoming(next);
      })
      .catch(() => {});
  }, []);

  const totalPtsTarget = analytics ? analytics.totalPoints : 0;
  const accuracy = analytics ? analytics.accuracy : 0;
  const totalPts = useCountUp(totalPtsTarget);
  const matchdayPts = useCountUp(14, 800);
  const deadline = new Date(Date.now() + 2 * 3600000 + 14 * 60000 + 37000);

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: "#0D0D1A" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-20 md:pt-24">

        {/* Welcome header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <p style={{ fontSize: 14, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>
            Matchday 3 · 2 days left
          </p>
          <h1 style={{ fontFamily: "Montserrat, sans-serif", fontSize: 26, fontWeight: 800, color: "#fff" }}>
            👋 Welcome back, {user.name.split(" ")[0]}
          </h1>
        </motion.div>

        {/* Desktop: 3-col layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

          {/* LEFT COLUMN */}
          <div className="md:col-span-4 flex flex-col gap-4">

            {/* Stats Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl p-5 relative overflow-hidden"
              style={{ background: "#1A1A2E", border: "2px solid transparent", backgroundClip: "padding-box", boxShadow: "0 0 0 2px #2A2A4E" }}
            >
              {/* Tri-nation top border */}
              <div className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: "linear-gradient(90deg, #002868, #E4002B, #006847, #00B2A9)" }} />

              <div className="flex items-start justify-between mb-4">
                <div>
                  <p style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif", fontWeight: 500, textTransform: "uppercase", letterSpacing: 1 }}>
                    🏆 Your Stats
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "rgba(0,178,169,0.2)", color: "#00B2A9", fontFamily: "Inter, sans-serif" }}>
                  MD3
                </span>
              </div>

              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="font-rank" style={{ fontSize: 48, fontWeight: 800, color: "#FFD700", fontFamily: "Space Mono, monospace", lineHeight: 1 }}>
                      #{rank ?? "—"}
                    </span>
                    {rankMovement !== 0 && (
                      <span className="flex items-center gap-0.5" style={{ color: rankMovement > 0 ? "#00B2A9" : "#FF4444", fontSize: 14, fontWeight: 600 }}>
                        {rankMovement > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}{Math.abs(rankMovement)}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>Global Rank</p>
                </div>
                <div className="text-right">
                  <p className="font-score" style={{ fontSize: 36, fontWeight: 700, color: "#fff", fontFamily: "Orbitron, monospace", lineHeight: 1 }}>
                    {totalPts}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                      style={{ background: "rgba(0,178,169,0.2)", color: "#00B2A9", fontFamily: "Inter, sans-serif" }}>
                      +{matchdayPts} pts
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>Total Points</p>
                </div>
              </div>

              {/* Accuracy bar */}
              <div>
                <div className="flex justify-between mb-1">
                  <span style={{ fontSize: 12, color: "#A0A0B0", fontFamily: "Inter, sans-serif" }}>Accuracy</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "Inter, sans-serif" }}>{accuracy}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "#252540" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${accuracy}%` }}
                    transition={{ delay: 0.5, duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #E4002B 0%, #FFA500 40%, #00B2A9 100%)" }}
                  />
                </div>
              </div>
            </motion.div>

            {/* Countdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rounded-2xl p-5" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
              <p style={{ fontSize: 11, color: "#FFA500", fontFamily: "Inter, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
                ⏰ Next Deadline
              </p>
              <Countdown deadline={deadline} />
              <p style={{ fontSize: 12, color: "#6B6B80", fontFamily: "Inter, sans-serif", marginTop: 10, textAlign: "center" }}>
                until predictions lock · Argentina vs France
              </p>
            </motion.div>

            {/* Double Points */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="rounded-2xl p-5" style={{ background: "#1A1A2E", border: "1px solid #E4002B" }}>
              <p style={{ fontSize: 11, color: "#FFD700", fontFamily: "Inter, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
                ⭐ Double Points
              </p>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={16} color="#FFA500" />
                <p style={{ fontSize: 14, color: "#FFA500", fontFamily: "Inter, sans-serif" }}>Not selected yet!</p>
              </div>
              <button
                onClick={() => onNavigate("predict")}
                className="w-full rounded-xl py-2.5 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                style={{ background: "linear-gradient(90deg, #FFD700, #FFA500)", color: "#0D0D1A", fontWeight: 700, fontSize: 14, fontFamily: "Inter, sans-serif" }}
              >
                Choose Your Match <ChevronRight size={16} />
              </button>
            </motion.div>
          </div>

          {/* CENTER COLUMN — Upcoming matches */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="flex items-center justify-between mb-3">
                <h2 style={{ fontFamily: "Montserrat, sans-serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>
                  ⚽ Upcoming — Predict Now
                </h2>
                <button onClick={() => onNavigate("fixtures")}
                  style={{ fontSize: 13, color: "#00B2A9", fontFamily: "Inter, sans-serif" }}>
                  View all →
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {upcoming.length === 0 && (
                  <p style={{ fontSize: 13, color: "#6B6B80", fontFamily: "Inter, sans-serif", padding: "8px 0" }}>
                    No upcoming matches to predict right now.
                  </p>
                )}
                {upcoming.map((m, i) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.25 + i * 0.08 }}
                    onClick={() => onNavigate("predict")}
                    className="rounded-xl p-4 cursor-pointer hover:-translate-y-0.5 transition-transform"
                    style={{
                      background: "#1A1A2E",
                      border: m.predicted ? "1px solid #00B2A9" : "1px dashed #2A2A4E",
                      boxShadow: m.predicted ? "0 0 20px rgba(0,178,169,0.1)" : "none"
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>{m.group} · {m.time}</span>
                      {m.predicted ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: "rgba(0,178,169,0.2)", color: "#00B2A9", fontFamily: "Inter, sans-serif" }}>
                          ✓ Predicted
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: "#E4002B", fontFamily: "Inter, sans-serif", fontWeight: 600 }}>Predict Now →</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <span style={{ fontSize: 24 }}>{m.home}</span>
                        <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: 14, fontWeight: 700, color: "#fff" }}>{m.homeCode}</span>
                      </div>
                      {m.predicted ? (
                        <span className="font-score" style={{ fontFamily: "Orbitron, monospace", fontSize: 18, fontWeight: 700, color: "#00B2A9", padding: "0 12px" }}>
                          {m.score}
                        </span>
                      ) : (
                        <span style={{ color: "#2A2A4E", fontSize: 18, padding: "0 12px", fontWeight: 700 }}>vs</span>
                      )}
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: 14, fontWeight: 700, color: "#fff" }}>{m.awayCode}</span>
                        <span style={{ fontSize: 24 }}>{m.away}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif", marginTop: 6 }}>
                      📍 {m.stadium}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="md:col-span-3 flex flex-col gap-4">

            {/* Mini Leaderboard */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="rounded-2xl p-4" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}
            >
              <div className="flex items-center justify-between mb-4">
                <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Montserrat, sans-serif" }}>
                  📊 Leaderboard
                </p>
                <button onClick={() => onNavigate("leaderboard")}
                  style={{ fontSize: 11, color: "#00B2A9", fontFamily: "Inter, sans-serif" }}>See all</button>
              </div>
              <div className="flex flex-col gap-1">
                {miniBoard.length === 0 && (
                  <p style={{ fontSize: 12, color: "#6B6B80", fontFamily: "Inter, sans-serif", padding: "4px 0" }}>
                    No rankings yet.
                  </p>
                )}
                {miniBoard.map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center gap-2 rounded-lg px-2 py-2"
                    style={{
                      background: entry.isMe ? "rgba(0,178,169,0.1)" : "transparent",
                      border: entry.isMe ? "1px solid rgba(0,178,169,0.3)" : "1px solid transparent"
                    }}
                  >
                    <span style={{
                      fontFamily: "Space Mono, monospace",
                      fontSize: 14,
                      fontWeight: 700,
                      color: entry.rank === 1 ? "#FFD700" : entry.rank === 2 ? "#C0C0C0" : entry.rank === 3 ? "#CD7F32" : "#6B6B80",
                      minWidth: 20
                    }}>
                      {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                    </span>
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.avatar}`}
                      className="w-6 h-6 rounded-full" alt={entry.name} />
                    <span style={{ fontSize: 13, fontWeight: entry.isMe ? 700 : 400, color: entry.isMe ? "#00B2A9" : "#fff", flex: 1, fontFamily: "Inter, sans-serif" }}>
                      {entry.name}
                      {entry.isMe && " ★"}
                    </span>
                    <div className="flex flex-col items-end">
                      <span className="font-rank" style={{ fontFamily: "Space Mono, monospace", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                        {entry.pts}
                      </span>
                      <span style={{
                        fontSize: 10,
                        color: entry.change > 0 ? "#00B2A9" : entry.change < 0 ? "#FF4444" : "#6B6B80",
                        fontFamily: "Inter, sans-serif"
                      }}>
                        {entry.change > 0 ? `↑${entry.change}` : entry.change < 0 ? `↓${Math.abs(entry.change)}` : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
