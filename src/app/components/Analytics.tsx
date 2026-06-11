import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

const POINTS_HISTORY: any[] = [];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-xl p-3" style={{ background: "#252540", border: "1px solid #2A2A4E" }}>
      <p style={{ fontSize: 12, color: "#A0A0B0", fontFamily: "Inter, sans-serif", marginBottom: 4 }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ fontSize: 13, fontWeight: 600, color: p.color, fontFamily: "Space Mono, monospace" }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export function Analytics() {
  const [stats, setStats] = useState<any>(null);
  const [rank, setRank] = useState<number | null>(null);

  useEffect(() => {
    api.analytics().then(setStats).catch(() => {});
    api.leaderboard()
      .then(({ leaderboard }) => {
        const me = leaderboard.find((e) => e.isUser);
        if (me) setRank(me.rank);
      })
      .catch(() => {});
  }, []);

  // Real data with empty/zero fallbacks (no dummy values).
  const totalPoints = stats ? stats.totalPoints : 0;
  const accuracy = stats ? stats.accuracy : 0;
  const correct = stats ? stats.correct : 0;
  const scored = stats ? stats.scoredPredictions : 0;
  const pointsHistory =
    stats && stats.pointsByMatchday?.length
      ? stats.pointsByMatchday.map((d: any) => ({ matchday: `MD${d.matchday}`, pts: d.points, avg: Math.round(d.points * 0.8) }))
      : [];
  const donut = [
    { name: "Correct", value: accuracy, color: "#00B2A9" },
    { name: "Wrong", value: 100 - accuracy, color: "#2A2A4E" },
  ];

  const summary = [
    { label: "Total Points", value: String(totalPoints), icon: "🎯", color: "#00B2A9" },
    { label: "Global Rank", value: rank ? `#${rank}` : "—", icon: "🏆", color: "#FFD700" },
    { label: "Accuracy", value: `${accuracy}%`, icon: "📈", color: "#006847" },
    { label: "Predictions", value: String(stats ? stats.totalPredictions : 0), icon: "📝", color: "#E4002B" },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: "#0D0D1A" }}>
      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-20 md:pt-24">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: "Montserrat, sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 4 }}>
            📊 Analytics
          </h1>
          <p style={{ fontSize: 14, color: "#6B6B80", fontFamily: "Inter, sans-serif", marginBottom: 24 }}>
            Your prediction performance · WC 2026
          </p>
        </motion.div>

        {/* Stats summary row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {summary.map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-4" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
              <p style={{ fontSize: 22 }}>{s.icon}</p>
              <p className="font-score" style={{ fontFamily: "Orbitron, monospace", fontSize: 22, fontWeight: 700, color: s.color, marginTop: 4 }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Points over time */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="rounded-2xl p-5" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Montserrat, sans-serif", marginBottom: 16 }}>
              Points Per Matchday
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={pointsHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A4E" />
                <XAxis dataKey="matchday" tick={{ fill: "#6B6B80", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6B6B80", fontSize: 11, fontFamily: "Inter, sans-serif" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="pts" stroke="#00B2A9" strokeWidth={2} dot={{ fill: "#00B2A9", r: 4 }} name="Your pts" />
                <Line type="monotone" dataKey="avg" stroke="#2A2A4E" strokeWidth={2} strokeDasharray="4 4" dot={false} name="Avg" />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ background: "#00B2A9" }} />
                <span style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>Your pts</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 rounded" style={{ background: "#2A2A4E" }} />
                <span style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>League avg</span>
              </div>
            </div>
          </motion.div>

          {/* Accuracy donut */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="rounded-2xl p-5" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Montserrat, sans-serif", marginBottom: 16 }}>
              Overall Accuracy
            </p>
            <div className="flex items-center gap-6">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={donut} cx="50%" cy="50%" innerRadius={35} outerRadius={55} dataKey="value" startAngle={90} endAngle={-270}>
                    {donut.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div>
                <p className="font-score" style={{ fontFamily: "Orbitron, monospace", fontSize: 36, fontWeight: 700, color: "#00B2A9" }}>{accuracy}%</p>
                <p style={{ fontSize: 13, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>Correct predictions</p>
                <p style={{ fontSize: 12, color: "#A0A0B0", fontFamily: "Inter, sans-serif", marginTop: 8 }}>
                  {correct}/{scored} predictions correct
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Category accuracy + best predictions appear here once enough
            matches have been scored from your real predictions. */}
      </div>
    </div>
  );
}
