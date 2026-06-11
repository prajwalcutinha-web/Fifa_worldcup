import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { api, ApiError } from "../../lib/api";

interface LandingPageProps {
  onSignIn: (user: { name: string; email: string; avatar: string }) => void;
}

const TAGLINE = "Predict. Compete. Win.";
const PARTICLES = [
  { id: 1, emoji: "⚽", x: "15%", y: "20%", cls: "particle-1", size: 24 },
  { id: 2, emoji: "⭐", x: "80%", y: "15%", cls: "particle-2", size: 18 },
  { id: 3, emoji: "🏆", x: "85%", y: "70%", cls: "particle-3", size: 20 },
  { id: 4, emoji: "⚽", x: "8%", y: "65%", cls: "particle-2", size: 16 },
  { id: 5, emoji: "🌟", x: "50%", y: "10%", cls: "particle-1", size: 14 },
  { id: 6, emoji: "⚽", x: "92%", y: "40%", cls: "particle-3", size: 22 },
  { id: 7, emoji: "🔺", x: "25%", y: "85%", cls: "particle-1", size: 12 },
  { id: 8, emoji: "⬡", x: "70%", y: "85%", cls: "particle-2", size: 10 },
];

const FEATURES = [
  { icon: "🎯", title: "Predict Every Match", desc: "Predict the final score, first team to score, and first goalscorer for every World Cup match.", color: "#00B2A9" },
  { icon: "🏆", title: "Compete in Leagues", desc: "Join public leagues or create private ones with friends, family, and colleagues.", color: "#FFD700" },
  { icon: "⚡", title: "Double Your Points", desc: "Pick one match per matchday to double your points. Strategy meets football.", color: "#E4002B" },
];

export function LandingPage({ onSignIn }: LandingPageProps) {
  const [typedText, setTypedText] = useState("");
  const [phase, setPhase] = useState(0); // 0=init,1=trophy,2=logo,3=tagline,4=btn,5=proof
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 900),
      setTimeout(() => setPhase(5), 2000),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (phase >= 3) {
      let i = 0;
      const interval = setInterval(() => {
        if (i <= TAGLINE.length) {
          setTypedText(TAGLINE.slice(0, i));
          i++;
        } else {
          clearInterval(interval);
          setPhase(4);
        }
      }, 60);
      return () => clearInterval(interval);
    }
  }, [phase]);

  const openAuth = (mode: "signin" | "signup") => {
    setAuthMode(mode);
    setAuthError(null);
    setShowAuthModal(true);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const { user } =
        authMode === "signup"
          ? await api.register({ name: formData.name || undefined, email: formData.email, password: formData.password })
          : await api.login({ email: formData.email, password: formData.password });
      onSignIn(user);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 400
            ? "Enter a valid email and a password of at least 8 characters."
            : err.message
          : "Something went wrong. Please try again.";
      setAuthError(msg);
      setIsSigningIn(false);
    }
  };

  const PrimaryButton = ({ full = false }: { full?: boolean }) => (
    <button
      onClick={() => openAuth("signup")}
      className={`glow-pulse flex items-center justify-center gap-3 rounded-2xl transition-all hover:scale-105 active:scale-95 ${full ? "w-full" : ""}`}
      style={{ background: "#00B2A9", color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: "Inter, sans-serif", padding: "16px 32px", maxWidth: full ? undefined : 360, boxShadow: "0 8px 32px rgba(0,178,169,0.35)" }}
    >
      🏆 Create your free account
    </button>
  );

  return (
    <div className="min-h-screen w-full relative overflow-hidden" style={{ background: "#0D0D1A" }}>
      <div className="absolute inset-0 animated-mesh opacity-90" />

      {/* Stadium silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none" className="w-full h-full">
          <path d="M0,200 L0,160 Q100,120 200,140 Q350,170 500,130 Q650,90 720,110 Q800,130 900,100 Q1050,60 1200,120 Q1320,160 1440,140 L1440,200 Z" fill="rgba(27,10,62,0.4)" />
          <path d="M0,200 L0,175 Q180,155 360,165 Q540,180 720,150 Q900,120 1080,160 Q1260,185 1440,170 L1440,200 Z" fill="rgba(0,40,104,0.25)" />
        </svg>
      </div>

      {/* Pitch lines */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04 }}>
        <svg width="100%" height="100%" viewBox="0 0 800 600">
          <rect x="100" y="100" width="600" height="400" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="400" cy="300" r="80" fill="none" stroke="white" strokeWidth="1" />
          <line x1="400" y1="100" x2="400" y2="500" stroke="white" strokeWidth="1" />
        </svg>
      </div>

      {PARTICLES.map((p) => (
        <div key={p.id} className={`absolute pointer-events-none ${p.cls}`} style={{ left: p.x, top: p.y, fontSize: p.size, opacity: 0.5 }}>
          {p.emoji}
        </div>
      ))}

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Desktop */}
        <div className="hidden md:flex flex-1 items-center">
          <div className="max-w-7xl mx-auto w-full px-8 grid grid-cols-2 gap-16 items-center py-16">
            <div className="flex flex-col gap-8">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold" style={{ background: "rgba(0,178,169,0.15)", color: "#00B2A9", border: "1px solid rgba(0,178,169,0.3)", fontFamily: "Inter, sans-serif" }}>
                  🌍 FIFA World Cup 2026 Predictor League
                </span>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 30 }} transition={{ duration: 0.6 }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-5xl">⚽</span>
                  <span className="font-heading" style={{ fontSize: 18, fontWeight: 700, color: "#A0A0B0", letterSpacing: 4, textTransform: "uppercase" }}>WC26</span>
                </div>
                <h1 className="font-heading" style={{ fontSize: 54, fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-1px" }}>
                  PREDICTOR<br />
                  <span style={{ background: "linear-gradient(90deg, #00B2A9, #FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>LEAGUE</span>
                </h1>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: phase >= 3 ? 1 : 0 }}>
                <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 28, fontWeight: 700, color: "#A0A0B0" }}>
                  "{typedText}<span className="cursor-blink" style={{ color: "#00B2A9" }}>|</span>"
                </p>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: phase >= 4 ? 1 : 0 }} className="flex flex-col gap-3">
                {["🎯 Predict score, first team & goalscorer", "🏆 Compete in public & private leagues", "⚡ Double your points on key matches", "🌍 Live scores from every World Cup match"].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span style={{ fontSize: 14, color: "#A0A0B0", fontFamily: "Inter, sans-serif" }}>{f}</span>
                  </div>
                ))}
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : 20 }} className="flex flex-col gap-3">
                <PrimaryButton />
                <button onClick={() => openAuth("signin")} className="flex items-center justify-center gap-2 rounded-2xl transition-all hover:bg-white/10" style={{ color: "#A0A0B0", fontWeight: 500, fontSize: 15, fontFamily: "Inter, sans-serif", padding: "14px 32px", maxWidth: 360, border: "1px solid #2A2A4E" }}>
                  Already have an account? Sign in
                </button>
              </motion.div>
            </div>

            {/* Trophy */}
            <div className="flex items-center justify-center">
              <motion.div initial={{ opacity: 0, scale: 0.5, y: 50 }} animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0.5, y: phase >= 1 ? 0 : 50 }} transition={{ type: "spring", damping: 12, stiffness: 100, delay: 0.2 }} className="trophy-float relative">
                <div className="text-center" style={{ fontSize: 200, lineHeight: 1, filter: "drop-shadow(0 0 60px rgba(255,215,0,0.4))" }}>🏆</div>
                <div className="absolute inset-0 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)" }} />
                <div className="flex justify-center gap-4 mt-4">
                  {["🇺🇸", "🇲🇽", "🇨🇦"].map((flag, i) => (<span key={i} style={{ fontSize: 36 }}>{flag}</span>))}
                </div>
                <p style={{ textAlign: "center", fontSize: 12, color: "#6B6B80", fontFamily: "Inter, sans-serif", marginTop: 8 }}>USA • Mexico • Canada · 2026</p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Mobile */}
        <div className="md:hidden flex flex-col items-center justify-center min-h-screen px-5 py-10 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.5, y: -30 }} animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0.5, y: phase >= 1 ? 0 : -30 }} transition={{ type: "spring", damping: 12, stiffness: 100 }} className="trophy-float">
            <div style={{ fontSize: 100, lineHeight: 1, filter: "drop-shadow(0 0 40px rgba(255,215,0,0.5))" }}>🏆</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 20 }} className="mt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl">⚽</span>
              <span className="font-heading" style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>WC<span style={{ color: "#00B2A9" }}>26</span></span>
            </div>
            <h1 className="font-heading" style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>PREDICTOR LEAGUE</h1>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: phase >= 3 ? 1 : 0 }} className="mt-3" style={{ fontFamily: "Montserrat, sans-serif", fontSize: 18, fontWeight: 700, color: "#A0A0B0" }}>
            "{typedText}<span className="cursor-blink" style={{ color: "#00B2A9" }}>|</span>"
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : 20 }} className="w-full mt-8 flex flex-col gap-3">
            <PrimaryButton full />
            <button onClick={() => openAuth("signin")} className="w-full flex items-center justify-center gap-2 rounded-2xl" style={{ color: "#A0A0B0", fontWeight: 500, fontSize: 15, fontFamily: "Inter, sans-serif", padding: "14px", border: "1px solid #2A2A4E" }}>
              Already have an account? Sign in
            </button>
          </motion.div>
        </div>

        {/* Feature cards */}
        <div className="hidden md:block pb-20">
          <div className="max-w-5xl mx-auto px-8">
            <div className="grid grid-cols-3 gap-6">
              {FEATURES.map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} animate={{ opacity: phase >= 5 ? 1 : 0, y: phase >= 5 ? 0 : 30 }} transition={{ delay: i * 0.15, duration: 0.5 }} className="rounded-2xl p-6" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 style={{ fontFamily: "Montserrat, sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#A0A0B0", lineHeight: 1.6 }}>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Email Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 md:p-8" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }} onClick={() => setShowAuthModal(false)}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="rounded-2xl p-6 w-full max-w-md" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }} onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-1 mb-6 rounded-xl p-1" style={{ background: "#0D0D1A" }}>
                {(["signup", "signin"] as const).map((mode) => (
                  <button key={mode} onClick={() => { setAuthMode(mode); setAuthError(null); }} className="flex-1 py-2 rounded-lg transition-all" style={{ background: authMode === mode ? "#00B2A9" : "transparent", color: authMode === mode ? "#fff" : "#6B6B80", fontWeight: 600, fontSize: 14, fontFamily: "Inter, sans-serif" }}>
                    {mode === "signup" ? "Sign Up" : "Sign In"}
                  </button>
                ))}
              </div>
              <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
                {authMode === "signup" && (
                  <div>
                    <label style={{ fontSize: 13, color: "#A0A0B0", fontFamily: "Inter, sans-serif", marginBottom: 6, display: "block" }}>Full Name</label>
                    <input type="text" placeholder="Your name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full rounded-xl px-4 py-3 outline-none" style={{ background: "#252540", border: "1px solid #2A2A4E", color: "#fff", fontSize: 15 }} />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 13, color: "#A0A0B0", fontFamily: "Inter, sans-serif", marginBottom: 6, display: "block" }}>Email</label>
                  <input type="email" placeholder="you@example.com" value={formData.email} required onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full rounded-xl px-4 py-3 outline-none" style={{ background: "#252540", border: "1px solid #2A2A4E", color: "#fff", fontSize: 15 }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#A0A0B0", fontFamily: "Inter, sans-serif", marginBottom: 6, display: "block" }}>Password</label>
                  <input type="password" placeholder="At least 8 characters" value={formData.password} required onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full rounded-xl px-4 py-3 outline-none" style={{ background: "#252540", border: "1px solid #2A2A4E", color: "#fff", fontSize: 15 }} />
                </div>
                <button type="submit" disabled={isSigningIn} className="w-full rounded-xl py-4 mt-2 transition-all hover:opacity-90 active:scale-95" style={{ background: "#00B2A9", color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: "Inter, sans-serif" }}>
                  {isSigningIn ? "⚽ Please wait..." : authMode === "signup" ? "Create Account" : "Sign In"}
                </button>
                {authError && (
                  <p style={{ fontSize: 13, color: "#FF4444", fontFamily: "Inter, sans-serif", textAlign: "center" }}>{authError}</p>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
