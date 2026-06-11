import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import {
  Home, Calendar, Target, Trophy, User, Bell, ChevronDown, LogOut,
  BarChart2, Users, Menu, X
} from "lucide-react";

type Page = "dashboard" | "fixtures" | "predict" | "leaderboard" | "leagues" | "analytics" | "profile";

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  user: { name: string; avatar: string; email: string } | null;
  onSignOut: () => void;
  notifications?: number;
}

const tabs = [
  { id: "dashboard" as Page, label: "Home", icon: Home },
  { id: "fixtures" as Page, label: "Fixtures", icon: Calendar },
  { id: "predict" as Page, label: "Predict", icon: Target },
  { id: "leaderboard" as Page, label: "Ranks", icon: Trophy },
  { id: "profile" as Page, label: "Profile", icon: User },
];

const desktopNavLinks = [
  { id: "dashboard" as Page, label: "Dashboard" },
  { id: "fixtures" as Page, label: "Fixtures" },
  { id: "leaderboard" as Page, label: "Leaderboard" },
  { id: "leagues" as Page, label: "Leagues" },
  { id: "analytics" as Page, label: "Analytics" },
];

export function BottomNav({ currentPage, onNavigate, notifications }: Omit<NavigationProps, "user" | "onSignOut">) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{ background: "rgba(26,26,46,0.97)", backdropFilter: "blur(20px)", borderTop: "1px solid #2A2A4E" }}
    >
      <div className="flex items-center justify-around h-16 px-2 relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentPage === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="flex flex-col items-center gap-1 flex-1 py-2 relative"
              style={{ color: isActive ? "#00B2A9" : "#6B6B80" }}
            >
              {tab.id === "predict" && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full flex items-center justify-center"
                  style={{ background: isActive ? "#00B2A9" : "linear-gradient(135deg, #1B0A3E, #002868)", border: "2px solid #2A2A4E", boxShadow: isActive ? "0 0 20px rgba(0,178,169,0.5)" : "none" }}>
                  <Icon size={22} color="#fff" />
                </div>
              )}
              {tab.id !== "predict" && (
                <>
                  <div className="relative">
                    <Icon size={22} />
                    {tab.id === "leaderboard" && notifications && notifications > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: "#00B2A9" }} />
                    )}
                  </div>
                  <span style={{ fontSize: 10, fontFamily: "Inter, sans-serif", fontWeight: isActive ? 600 : 400 }}>{tab.label}</span>
                </>
              )}
              {tab.id === "predict" && <span style={{ fontSize: 10, marginTop: 20, fontFamily: "Inter, sans-serif", fontWeight: 600 }}>Predict</span>}
              {isActive && tab.id !== "predict" && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: "#00B2A9" }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export function TopNav({ currentPage, onNavigate, user, onSignOut, notifications }: NavigationProps) {
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 hidden md:flex items-center justify-between px-6 h-[72px] transition-all duration-300"
      style={{
        background: scrolled ? "rgba(13,13,26,0.95)" : "rgba(13,13,26,0.7)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(42,42,78,0.8)",
      }}
    >
      {/* Logo */}
      <button onClick={() => onNavigate("dashboard")} className="flex items-center gap-2 select-none">
        <span className="text-2xl">⚽</span>
        <span style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 800, fontSize: 20, color: "#fff", letterSpacing: "-0.5px" }}>
          WC<span style={{ color: "#00B2A9" }}>26</span>
        </span>
      </button>

      {/* Center Links */}
      <div className="flex items-center gap-1">
        {desktopNavLinks.map((link) => {
          const isActive = currentPage === link.id;
          return (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className="px-4 py-2 rounded-lg relative transition-colors"
              style={{
                fontFamily: "Inter, sans-serif",
                fontWeight: isActive ? 600 : 400,
                fontSize: 15,
                color: isActive ? "#00B2A9" : "#A0A0B0",
              }}
            >
              {link.label}
              {isActive && (
                <motion.div
                  layoutId="navUnderline"
                  className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                  style={{ background: "#00B2A9" }}
                  transition={{ type: "spring", damping: 25, stiffness: 400 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors" onClick={() => onNavigate("leaderboard")}>
          <Bell size={20} color="#A0A0B0" />
          {notifications && notifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
              style={{ background: "#E4002B", fontSize: 9, fontWeight: 700, color: "#fff" }}>
              {notifications}
            </span>
          )}
        </button>
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-xl px-3 py-1.5 transition-colors hover:bg-white/5"
          >
            <img src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`}
              alt={user?.name} className="w-8 h-8 rounded-full object-cover" style={{ border: "2px solid #00B2A9" }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>{user?.name?.split(" ")[0]}</span>
            <ChevronDown size={14} color="#A0A0B0" />
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-full mt-2 rounded-xl p-1 min-w-48"
                style={{ background: "#1A1A2E", border: "1px solid #2A2A4E", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}
              >
                <div className="px-3 py-2 border-b" style={{ borderColor: "#2A2A4E" }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>{user?.name}</p>
                  <p style={{ fontSize: 12, color: "#6B6B80" }}>{user?.email}</p>
                </div>
                <button onClick={() => { onNavigate("analytics"); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left">
                  <BarChart2 size={14} color="#A0A0B0" />
                  <span style={{ fontSize: 13, color: "#A0A0B0" }}>Analytics</span>
                </button>
                <button onClick={() => { onNavigate("leagues"); setProfileOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 text-left">
                  <Users size={14} color="#A0A0B0" />
                  <span style={{ fontSize: 13, color: "#A0A0B0" }}>My Leagues</span>
                </button>
                <button onClick={onSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 text-left">
                  <LogOut size={14} color="#FF4444" />
                  <span style={{ fontSize: 13, color: "#FF4444" }}>Sign out</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
}
