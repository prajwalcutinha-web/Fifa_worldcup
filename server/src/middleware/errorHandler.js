import { config } from "../config.js";

// 404 for unknown routes.
export function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

// Centralised error handler. Never leak stack traces to clients in production.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;
  if (status >= 500) {
    console.error("[error]", err);
  }
  res.status(status).json({
    error: status >= 500 && config.isProd ? "Internal server error" : err.message,
  });
}
