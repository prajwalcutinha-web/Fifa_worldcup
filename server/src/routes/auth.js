import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
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

// ---- Email/password register (signup) ----
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

export default router;
