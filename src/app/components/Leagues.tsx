import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { Plus, Copy, Check, Users, Lock, Globe } from "lucide-react";
import { api } from "../../lib/api";

const MY_LEAGUES = [
  { id: 1, name: "Premier Predictors", members: 234, type: "public", rank: 12, pts: 131, topScorer: "John D. (142 pts)", code: null },
  { id: 2, name: "Office Champions", members: 12, max: 20, type: "private", rank: 4, pts: 131, topScorer: "Sarah M. (138 pts)", code: "WC26-OFFC" },
  { id: 3, name: "Family League", members: 7, max: 15, type: "private", rank: 2, pts: 131, topScorer: "You (131 pts)", code: "WC26-FAM7" },
];

const PUBLIC_LEAGUES = [
  { id: 10, name: "World Cup Fanatics", members: 1204, pts: null, topScorer: "Alice K. (187 pts)" },
  { id: 11, name: "Football Geeks United", members: 567, pts: null, topScorer: "Bob M. (172 pts)" },
  { id: 12, name: "WC26 Elite Predictors", members: 389, pts: null, topScorer: "Carol T. (168 pts)" },
  { id: 13, name: "Goal Machine League", members: 203, pts: null, topScorer: "Dave P. (155 pts)" },
];

export function Leagues() {
  const [tab, setTab] = useState<"my" | "public" | "create">("my");
  const [joinCode, setJoinCode] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", type: "private" as "public" | "private", max: 50 });
  const [created, setCreated] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [publicLeagues, setPublicLeagues] = useState<any[]>([]);
  const [myLeagues, setMyLeagues] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadLeagues = async () => {
    try {
      const { leagues } = await api.leagues();
      setPublicLeagues(leagues.filter((l: any) => l.type === "public"));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadLeagues();
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const { league } = await api.createLeague({
        name: createForm.name,
        type: createForm.type,
        maxMembers: createForm.max,
      });
      setGeneratedCode(league.inviteCode ?? "PUBLIC");
      setCreated(true);
      setMyLeagues((prev) => [...prev, { ...league, rank: 1, pts: 0, topScorer: "You (0 pts)", code: league.inviteCode }]);
      loadLeagues();
      setTimeout(() => setCreated(false), 6000);
    } catch (err: any) {
      setMessage(err?.message ?? "Could not create league");
    } finally {
      setBusy(false);
    }
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      const { league } = await api.joinLeague({ inviteCode: joinCode.trim() });
      setMyLeagues((prev) =>
        prev.some((l) => l.id === league.id) ? prev : [...prev, { ...league, rank: "—", pts: 0, topScorer: "—", code: league.inviteCode }]
      );
      setJoinCode("");
      setMessage(`Joined "${league.name}"!`);
    } catch (err: any) {
      setMessage(err?.message ?? "Could not join league");
    } finally {
      setBusy(false);
    }
  };

  const handleJoinPublic = async (leagueId: string) => {
    setBusy(true);
    setMessage(null);
    try {
      const { league } = await api.joinLeague({ leagueId });
      setMyLeagues((prev) =>
        prev.some((l) => l.id === league.id) ? prev : [...prev, { ...league, rank: "—", pts: 0, topScorer: "—", code: null }]
      );
      setMessage(`Joined "${league.name}"!`);
      setTab("my");
    } catch (err: any) {
      setMessage(err?.message ?? "Could not join league");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 md:pb-8" style={{ background: "#0D0D1A" }}>
      <div className="max-w-2xl mx-auto px-4 md:px-8 pt-20 md:pt-24">

        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontFamily: "Montserrat, sans-serif", fontSize: 26, fontWeight: 800, color: "#fff", marginBottom: 20 }}>
            👥 Leagues
          </h1>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            {([
              { key: "my", label: "My Leagues" },
              { key: "public", label: "Discover" },
              { key: "create", label: "+ Create" },
            ] as const).map(({ key, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className="px-4 py-2 rounded-full transition-all"
                style={{
                  background: tab === key ? "#00B2A9" : "#1A1A2E",
                  color: tab === key ? "#fff" : "#6B6B80",
                  fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif",
                  border: `1px solid ${tab === key ? "#00B2A9" : "#2A2A4E"}`,
                }}>
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* My Leagues */}
        {tab === "my" && (
          <div className="flex flex-col gap-4">
            {/* Join with code */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "Montserrat, sans-serif", marginBottom: 12 }}>
                🔑 Join Private League
              </p>
              <div className="flex gap-2">
                <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="Enter invite code (WC26-XXXX)"
                  className="flex-1 rounded-xl px-4 py-2.5 outline-none"
                  style={{ background: "#252540", border: "1px solid #2A2A4E", color: "#fff", fontSize: 14, fontFamily: "Inter, sans-serif" }}
                />
                <button onClick={handleJoinByCode} disabled={busy} className="px-4 py-2.5 rounded-xl font-semibold"
                  style={{ background: "#00B2A9", color: "#fff", fontSize: 14, fontFamily: "Inter, sans-serif", opacity: busy ? 0.6 : 1 }}>
                  Join
                </button>
              </div>
              {message && (
                <p style={{ fontSize: 12, color: "#00B2A9", fontFamily: "Inter, sans-serif", marginTop: 8 }}>{message}</p>
              )}
            </motion.div>

            {myLeagues.length === 0 && (
              <p style={{ fontSize: 13, color: "#6B6B80", fontFamily: "Inter, sans-serif", textAlign: "center", padding: "12px 0" }}>
                You haven't joined any leagues yet. Discover public leagues or join with an invite code.
              </p>
            )}

            {myLeagues.map((league, i) => (
              <motion.div key={league.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                className="rounded-2xl p-5" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {league.type === "private" ? <Lock size={16} color="#A0A0B0" /> : <Globe size={16} color="#A0A0B0" />}
                    <h3 style={{ fontFamily: "Montserrat, sans-serif", fontSize: 16, fontWeight: 700, color: "#fff" }}>
                      {league.name}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{ background: "rgba(0,178,169,0.2)", color: "#00B2A9", fontFamily: "Inter, sans-serif" }}>
                    Rank #{league.rank}
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-3">
                  <span style={{ fontSize: 13, color: "#A0A0B0", fontFamily: "Inter, sans-serif" }}>
                    👥 {league.memberCount}{league.maxMembers ? `/${league.maxMembers}` : ""} members
                  </span>
                  <span style={{ fontSize: 13, color: "#A0A0B0", fontFamily: "Inter, sans-serif" }}>
                    🏆 {league.topScorer}
                  </span>
                </div>
                {league.code && (
                  <div className="flex items-center gap-2 mt-2 p-3 rounded-xl" style={{ background: "#252540" }}>
                    <span style={{ fontSize: 13, color: "#A0A0B0", flex: 1, fontFamily: "Space Mono, monospace" }}>
                      {league.code}
                    </span>
                    <button onClick={() => copyCode(league.code!)} className="flex items-center gap-1.5 px-3 py-1 rounded-lg"
                      style={{ background: "rgba(0,178,169,0.2)", color: "#00B2A9", fontSize: 12, fontFamily: "Inter, sans-serif", fontWeight: 600 }}>
                      {copiedCode === league.code ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Public Leagues */}
        {tab === "public" && (
          <div className="flex flex-col gap-4">
            {publicLeagues.length === 0 && (
              <p style={{ fontSize: 13, color: "#6B6B80", fontFamily: "Inter, sans-serif", textAlign: "center", padding: "12px 0" }}>
                No public leagues yet — be the first to create one!
              </p>
            )}
            {publicLeagues.map((league, i) => (
              <motion.div key={league.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Globe size={14} color="#A0A0B0" />
                      <h3 style={{ fontFamily: "Montserrat, sans-serif", fontSize: 15, fontWeight: 700, color: "#fff" }}>
                        {league.name}
                      </h3>
                    </div>
                    <p style={{ fontSize: 12, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>
                      👥 {Number(league.memberCount).toLocaleString()} members
                    </p>
                  </div>
                  <button onClick={() => handleJoinPublic(league.id)} disabled={busy}
                    className="px-4 py-2 rounded-xl font-semibold transition-all hover:opacity-90"
                    style={{ background: "#00B2A9", color: "#fff", fontSize: 13, fontFamily: "Inter, sans-serif", opacity: busy ? 0.6 : 1 }}>
                    Join →
                  </button>
                </div>
                <div className="h-1 rounded-full" style={{ background: "#252540" }}>
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, (league.memberCount / 1500) * 100)}%`, background: "linear-gradient(90deg, #002868, #00B2A9)" }} />
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create League */}
        {tab === "create" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6" style={{ background: "#1A1A2E", border: "1px solid #2A2A4E" }}>
            <h2 style={{ fontFamily: "Montserrat, sans-serif", fontSize: 18, fontWeight: 700, color: "#fff", marginBottom: 20 }}>
              Create New League
            </h2>
            {created ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <p style={{ fontFamily: "Montserrat, sans-serif", fontSize: 20, fontWeight: 700, color: "#00B2A9" }}>League Created!</p>
                <p style={{ fontSize: 14, color: "#6B6B80", fontFamily: "Inter, sans-serif", marginTop: 8 }}>Share your code to invite friends</p>
                <div className="flex items-center gap-2 mt-4 p-3 rounded-xl mx-auto max-w-xs" style={{ background: "#252540" }}>
                  <span style={{ fontFamily: "Space Mono, monospace", fontSize: 16, fontWeight: 700, color: "#FFD700", flex: 1, textAlign: "center" }}>
                    {generatedCode}
                  </span>
                  <button onClick={() => copyCode(generatedCode)}>
                    {copiedCode ? <Check size={16} color="#00B2A9" /> : <Copy size={16} color="#A0A0B0" />}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div>
                  <label style={{ fontSize: 13, color: "#A0A0B0", fontFamily: "Inter, sans-serif", display: "block", marginBottom: 6 }}>League Name</label>
                  <input required value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                    placeholder="e.g. Office Champions 2026"
                    className="w-full rounded-xl px-4 py-3 outline-none"
                    style={{ background: "#252540", border: "1px solid #2A2A4E", color: "#fff", fontSize: 15, fontFamily: "Inter, sans-serif" }} />
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#A0A0B0", fontFamily: "Inter, sans-serif", display: "block", marginBottom: 10 }}>Type</label>
                  <div className="flex gap-3">
                    {(["private", "public"] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setCreateForm({ ...createForm, type: t })}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
                        style={{
                          background: createForm.type === t ? "rgba(0,178,169,0.2)" : "#252540",
                          border: createForm.type === t ? "2px solid #00B2A9" : "1px solid #2A2A4E",
                          color: createForm.type === t ? "#00B2A9" : "#6B6B80",
                          fontWeight: 600, fontSize: 14, fontFamily: "Inter, sans-serif"
                        }}>
                        {t === "private" ? <Lock size={14} /> : <Globe size={14} />}
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 13, color: "#A0A0B0", fontFamily: "Inter, sans-serif", display: "block", marginBottom: 10 }}>
                    Max Members: <strong style={{ color: "#fff" }}>{createForm.max}</strong>
                  </label>
                  <input type="range" min={5} max={500} value={createForm.max}
                    onChange={(e) => setCreateForm({ ...createForm, max: parseInt(e.target.value) })}
                    className="w-full" style={{ accentColor: "#00B2A9" }} />
                  <div className="flex justify-between mt-1">
                    <span style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>5</span>
                    <span style={{ fontSize: 11, color: "#6B6B80", fontFamily: "Inter, sans-serif" }}>500</span>
                  </div>
                </div>
                <button type="submit" disabled={busy}
                  className="w-full rounded-xl py-4 mt-2 font-bold transition-all hover:opacity-90"
                  style={{ background: "#00B2A9", color: "#fff", fontSize: 16, fontFamily: "Inter, sans-serif", opacity: busy ? 0.6 : 1 }}>
                  {busy ? "Creating..." : "🏆 Create League"}
                </button>
                {message && (
                  <p style={{ fontSize: 12, color: "#FF4444", fontFamily: "Inter, sans-serif", textAlign: "center" }}>{message}</p>
                )}
              </form>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
