import { Router } from "express";
import bcrypt from "bcryptjs";
import axios from "axios";
import { z } from "zod";
import { nanoid } from "nanoid";
import { config } from "../config.js";
import { store } from "../store/index.js";
import { validate } from "../middleware/validate.js";
import {
  signToken,
  setAuthCookie,
  clearAuthCookie,
  requireAuth,
} from "../middleware/auth.js";

const router = Router();

const credentials = z.object({
  name: z.string().trim().min(2).max(40).optional(),
  email: z.string().trim().toLowerCase().email().max(120),
  password: z.string().min(8).max(128),
});

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, avatar: u.avatar, role: u.role };
}

function avatarFor(seed) {
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}`;
}

// ---- Email/password register ----
router.post("/register", validate(credentials), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (await store.users.findByEmail(email)) {
      return res.status(409).json({ error: "An account with that email already exists" });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await store.users.create({
      name: name ?? email.split("@")[0],
      email,
      avatar: avatarFor(name ?? email),
      passwordHash,
    });
    setAuthCookie(res, signToken(user));
    res.status(201).json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// ---- Email/password login ----
router.post("/login", validate(credentials), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await store.users.findByEmail(email);
    // Constant-ish time compare to reduce user enumeration.
    const hash = user?.passwordHash ?? "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinv";
    const ok = await bcrypt.compare(password, hash);
    if (!user || !user.passwordHash || !ok) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    await store.users.update(user.id, { lastLogin: new Date() });
    setAuthCookie(res, signToken(user));
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", (req, res) => {
  clearAuthCookie(res);
  res.json({ ok: true });
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await store.users.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// =================== Google OAuth 2.0 (authorization code flow) ===================

const googleEnabled = () => Boolean(config.google.clientId && config.google.clientSecret);

// Step 1: redirect the user to Google's consent screen.
router.get("/google", (req, res) => {
  if (!googleEnabled()) {
    return res.status(503).json({ error: "Google sign-in is not configured on this server" });
  }
  const state = nanoid(24);
  // Short-lived, httpOnly cookie used to validate the callback (CSRF protection).
  res.cookie("oauth_state", state, {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: "lax",
    maxAge: 10 * 60 * 1000,
    path: "/api/auth/google",
  });
  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "offline",
    prompt: "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// Step 2: Google redirects back here with ?code & ?state.
router.get("/google/callback", async (req, res, next) => {
  try {
    if (!googleEnabled()) return res.status(503).send("Google sign-in not configured");
    const { code, state } = req.query;
    if (!code || !state || state !== req.cookies?.oauth_state) {
      return res.redirect(`${config.frontendUrl}/?auth_error=invalid_state`);
    }
    res.clearCookie("oauth_state", { path: "/api/auth/google" });

    // Exchange the authorization code for tokens.
    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code: String(code),
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.callbackUrl,
        grant_type: "authorization_code",
      }).toString(),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" }, timeout: 10000 }
    );

    // Fetch the verified Google profile.
    const profileRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenRes.data.access_token}` },
      timeout: 10000,
    });
    const p = profileRes.data; // { sub, email, name, picture, ... }

    // Upsert user: match by googleId, else by email, else create (signup).
    let user =
      (await store.users.findByGoogleId(p.sub)) || (await store.users.findByEmail(p.email));
    let isNewSignup = false;
    if (user) {
      user = await store.users.update(user.id, {
        googleId: p.sub,
        avatar: p.picture ?? user.avatar,
        lastLogin: new Date(),
      });
    } else {
      isNewSignup = true;
      user = await store.users.create({
        googleId: p.sub,
        email: String(p.email).toLowerCase(),
        name: p.name ?? p.email,
        avatar: p.picture ?? avatarFor(p.name ?? p.email),
        passwordHash: null,
      });
    }

    setAuthCookie(res, signToken(user));
    // Signal a fresh signup so the app can show onboarding/welcome.
    res.redirect(`${config.frontendUrl}/?signin=google${isNewSignup ? "&welcome=1" : ""}`);
  } catch (err) {
    console.error("[google-oauth]", err.response?.data ?? err.message);
    res.redirect(`${config.frontendUrl}/?auth_error=oauth_failed`);
  }
});

// Lets the frontend know whether to show the Google button.
router.get("/config", (req, res) => {
  res.json({ google: googleEnabled() });
});

export default router;
