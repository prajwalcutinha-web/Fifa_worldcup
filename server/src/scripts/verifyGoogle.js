// Verifies the Google OAuth WIRING (not a real Google login, which needs real
// credentials). Boots the app with test client id/secret and confirms:
//  1) /api/auth/config reports google:true
//  2) /api/auth/google issues a 302 to Google's consent screen with correct params
//  3) a state cookie is set (CSRF protection)

process.env.GOOGLE_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
process.env.GOOGLE_CLIENT_SECRET = "test-secret";
process.env.GOOGLE_CALLBACK_URL = "http://localhost:4300/api/auth/google/callback";
process.env.MONGODB_URI = ""; // use JSON fallback; we're only testing the redirect
process.env.PORT = "4300";
process.env.JWT_SECRET = "verify-google-secret";

await import("../index.js");
await new Promise((r) => setTimeout(r, 1200));

const results = [];
const check = (n, ok, d = "") => { results.push(ok); console.log(`${ok ? "PASS" : "FAIL"}  ${n}${d ? " — " + d : ""}`); };

const cfg = await (await fetch("http://localhost:4300/api/auth/config")).json();
check("/auth/config reports google enabled", cfg.google === true, `google=${cfg.google}`);

const res = await fetch("http://localhost:4300/api/auth/google", { redirect: "manual" });
const loc = res.headers.get("location") || "";
const setCookie = res.headers.get("set-cookie") || "";
check("/auth/google returns 302 redirect", res.status === 302, `status=${res.status}`);
check("redirects to Google consent", loc.startsWith("https://accounts.google.com/o/oauth2/v2/auth"), loc.slice(0, 60) + "...");
check("includes client_id", loc.includes("test-client-id"), "");
check("requests openid+email+profile scope", /scope=openid(\+|%20)email(\+|%20)profile/.test(loc), "");
check("sets CSRF state cookie", setCookie.includes("oauth_state"), "");

const passed = results.filter(Boolean).length;
console.log(`\n[verify-google] ${passed}/${results.length} wiring checks passed`);
process.exit(passed === results.length ? 0 : 1);
