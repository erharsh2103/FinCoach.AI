import { createClient } from "@supabase/supabase-js";
import { WebSocket as NodeWebSocket } from "ws";
import env from "./env.js";

// supabase-js eagerly creates a Realtime client that needs a global WebSocket.
// Node < 22 has none, so polyfill it (we never use realtime). On Node 22+/Render
// the global already exists, so this is a no-op there.
if (typeof globalThis.WebSocket === "undefined") {
  globalThis.WebSocket = NodeWebSocket;
}

// Server-side Supabase client using the service-role key (bypasses RLS).
export const supabase =
  env.supabaseUrl && env.supabaseServiceKey
    ? createClient(env.supabaseUrl, env.supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      })
    : null;

export async function connectDatabase() {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment."
    );
  }

  // Lightweight connectivity + schema check: hit the users table.
  const { error } = await supabase.from("users").select("id").limit(1);
  if (error) {
    console.error("\n❌ Supabase connection / schema check failed.");
    console.error(`   ${error.message}`);
    console.error("   • Did you run backend/supabase-schema.sql in the Supabase SQL editor?");
    console.error("   • Are SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY correct (service_role key)?\n");
    throw error;
  }

  console.log("Supabase connected");
}
