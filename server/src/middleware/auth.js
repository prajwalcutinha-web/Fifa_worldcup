import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, name: user.name, email: user.email },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

export function setAuthCookie(res, token) {
  res.cookie(config.cookie.name, token, {
    httpOnly: true, // not readable by JS -> mitigates XSS token theft
    secure: config.cookie.secure, // HTTPS only in prod
    sameSite: "lax", // CSRF mitigation for top-level navigations
    maxAge: config.cookie.maxAge,
    path: "/",
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(config.cookie.name, { path: "/" });
}

// Verifies the session cookie (or Bearer token) and attaches req.user.
export function requireAuth(req, res, next) {
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice(7)
    : null;
  const token = req.cookies?.[config.cookie.name] ?? bearer;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    req.user = { id: payload.sub, name: payload.name, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}
