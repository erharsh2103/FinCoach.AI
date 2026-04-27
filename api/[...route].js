import app from "../backend/src/app.js";
import { bootstrapBackend } from "../backend/src/bootstrap.js";

export default async function handler(req, res) {
  await bootstrapBackend();
  return app(req, res);
}
