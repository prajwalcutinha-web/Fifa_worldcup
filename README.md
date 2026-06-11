# WC26 Predictor League 🏆

A FIFA World Cup 2026 fantasy prediction platform — *Predict. Compete. Win.*

This is a **full-stack web application**:

- **Frontend** — React 18 + Vite + Tailwind + Radix UI + Framer Motion (responsive: desktop **and** mobile)
- **Backend** — Node.js + Express secure REST API
- **Live data** — [TheSportsDB](https://www.thesportsdb.com) (free/open API) for live scores, with a web-scraping + seed fallback
- **Database** — MongoDB (Mongoose); falls back to a local JSON store when no `MONGODB_URI` is set
- **Cache** — Redis (ioredis) for leaderboard/live caching; falls back to in-memory when no `REDIS_URL`
- **Auth** — email/password (bcrypt) **and Google OAuth 2.0**, JWT sessions in httpOnly cookies

### Graceful degradation
Every external service is optional for local dev. With nothing configured the app
runs fully on the JSON store + in-memory cache + seed/scraped fixtures. Set the
matching env var to switch each subsystem on:

| Service | Enable with | Fallback when unset |
|---|---|---|
| MongoDB | `MONGODB_URI` | local JSON store (`server/data/store.json`) |
| Redis | `REDIS_URL` | in-process Map cache |
| Google OAuth | `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | email/password + demo picker |
| Live scores | `SPORTSDB_KEY` (default `3`) | scraper, then seed fixtures |

### Setting up Google OAuth
1. In Google Cloud Console create an OAuth 2.0 Client ID (type: Web application).
2. Authorized redirect URI: `http://localhost:4000/api/auth/google/callback` (and your prod URL).
3. Put the client id/secret in `server/.env`. Restart the server — the landing
   page's "Continue with Google" button then runs the real OAuth flow.

> **A note on "React Native":** React Native builds *native* iOS/Android apps and cannot render a website. This project is a **responsive React web app**, which is what satisfies the "desktop + mobile friendly" requirement and matches the existing design/codebase. The same Node.js backend can later power a separate Expo/React Native mobile app if you want a native install — that's a follow-on project, not a conversion.

---

## Project structure

```
fifa_Fun_app/
├── public/favicon.png          # FIFA trophy app icon
├── index.html
├── src/                        # Frontend
│   ├── app/
│   │   ├── App.tsx             # Session restore + routing
│   │   └── components/         # LandingPage, Dashboard, Fixtures, Leaderboard, ...
│   ├── lib/api.ts              # Typed API client (credentials: include)
│   └── styles/
├── vite.config.ts              # Dev server + /api proxy -> :4000
└── server/                     # Backend (Node.js + Express)
    ├── src/
    │   ├── index.js            # App entry + security middleware
    │   ├── config.js           # Env config (fails closed in prod)
    │   ├── db.js               # JSON datastore (swap for Postgres/SQLite later)
    │   ├── middleware/         # auth (JWT), validate (zod), errorHandler
    │   ├── routes/             # auth, fixtures, predictions, leaderboard, leagues, analytics
    │   ├── services/           # scraper (cheerio), scoring engine
    │   └── data/seed.js        # Teams + fallback fixtures
    └── .env.example
```

---

## Running locally

You need **Node.js 18+**. (A portable Node 22 was installed under
`%LOCALAPPDATA%\nodejs-portable` and added to your user PATH — open a new
terminal so `node`/`npm` resolve.)

### 1. Backend

```bash
cd server
npm install
copy .env.example .env      # then edit .env (set a strong JWT_SECRET!)
npm run dev                 # http://localhost:4000
```

### 2. Frontend (in a second terminal)

```bash
npm install
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173. Create an account with email + password (min 8 chars)
and you're in. The Fixtures page pulls live data via the scraper and shows a
status pill (🟢 live / 🟡 sample / ⚪ offline).

### Useful commands

```bash
cd server && npm run scrape   # run the scraper once and print the result
```

---

## Live data & web-scraping

`server/src/services/scraper.js` fetches a public football fixtures page with
`axios`, parses it with `cheerio`, caches results (default 60s), and **falls
back to seed fixtures** if scraping yields nothing — so the API never goes dark.

- Point it at any structured source via `SCRAPE_SOURCE_URL` in `.env`.
- It sends an identifying `User-Agent` and rate-limits itself through caching.

> ⚠️ **Legal/ToS note:** Before scraping any site in production, check its
> `robots.txt` and Terms of Service. Many sports sites prohibit automated
> access or render data client-side (JS), which simple HTML scraping can't read.
> The robust production path is an **official data API** (e.g. a licensed
> football data provider). The scraper here is built to swap in a different
> source or be replaced by an API client without touching the rest of the app.

---

## Security

| Concern | Mitigation |
|---|---|
| Password storage | bcrypt hashing (cost 12) — never plaintext |
| Sessions | JWT in **httpOnly**, `SameSite=Lax`, `Secure`-in-prod cookies (not readable by JS → XSS-resistant) |
| User enumeration | Constant-time-ish login (always runs a bcrypt compare) |
| Brute force | Strict rate limit on `/api/auth/*` (30 / 15 min) + global limit |
| Input validation | Zod schemas validate & sanitise every request body |
| HTTP headers | Helmet (CSP-friendly defaults, no sniffing, etc.) |
| CORS | Explicit origin allowlist + credentials |
| Payload abuse | 100 KB JSON body cap, 8 MB scrape cap, request timeouts |
| Prediction integrity | Server-side lock enforcement (can't predict live/finished matches) |
| Untrusted scraped data | Treated as untrusted input and normalised before use |
| Secret hygiene | App refuses to boot in production with the default `JWT_SECRET` |

### Before deploying to production
- Set a strong `JWT_SECRET` (`openssl rand -hex 32`) and `COOKIE_SECURE=true`.
- Serve over HTTPS behind a reverse proxy.
- Replace the JSON datastore (`server/src/db.js`) with PostgreSQL/SQLite.
- Add real OAuth (the "Continue with Google" button is currently a demo; wiring
  real Google OAuth needs a Google Cloud client ID/secret).

---

## API reference (brief)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | – | Create account, set session cookie |
| POST | `/api/auth/login` | – | Log in |
| GET | `/api/auth/google` | – | Begin Google OAuth redirect |
| GET | `/api/auth/google/callback` | – | OAuth callback → sets session, redirects to app |
| GET | `/api/auth/config` | – | Whether Google sign-in is enabled |
| POST | `/api/auth/logout` | – | Clear session |
| GET | `/api/auth/me` | ✅ | Current user |
| GET | `/api/fixtures` | – | Fixtures with live scores overlaid |
| GET | `/api/fixtures/live` | – | Live matches (TheSportsDB → scraper fallback) |
| GET/POST | `/api/predictions` | ✅ | List / upsert predictions |
| GET | `/api/leaderboard` | – | Ranked standings (cached) |
| GET/POST | `/api/leagues` | mixed | List / create leagues |
| POST | `/api/leagues/join` | ✅ | Join by id or invite code |
| GET | `/api/analytics` | ✅ | Personal prediction analytics |
