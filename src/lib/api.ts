// Frontend API client for the WC26 Predictor backend.
// All requests use `credentials: "include"` so the httpOnly session cookie is
// sent automatically. In dev, Vite proxies /api -> http://localhost:4000.

const BASE = import.meta.env.VITE_API_URL ?? "/api";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Match {
  id: number;
  home: string; homeCode: string; homeFlag: string;
  away: string; awayCode: string; awayFlag: string;
  time: string; date: string; stadium: string; city: string;
  group: string; matchday: number;
  state: "no-prediction" | "predicted" | "double" | "locked" | "live" | "finished" | "upcoming";
  prediction?: string;
  score?: string;
  pts?: number;
  minute?: number;
  kickoff?: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  points: number;
  rank: number;
  movement: number;
  isUser: boolean;
}

class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? res.statusText, data?.details);
  }
  return data as T;
}

export const api = {
  // --- Auth ---
  register: (body: { name?: string; email: string; password: string }) =>
    request<{ user: User }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<{ ok: boolean }>("/auth/logout", { method: "POST" }),
  me: () => request<{ user: User }>("/auth/me"),

  // --- Fixtures (scraped live data) ---
  fixtures: (refresh = false) =>
    request<{ fixtures: Match[]; source: string; cached: boolean }>(
      `/fixtures${refresh ? "?refresh=true" : ""}`
    ),
  liveFixtures: () => request<{ fixtures: Match[]; source: string }>("/fixtures/live"),

  // --- Predictions ---
  myPredictions: () => request<{ predictions: any[] }>("/predictions"),
  submitPrediction: (body: {
    matchId: number; homeScore: number; awayScore: number;
    firstTeam?: "home" | "away" | "none"; firstPlayer?: string; double?: boolean;
  }) => request<{ prediction: any }>("/predictions", { method: "POST", body: JSON.stringify(body) }),

  // --- Leaderboard ---
  leaderboard: () => request<{ leaderboard: LeaderboardEntry[] }>("/leaderboard"),

  // --- Leagues ---
  leagues: () => request<{ leagues: any[] }>("/leagues"),
  createLeague: (body: { name: string; type: "public" | "private"; maxMembers?: number }) =>
    request<{ league: any }>("/leagues", { method: "POST", body: JSON.stringify(body) }),
  joinLeague: (body: { leagueId?: string; inviteCode?: string }) =>
    request<{ league: any }>("/leagues/join", { method: "POST", body: JSON.stringify(body) }),

  // --- Analytics ---
  analytics: () => request<any>("/analytics"),
};

export { ApiError };
