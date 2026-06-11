import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { api } from "../lib/api";
import { LandingPage } from "./components/LandingPage";
import { Dashboard } from "./components/Dashboard";
import { Fixtures } from "./components/Fixtures";
import { PredictPage } from "./components/PredictPage";
import { Leaderboard } from "./components/Leaderboard";
import { Leagues } from "./components/Leagues";
import { Analytics } from "./components/Analytics";
import { Profile } from "./components/Profile";
import { BottomNav, TopNav } from "./components/Navigation";

/* MARKER-MAKE-KIT-INVOKED */

type Page = "dashboard" | "fixtures" | "predict" | "leaderboard" | "leagues" | "analytics" | "profile";

interface User {
  id?: string;
  name: string;
  email: string;
  avatar: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<Page>("dashboard");
  const [restoring, setRestoring] = useState(true);

  // Restore an existing session (httpOnly cookie) on first load.
  useEffect(() => {
    let active = true;
    api
      .me()
      .then(({ user }) => {
        if (active) {
          setUser(user);
          // Clean OAuth redirect params (?signin=google&welcome=1) from the URL.
          const params = new URLSearchParams(window.location.search);
          if (params.has("signin") || params.has("welcome")) {
            window.history.replaceState({}, "", window.location.pathname);
          }
        }
      })
      .catch(() => {
        /* not signed in */
      })
      .finally(() => {
        if (active) setRestoring(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSignIn = (u: User) => {
    setUser(u);
    setPage("dashboard");
  };

  const handleSignOut = async () => {
    try {
      await api.logout();
    } catch {
      /* ignore network errors on logout */
    }
    setUser(null);
    setPage("dashboard");
  };

  const navigate = (p: Page) => setPage(p);

  if (restoring) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0D0D1A" }}>
        <span className="animate-spin" style={{ fontSize: 48 }}>⚽</span>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onSignIn={handleSignIn} />;
  }

  const pageComponents: Record<Page, React.ReactNode> = {
    dashboard: <Dashboard user={user} onNavigate={navigate} />,
    fixtures: <Fixtures onNavigate={navigate} />,
    predict: <PredictPage onNavigate={navigate} />,
    leaderboard: <Leaderboard />,
    leagues: <Leagues />,
    analytics: <Analytics />,
    profile: <Profile user={user} onSignOut={handleSignOut} onNavigate={navigate} />,
  };

  return (
    <div className="min-h-screen" style={{ background: "#0D0D1A" }}>
      <TopNav
        currentPage={page}
        onNavigate={navigate}
        user={user}
        onSignOut={handleSignOut}
        notifications={3}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {pageComponents[page]}
        </motion.div>
      </AnimatePresence>

      <BottomNav
        currentPage={page}
        onNavigate={navigate}
        notifications={3}
      />
    </div>
  );
}
