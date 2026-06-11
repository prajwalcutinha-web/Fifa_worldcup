import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Shield, Zap, Trophy, Star, ChevronRight } from "lucide-react";
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
  {
    icon: "🎯",
    title: "Predict Every Match",
    desc: "Predict the final score, first team to score, and first goalscorer for every World Cup match.",
    color: "#00B2A9",
  },
  {
    icon: "🏆",
    title: "Compete in Leagues",
    desc: "Join public leagues or create private ones with friends, family, and colleagues.",
    color: "#FFD700",
  },
  {
    icon: "⚡",
    title: "Double Your Points",
    desc: "Pick one match per matchday to double your points. Strategy meets football.",
    color: "#E4002B",
  },
];

const DEMO_USERS = [
  { name: "Alex Johnson", email: "alex@example.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" },
  { name: "Sarah Mitchell", email: "sarah@example.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" },
  { name: "Marcus Williams", email: "marcus@example.com", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus" },
];

export function LandingPage({ onSignIn }: LandingPageProps) {
  const [typedText, setTypedText] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const [phase, setPhase] = useState(0); // 0=init, 1=trophy, 2=logo, 3=tagline, 4=btn, 5=proof
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [showDemoSelect, setShowDemoSelect] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [googleEnabled, setGoogleEnabled] = useState(false);

  // Discover whether real Google OAuth is configured on the backend, and
  // surface any OAuth error passed back via the redirect query string.
  useEffect(() => {
    api.authConfig().then((c) => setGoogleEnabled(c.google)).catch(() => {});
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_error")) {
      setAuthError("Google sign-in failed. Please try again.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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

  const handleGoogleSignIn = () => {
    // Use real Google OAuth when configured; otherwise fall back to the demo picker.
    if (googleEnabled) {
      window.location.href = api.googleLoginUrl();
      return;
    }
    setShowDemoSelect(true);
  };

  const selectDemoUser = (user: typeof DEMO_USERS[0]) => {
    setIsSigningIn(true);
    setShowDemoSelect(false);
    setTimeout(() => {
      onSignIn(user);
    }, 1200);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsSigningIn(true);
    try {
      const { user } =
        authMode === "signup"
          ? await api.register({
              name: formData.name || undefined,
              email: formData.email,
              password: formData.password,
            })
          : await api.login({ email: formData.email, password: formData.password });
      onSignIn(user);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.status === 400
            ? "Please enter a valid email and a password of at least 8 characters."
            : err.message
          : "Something went wrong. Is the API server running?";
      setAuthError(msg);
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden" style={{ background: "#0D0D1A" }}>
      {/* Animated mesh background */}
      <div className="absolute inset-0 animated-mesh opacity-90" />

      {/* Stadium silhouette */}
      <div className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none overflow-hidden">
        <svg viewBox="0 0 1440 200" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0,200 L0,160 Q100,120 200,140 Q350,170 500,130 Q650,90 720,110 Q800,130 900,100 Q1050,60 1200,120 Q1320,160 1440,140 L1440,200 Z"
            fill="rgba(27,10,62,0.4)"
          />
          <path
            d="M0,200 L0,175 Q180,155 360,165 Q540,180 720,150 Q900,120 1080,160 Q1260,185 1440,170 L1440,200 Z"
            fill="rgba(0,40,104,0.25)"
          />
        </svg>
      </div>

      {/* Pitch lines overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.04 }}>
        <svg width="100%" height="100%" viewBox="0 0 800 600">
          <rect x="100" y="100" width="600" height="400" fill="none" stroke="white" strokeWidth="1" />
          <circle cx="400" cy="300" r="80" fill="none" stroke="white" strokeWidth="1" />
          <line x1="400" y1="100" x2="400" y2="500" stroke="white" strokeWidth="1" />
          <rect x="200" y="200" width="100" height="200" fill="none" stroke="white" strokeWidth="1" />
          <rect x="500" y="200" width="100" height="200" fill="none" stroke="white" strokeWidth="1" />
        </svg>
      </div>

      {/* Floating particles */}
      {PARTICLES.map((p) => (
        <div key={p.id} className={`absolute pointer-events-none ${p.cls}`}
          style={{ left: p.x, top: p.y, fontSize: p.size, opacity: 0.5 }}>
          {p.emoji}
        </div>
      ))}

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Desktop layout */}
        <div className="hidden md:flex flex-1 items-center">
          <div className="max-w-7xl mx-auto w-full px-8 grid grid-cols-2 gap-16 items-center py-16">
            {/* Left content */}
            <div className="flex flex-col gap-8">
              {/* Badge */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: phase >= 1 ? 1 : 0 }} transition={{ duration: 0.5 }}>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold"
                  style={{ background: "rgba(0,178,169,0.15)", color: "#00B2A9", border: "1px solid rgba(0,178,169,0.3)", fontFamily: "Inter, sans-serif" }}>
                  🌍 FIFA World Cup 2026 Official Predictor
                </span>
              </motion.div>

              {/* Logo + Title */}
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 30 }} transition={{ duration: 0.6 }}>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-5xl">⚽</span>
                  <span className="font-heading" style={{ fontSize: 18, fontWeight: 700, color: "#A0A0B0", letterSpacing: 4, textTransform: "uppercase" }}>WC26</span>
                </div>
                <h1 className="font-heading" style={{ fontSize: 54, fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-1px" }}>
                  PREDICTOR<br />
                  <span style={{ background: "linear-gradient(90deg, #00B2A9, #FFD700)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    LEAGUE
                  </span>
                </h1>
              </motion.div>

              {/* Tagline typewriter */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: phase >= 3 ? 1 : 0 }}>
                <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 28, fontWeight: 700, color: "#A0A0B0" }}>
                  "{typedText}<span className="cursor-blink" style={{ color: "#00B2A9" }}>|</span>"
                </p>
              </motion.div>

              {/* Feature bullets */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: phase >= 4 ? 1 : 0 }} className="flex flex-col gap-3">
                {["🎯 Predict score, first team & goalscorer", "🏆 Compete in public & private leagues", "⚡ Double your points on key matches", "🌍 All 48 group games + knockouts"].map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span style={{ fontSize: 14, color: "#A0A0B0", fontFamily: "Inter, sans-serif" }}>{f}</span>
                  </div>
                ))}
              </motion.div>

              {/* Auth buttons */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : 20 }} className="flex flex-col gap-3">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isSigningIn}
                  className="glow-pulse flex items-center justify-center gap-3 rounded-2xl transition-all hover:scale-105 active:scale-95"
                  style={{ background: "#fff", color: "#1B0A3E", fontWeight: 600, fontSize: 16, fontFamily: "Inter, sans-serif", padding: "16px 32px", maxWidth: 360, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
                >
                  {isSigningIn ? (
                    <span className="animate-spin text-xl">⚽</span>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  )}
                  {isSigningIn ? "Signing you in..." : "Continue with Google"}
                </button>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center justify-center gap-2 rounded-2xl transition-all hover:bg-white/10"
                  style={{ color: "#A0A0B0", fontWeight: 500, fontSize: 15, fontFamily: "Inter, sans-serif", padding: "14px 32px", maxWidth: 360, border: "1px solid #2A2A4E" }}
                >
                  Sign in with Email
                </button>
              </motion.div>

              {/* Social proof */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: phase >= 5 ? 1 : 0 }}>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {["Alex", "Sam", "Jordan", "Taylor", "Casey"].map((n) => (
                      <img key={n} src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${n}`}
                        className="w-7 h-7 rounded-full" style={{ border: "2px solid #0D0D1A" }} alt={n} />
                    ))}
                  </div>
                  <span style={{ fontSize: 13, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>
                    Join <strong style={{ color: "#00B2A9" }}>12,400+</strong> predictors competing
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Right — Trophy */}
            <div className="flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: 50 }}
                animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0.5, y: phase >= 1 ? 0 : 50 }}
                transition={{ type: "spring", damping: 12, stiffness: 100, delay: 0.2 }}
                className="trophy-float relative"
              >
                <div className="text-center" style={{ fontSize: 200, lineHeight: 1, filter: "drop-shadow(0 0 60px rgba(255,215,0,0.4))" }}>
                  🏆
                </div>
                {/* Glow ring */}
                <div className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%)" }} />
                {/* Host nations */}
                <div className="flex justify-center gap-4 mt-4">
                  {["🇺🇸", "🇲🇽", "🇨🇦"].map((flag, i) => (
                    <span key={i} style={{ fontSize: 36 }}>{flag}</span>
                  ))}
                </div>
                <p style={{ textAlign: "center", fontSize: 12, color: "#6B6B80", fontFamily: "Inter, sans-serif", marginTop: 8 }}>
                  USA • Mexico • Canada · 2026
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden flex flex-col items-center justify-center min-h-screen px-5 py-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -30 }}
            animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0.5, y: phase >= 1 ? 0 : -30 }}
            transition={{ type: "spring", damping: 12, stiffness: 100 }}
            className="trophy-float"
          >
            <div style={{ fontSize: 100, lineHeight: 1, filter: "drop-shadow(0 0 40px rgba(255,215,0,0.5))" }}>🏆</div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 20 }} className="mt-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-3xl">⚽</span>
              <span className="font-heading" style={{ fontSize: 28, fontWeight: 900, color: "#fff" }}>
                WC<span style={{ color: "#00B2A9" }}>26</span>
              </span>
            </div>
            <h1 className="font-heading" style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: "-0.5px" }}>
              PREDICTOR LEAGUE
            </h1>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: phase >= 3 ? 1 : 0 }}
            className="mt-3" style={{ fontFamily: "Montserrat, sans-serif", fontSize: 18, fontWeight: 700, color: "#A0A0B0" }}>
            "{typedText}<span className="cursor-blink" style={{ color: "#00B2A9" }}>|</span>"
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : 20 }}
            className="w-full mt-8 flex flex-col gap-3">
            <button
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
              className="glow-pulse w-full flex items-center justify-center gap-3 rounded-2xl"
              style={{ background: "#fff", color: "#1B0A3E", fontWeight: 600, fontSize: 16, fontFamily: "Inter, sans-serif", padding: "16px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}
            >
              {isSigningIn ? <span className="animate-spin">⚽</span> : (
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {isSigningIn ? "Signing you in..." : "Continue with Google"}
            </button>
            <button
              onClick={() => setShowAuthModal(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl"
              style={{ color: "#A0A0B0", fontWeight: 500, fontSize: 15, fontFamily: "Inter, sans-serif", padding: "14px", border: "1px solid #2A2A4E" }}
            >
              Sign in with Email
            </button>
          </motion.div>

          <motion.p initial={{ opacity: 0 }} animate={{ opacity: phase >= 5 ? 1 : 0 }}
            className="mt-6" style={{ fontSize: 13, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>
            Join <strong style={{ color: "#00B2A9" }}>12,400+</strong> predictors competing
          </motion.p>
        </div>

        {/* Feature cards below fold — desktop */}
        <div className="hidden md:block pb-20">
          <div className="max-w-5xl mx-auto px-8">
            <div className="grid grid-cols-3 gap-6">
              {FEATURES.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: phase >= 5 ? 1 : 0, y: phase >= 5 ? 0 : 30 }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="rounded-2xl p-6"
                  style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}
                >
                  <div className="text-3xl mb-3">{f.icon}</div>
                  <h3 style={{ fontFamily: "Montserrat, sans-serif", fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontFamily: "Inter, sans-serif", fontSize: 14, color: "#A0A0B0", lineHeight: 1.6 }}>{f.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Demo user selector */}
      <AnimatePresence>
        {showDemoSelect && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowDemoSelect(false)}
          >
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="rounded-2xl p-6 w-full max-w-sm"
              style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ fontFamily: "Montserrat, sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 4 }}>
                Select Demo Account
              </h3>
              <p style={{ fontSize: 13, color: "#6B6B80", fontFamily: "Inter, sans-serif", marginBottom: 20 }}>
                (Demo mode — no real Google auth required)
              </p>
              <div className="flex flex-col gap-3">
                {DEMO_USERS.map((u) => (
                  <button key={u.email} onClick={() => selectDemoUser(u)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors text-left"
                    style={{ border: "1px solid #2A2A4E" }}>
                    <img src={u.avatar} className="w-10 h-10 rounded-full" alt={u.name} style={{ border: "2px solid #00B2A9" }} />
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{u.name}</p>
                      <p style={{ fontSize: 12, color: "#6B6B80" }}>{u.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Auth Modal */}
      <AnimatePresence>
        {showAuthModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 md:p-8"
            style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            onClick={() => setShowAuthModal(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              className="rounded-2xl p-6 w-full max-w-md"
              style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex gap-1 mb-6 rounded-xl p-1" style={{ background: "#0D0D1A" }}>
                {(["signin", "signup"] as const).map((mode) => (
                  <button key={mode} onClick={() => setAuthMode(mode)}
                    className="flex-1 py-2 rounded-lg transition-all"
                    style={{
                      background: authMode === mode ? "#00B2A9" : "transparent",
                      color: authMode === mode ? "#fff" : "#6B6B80",
                      fontWeight: 600, fontSize: 14, fontFamily: "Inter, sans-serif"
                    }}>
                    {mode === "signin" ? "Sign In" : "Sign Up"}
                  </button>
                ))}
              </div>
              <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
                {authMode === "signup" && (
                  <div>
                    <label style={{ fontSize: 13, color: "#A0A0B0", fontFamily: "Inter, sans-serif", marginBottom: 6, display: "block" }}>Full Name</label>
                    <input
                      type="text" placeholder="Your name" value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full rounded-xl px-4 py-3 outline-none"
                      style={{ background: "#252540", border: "1px solid #2A2A4E", color: "#fff", fontSize: 15 }}
                    />
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 13, color: "#A0A0B0", fontFamily: "Inter, sans-serif", marginBottom: 6, display: "block" }}>Email</label>
                  <input
                    type="email" placeholder="you@example.com" value={formData.email} required
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 outline-none"
                    style={{ background: "#252540", border: "1px solid #2A2A4E", color: "#fff", fontSize: 15 }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#A0A0B0", fontFamily: "Inter, sans-serif", marginBottom: 6, display: "block" }}>Password</label>
                  <input
                    type="password" placeholder="••••••••" value={formData.password} required
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-xl px-4 py-3 outline-none"
                    style={{ background: "#252540", border: "1px solid #2A2A4E", color: "#fff", fontSize: 15 }}
                  />
                </div>
                <button type="submit" disabled={isSigningIn}
                  className="w-full rounded-xl py-4 mt-2 transition-all hover:opacity-90 active:scale-95"
                  style={{ background: "#00B2A9", color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: "Inter, sans-serif" }}>
                  {isSigningIn ? "⚽ Signing in..." : (authMode === "signin" ? "Sign In" : "Create Account")}
                </button>
                {authError && (
                  <p style={{ fontSize: 13, color: "#FF4444", fontFamily: "Inter, sans-serif", textAlign: "center" }}>
                    {authError}
                  </p>
                )}
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
