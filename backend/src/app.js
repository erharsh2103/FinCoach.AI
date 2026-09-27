import express from "express";
import cors from "cors";
import env from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { supabase } from "./config/db.js";

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

// Separate from /api/health (Render's health check) so a Supabase hiccup
// doesn't make Render think the whole service is down. Used by an external
// keep-alive pinger to stop the Supabase free-tier project from auto-pausing.
app.get("/api/health/db", async (_req, res) => {
  if (!supabase) {
    return res.status(503).json({ ok: false, error: "Supabase not configured" });
  }
  const { error } = await supabase.from("users").select("id").limit(1);
  if (error) {
    return res.status(503).json({ ok: false, error: error.message });
  }
  res.status(200).json({ ok: true });
});

app.use(routes);
app.use(notFound);
app.use(errorHandler);

export default app;
