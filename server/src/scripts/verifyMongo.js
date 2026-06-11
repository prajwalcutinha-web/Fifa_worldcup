// End-to-end verification against the configured MongoDB (reads MONGODB_URI
// from .env). Boots the real Express app, simulates a full user journey over
// HTTP, then queries the Mongo collections to prove the data was persisted.
// Test documents are cleaned up at the end.

process.env.PORT = process.env.PORT || "4200";

await import("../index.js");
await new Promise((r) => setTimeout(r, 2500));

const base = `http://localhost:${process.env.PORT}/api`;
let cookie = "";

function captureCookie(res) {
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
}

async function call(method, path, body) {
  const res = await fetch(base + path, {
    method,
    headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  captureCookie(res);
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

const results = [];
const check = (label, ok, detail = "") => {
  results.push({ label, ok });
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? " — " + detail : ""}`);
};

const email = `sim_${Date.now()}@example.com`;
const password = "SuperSecret123";

let r = await call("POST", "/auth/register", { name: "Sim User", email, password });
check("register (201 + cookie)", r.status === 201 && Boolean(cookie), `status=${r.status}`);
const userId = r.data?.user?.id;

r = await call("GET", "/auth/me");
check("session /me", r.status === 200 && r.data?.user?.email === email, r.data?.user?.email);

r = await call("GET", "/fixtures");
const predictable = r.data?.fixtures?.find((m) => ["no-prediction", "upcoming", "predicted", "double"].includes(m.state));
check("fixtures available", (r.data?.fixtures?.length ?? 0) > 0, `count=${r.data?.fixtures?.length} live=${r.data?.liveSource}`);

r = await call("POST", "/predictions", { matchId: predictable?.id ?? 2, homeScore: 3, awayScore: 1, firstTeam: "home", firstPlayer: "Vinicius", double: true });
check("submit prediction", r.status === 201, `id=${r.data?.prediction?.id}`);

r = await call("GET", "/predictions");
check("list predictions", (r.data?.predictions?.length ?? 0) === 1, `count=${r.data?.predictions?.length}`);

r = await call("GET", "/analytics");
check("analytics", r.data?.totalPredictions === 1 && r.data?.doubleUsed === 1, `total=${r.data?.totalPredictions}`);

r = await call("POST", "/leagues", { name: `Verify League ${Date.now()}`, type: "private", maxMembers: 20 });
const leagueId = r.data?.league?.id;
check("create league (invite code)", r.status === 201 && Boolean(r.data?.league?.inviteCode), `code=${r.data?.league?.inviteCode}`);

r = await call("GET", "/leaderboard");
check("leaderboard built", (r.data?.leaderboard?.length ?? 0) > 0, `entries=${r.data?.leaderboard?.length}`);

r = await call("POST", "/predictions", { matchId: 1, homeScore: 1, awayScore: 0 });
check("live match locked (409)", r.status === 409, `status=${r.status}`);

await call("POST", "/auth/logout");
cookie = "";
r = await call("GET", "/predictions");
check("unauth blocked (401)", r.status === 401, `status=${r.status}`);

r = await call("POST", "/auth/login", { email, password });
check("re-login from saved data", r.status === 200 && r.data?.user?.email === email);

// ---- Direct MongoDB inspection ----
const { User, Prediction, League } = await import("../models/index.js");
const userDoc = await User.findOne({ email });
const predDocs = await Prediction.find({ userId });
const leagueDoc = await League.findById(leagueId);

console.log("\n[verify] MongoDB documents created this run:");
console.log("  user:      ", userDoc ? `${userDoc.email} | hash:${userDoc.passwordHash ? "stored" : "none"} | role:${userDoc.role}` : "NOT FOUND");
console.log("  prediction:", predDocs[0] ? `match ${predDocs[0].matchId} ${predDocs[0].homeScore}-${predDocs[0].awayScore} double=${predDocs[0].double}` : "NOT FOUND");
console.log("  league:    ", leagueDoc ? `${leagueDoc.name} [${leagueDoc.type}] members=${leagueDoc.members.length}` : "NOT FOUND");

check("user persisted in Mongo", Boolean(userDoc) && userDoc.email === email);
check("password hashed (not plaintext)", userDoc?.passwordHash && userDoc.passwordHash !== password);
check("prediction persisted in Mongo", predDocs.length === 1);
check("league persisted in Mongo", Boolean(leagueDoc));

const totalUsers = await User.countDocuments();
const totalPreds = await Prediction.countDocuments();
const totalLeagues = await League.countDocuments();
console.log(`\n[verify] Atlas collection totals -> users:${totalUsers} predictions:${totalPreds} leagues:${totalLeagues}`);

// Cleanup this run's test documents (keep Atlas tidy).
if (userDoc) await User.deleteOne({ _id: userDoc._id });
await Prediction.deleteMany({ userId });
if (leagueDoc) await League.deleteOne({ _id: leagueDoc._id });
console.log("[verify] cleaned up test documents");

const passed = results.filter((x) => x.ok).length;
console.log(`\n[verify] ${passed}/${results.length} checks passed`);
process.exit(passed === results.length ? 0 : 1);
