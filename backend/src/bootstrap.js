import { connectDatabase } from "./config/db.js";

let bootPromise;

export function bootstrapBackend() {
  if (!bootPromise) {
    bootPromise = (async () => {
      await connectDatabase();
    })().catch(error => {
      bootPromise = undefined;
      throw error;
    });
  }

  return bootPromise;
}
