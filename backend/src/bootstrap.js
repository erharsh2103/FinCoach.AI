import { connectDatabase } from "./config/db.js";
import { ensureWorkspaceByPhone } from "./services/workspace.service.js";

let bootPromise;

export function bootstrapBackend() {
  if (!bootPromise) {
    bootPromise = (async () => {
      await connectDatabase();
      await ensureWorkspaceByPhone();
    })().catch(error => {
      bootPromise = undefined;
      throw error;
    });
  }

  return bootPromise;
}
