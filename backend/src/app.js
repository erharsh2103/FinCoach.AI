import express from "express";
import cors from "cors";
import env from "./config/env.js";
import routes from "./routes/index.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";

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

app.use(routes);
app.use(notFound);
app.use(errorHandler);

export default app;
