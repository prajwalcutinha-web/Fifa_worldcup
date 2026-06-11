import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus as MinusIcon } from "lucide-react";
import { api } from "../../lib/api";

type LeaderboardTab = "overall" | "matchday" | "weekly";

const LEADERBOARD_DATA = [
  { rank: 1, name: "John Davidson", pts: 142, change: 2, score: 12, team: 18, player: 9, double: 3, accuracy: 75, avatar: "John" },
  { rank: 2, name: "Sarah Mitchell", pts: 138, change: -1, score: 10, team: 17, player: 8, double: 2, accuracy: 72, avatar: "Sarah" },
  { rank: 3, name: "Alex Kumar", pts: 135, change: 5, score: 11, team: 16, player: 7, double: 3, accuracy: 71, avatar: "Alex" },
  { rank: 4, name: "You", pts: 131, change: 1, score: 9, team: 15, player: 9, double: 2, accuracy: 67, avatar: "Me", isMe: true },
  { rank: 5, name: "Mike Rodriguez", pts: 128, change: -3, score: 10, team: 14, player: 6, double: 2, accuracy: 65, avatar: "Mike" },
  { rank: 6, name: "Lisa Thompson", pts: 125, change: 0, score: 8, team: 14, player: 7, double: 1, accuracy: 64, avatar: "Lisa" },
  { rank: 7, name: "James Park", pts: 122, change: 4, score: 9, team: 13, player: 5, double: 2, accuracy: 62, avatar: "James" },
  { rank: 8, name: "Emma Chen", pts: 118, change: -2, score: 8, team: 12, player: 6, double: 1, accuracy: 60, avatar: "Emma" },
  { rank: 9, name: "Carlos Rivera", pts: 114, change: 1, score: 7, team: 12, player: 5, double: 2, accuracy: 58, avatar: "Carlos" },
  { rank: 10, name: "Priya Sharma", pts: 110, change: -1, score: 7, team: 11, player: 4, double: 1, accuracy: 56, avatar: "Priya" },
];

const MATCHDAY_DATA = LEADERBOARD_DATA.map((e) => ({ ...e, pts: Math.floor(e.pts / 5 + Math.random() * 5) }))
  .sort((a, b) => b.pts - a.pts).map((e, i) => ({ ...e, rank: i + 1 }));

type EntryType = typeof LEADERBOARD_DATA[0] & { isMe?: boolean };

function PodiumCard({ entry, pos }: { entry: EntryType; pos: 1 | 2 | 3 }) {
  const heights = { 1: 100, 2: 80, 3: 64 };
  const colors = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
  const medals = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: pos * 0.1, type: "spring", damping: 15 }}
      className="flex flex-col items-center"
      style={{ order: pos === 1 ? 2 : pos === 2 ? 1 : 3 }}
    >
      <div className="text-xl mb-1">{medals[pos]}</div>
      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.avatar}`}
        className="w-12 h-12 rounded-full mb-1" style={{ border: `2px solid ${colors[pos]}` }} alt={entry.name} />
      <p style={{ fontSize: 12, fontWeight: 700, color: "#fff", fontFamily: "Inter, sans-serif", textAlign: "center" }}>
        {entry.name.split(" ")[0]}
      </p>
      <p className="font-rank" style={{ fontFamily: "Space Mono, monospace", fontSize: 13, fontWeight: 700, color: colors[pos] }}>
        {entry.pts}
      </p>
      <div className="rounded-t-xl mt-2 w-20 flex items-end justify-center"
        style={{ height: heights[pos], background: `${colors[pos]}20`, border: `1px solid ${colors[pos]}40` }}>
        <span style={{ fontSize: 24, marginBottom: 8 }}>{pos}</span>
      </div>
    </motion.div>
  );
}

export function Leaderboard() {
  const [tab, setTab] = useState<LeaderboardTab>("overall");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [overall, setOverall] = useState<EntryType[]>(LEADERBOARD_DATA);

  useEffect(() => {
    api
      .leaderboard()
      .then(({ leaderboard }) => {
        if (!leaderboard?.length) return;
        const mapped: EntryType[] = leaderboard.map((e) => ({
          rank: e.rank,
          name: e.isUser ? e.name : e.name,
          pts: e.points,
          change: e.movement,
          // Per-category breakdown isn't part of the ranking payload; the
          // user's own detailed stats live on the Analytics endpoint.
          score: 0, team: 0, player: 0, double: 0, accuracy: 0,
          avatar: e.name,
          isMe: e.isUser,
        }));
        setOverall(mapped);
      })
      .catch(() => {
        /* keep seed data */
      });
  }, []);

  const matchdayData = overall
    .map((e) => ({ ...e, pts: Math.floor(e.pts / 5) }))
    .sort((a, b) => b.pts - a.pts)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const data = tab === "matchday" ? matchdayData : overall;

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: "#0D0D1A" }}>
      <div className="max-w-2xl mx-auto px-4 md:px-8 pt-20 md:pt-24">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: "Montserrat, sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
            🏆 Leaderboard
          </h1>
          <p style={{ fontSize: 14, color: "#6B6B80", fontFamily: "Inter, sans-serif", marginBottom: 20 }}>
            Global · Matchday 3 standings
          </p>

          {/* Tabs */}
          <div className="relative flex gap-1 p-1 rounded-xl mb-6" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
            {(["overall", "matchday", "weekly"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className="relative flex-1 py-2 rounded-lg transition-all z-10"
                style={{
                  background: tab === t ? "#00B2A9" : "transparent",
                  color: tab === t ? "#fff" : "#6B6B80",
                  fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif"
                }}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Podium */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 mb-6" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
          <p style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, textAlign: "center", marginBottom: 20 }}>
            Top 3
          </p>
          <div className="flex justify-center items-end gap-4">
            {([2, 1, 3] as const).map((pos) => (
              <PodiumCard key={pos} entry={data[pos - 1] as EntryType} pos={pos} />
            ))}
          </div>
        </motion.div>

        {/* Full table */}
        <div className="flex flex-col gap-1">
          {data.map((entry, i) => {
            const isExpanded = expanded === entry.rank;
            const isMe = (entry as EntryType).isMe;

            return (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div
                  onClick={() => setExpanded(isExpanded ? null : entry.rank)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-white/3 transition-colors"
                  style={{
                    background: isMe ? "rgba(0,178,169,0.08)" : "transparent",
                    border: isMe ? "1px solid rgba(0,178,169,0.25)" : "1px solid transparent",
                    borderBottom: "1px solid #1A1A2E",
                  }}
                >
                  <span style={{
                    fontFamily: "Space Mono, monospace", fontSize: 15, fontWeight: 700,
                    color: entry.rank === 1 ? "#FFD700" : entry.rank === 2 ? "#C0C0C0" : entry.rank === 3 ? "#CD7F32" : "#6B6B80",
                    minWidth: 28, textAlign: "center"
                  }}>
                    {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                  </span>

                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${entry.avatar}`}
                    className="w-8 h-8 rounded-full flex-shrink-0" style={{ border: isMe ? "2px solid #00B2A9" : "2px solid #2A2A4E" }} alt={entry.name} />

                  <div className="flex-1 min-w-0">
                    <p style={{ fontSize: 14, fontWeight: isMe ? 700 : 500, color: isMe ? "#00B2A9" : "#fff", fontFamily: "Inter, sans-serif" }}>
                      {isMe ? "★ " : ""}{entry.name}
                    </p>
                    <p style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>
                      {entry.accuracy}% accuracy
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-rank" style={{ fontFamily: "Space Mono, monospace", fontSize: 16, fontWeight: 700, color: "#fff" }}>
                      {entry.pts}
                    </span>
                    <div className="flex items-center gap-0.5 min-w-12 justify-end">
                      {entry.change > 0 ? (
                        <span style={{ color: "#00B2A9", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>
                          ↑{entry.change}
                        </span>
                      ) : entry.change < 0 ? (
                        <span style={{ color: "#FF4444", fontSize: 12, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>
                          ↓{Math.abs(entry.change)}
                        </span>
                      ) : (
                        <span style={{ color: "#6B6B80", fontSize: 12, fontFamily: "Inter, sans-serif" }}>—</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-14 py-3 rounded-b-xl mb-1" style={{ background: "#1A1A2E" }}>
                      <div className="grid grid-cols-4 gap-3 mb-2">
                        {[
                          { label: "Correct Scores", val: entry.score },
                          { label: "1st Team", val: entry.team },
                          { label: "1st Player", val: entry.player },
                          { label: "Double Pts", val: `${entry.double}/3` },
                        ].map((s) => (
                          <div key={s.label} className="text-center">
                            <p className="font-rank" style={{ fontFamily: "Space Mono, monospace", fontSize: 18, fontWeight: 700, color: "#00B2A9" }}>{s.val}</p>
                            <p style={{ fontSize: 10, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: "#252540" }}>
                        <div className="h-full rounded-full" style={{ width: `${entry.accuracy}%`, background: "linear-gradient(90deg, #E4002B, #FFA500, #00B2A9)" }} />
                      </div>
                      <p style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif", marginTop: 4, textAlign: "right" }}>
                        {entry.accuracy}% prediction accuracy
                      </p>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
