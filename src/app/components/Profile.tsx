import { motion } from "motion/react";
import { LogOut, Trophy, Target, Star, TrendingUp } from "lucide-react";

type Page = "dashboard" | "fixtures" | "predict" | "leaderboard" | "leagues" | "analytics" | "profile";

interface ProfileProps {
  user: { name: string; avatar: string; email: string };
  onSignOut: () => void;
  onNavigate: (page: Page) => void;
}

const ACHIEVEMENTS = [
  { icon: "🎯", title: "Perfect Matchday", desc: "All predictions correct in a single matchday", earned: true },
  { icon: "🔥", title: "Hot Streak", desc: "3+ correct predictions in a row", earned: true },
  { icon: "⭐", title: "Double Winner", desc: "Won double points 3 times", earned: false },
  { icon: "🏆", title: "League Champion", desc: "Finish #1 in any league", earned: false },
  { icon: "🌍", title: "World Predictor", desc: "Predict all 48 group stage matches", earned: false },
  { icon: "💯", title: "Perfect Score", desc: "Predict exact score 10 times", earned: true },
];

export function Profile({ user, onSignOut, onNavigate }: ProfileProps) {
  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: "#0D0D1A" }}>
      <div className="max-w-2xl mx-auto px-4 md:px-8 pt-20 md:pt-24">

        {/* Profile header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-6 mb-6 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, #1B0A3E, #002868)", border: "1px solid #2A2A4E" }}>
          <div className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: "linear-gradient(90deg, #002868, #E4002B, #006847, #00B2A9)" }} />
          <div className="flex items-center gap-4">
            <div className="relative">
              <img src={user.avatar} alt={user.name}
                className="w-20 h-20 rounded-full object-cover"
                style={{ border: "3px solid #00B2A9", boxShadow: "0 0 20px rgba(0,178,169,0.4)" }} />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "#FFD700", border: "2px solid #0D0D1A" }}>
                <span style={{ fontSize: 12 }}>⭐</span>
              </div>
            </div>
            <div className="flex-1">
              <h1 style={{ fontFamily: "Montserrat, sans-serif", fontSize: 22, fontWeight: 800, color: "#fff" }}>{user.name}</h1>
              <p style={{ fontSize: 13, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>{user.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "rgba(255,215,0,0.2)", color: "#FFD700", fontFamily: "Inter, sans-serif" }}>
                  🏆 Global #47
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                  style={{ background: "rgba(0,178,169,0.2)", color: "#00B2A9", fontFamily: "Inter, sans-serif" }}>
                  131 pts
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Predictions", value: "51", icon: "🎯" },
            { label: "Correct", value: "34", icon: "✅" },
            { label: "Leagues", value: "3", icon: "👥" },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="rounded-2xl p-4 text-center" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
              <p style={{ fontSize: 24 }}>{s.icon}</p>
              <p className="font-score" style={{ fontFamily: "Orbitron, monospace", fontSize: 22, fontWeight: 700, color: "#fff" }}>{s.value}</p>
              <p style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Quick nav */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="rounded-2xl overflow-hidden mb-6" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
          {[
            { icon: <Target size={18} />, label: "My Predictions", page: "fixtures" as Page, color: "#00B2A9" },
            { icon: <Trophy size={18} />, label: "Leaderboard", page: "leaderboard" as Page, color: "#FFD700" },
            { icon: <TrendingUp size={18} />, label: "Analytics", page: "analytics" as Page, color: "#002868" },
          ].map((item, i) => (
            <button key={i} onClick={() => onNavigate(item.page)}
              className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors border-b last:border-b-0"
              style={{ borderColor: "#2A2A4E" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: `${item.color}20`, color: item.color }}>
                {item.icon}
              </div>
              <span style={{ fontSize: 15, fontWeight: 500, color: "#fff", fontFamily: "Inter, sans-serif", flex: 1, textAlign: "left" }}>
                {item.label}
              </span>
              <span style={{ color: "#6B6B80" }}>›</span>
            </button>
          ))}
        </motion.div>

        {/* Achievements */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl p-5 mb-6" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Montserrat, sans-serif", marginBottom: 16 }}>
            🏅 Achievements
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {ACHIEVEMENTS.map((a, i) => (
              <div key={i} className="rounded-xl p-3 text-center"
                style={{
                  background: a.earned ? "rgba(0,178,169,0.1)" : "#252540",
                  border: a.earned ? "1px solid rgba(0,178,169,0.3)" : "1px solid #2A2A4E",
                  opacity: a.earned ? 1 : 0.5
                }}>
                <p style={{ fontSize: 24, filter: a.earned ? "none" : "grayscale(1)" }}>{a.icon}</p>
                <p style={{ fontSize: 12, fontWeight: 700, color: a.earned ? "#fff" : "#6B6B80", fontFamily: "Inter, sans-serif", marginTop: 4 }}>{a.title}</p>
                <p style={{ fontSize: 10, color: "#6B6B80", fontFamily: "Inter, sans-serif", marginTop: 2 }}>{a.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sign out */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <button onClick={onSignOut}
            className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 transition-all hover:bg-red-500/10"
            style={{ border: "1px solid rgba(255,68,68,0.3)", color: "#FF4444", fontWeight: 600, fontSize: 15, fontFamily: "Inter, sans-serif" }}>
            <LogOut size={18} />
            Sign Out
          </button>
        </motion.div>
      </div>
    </div>
  );
}
