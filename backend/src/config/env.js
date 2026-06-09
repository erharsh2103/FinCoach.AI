import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load backend/.env first (it wins for any shared keys), then fall back to the
// repo-root .env for keys not already set. dotenv does not override existing
// values, so the first file loaded takes precedence.
dotenv.config({
  path: resolve(__dirname, "../../.env") // backend/.env
});

dotenv.config({
  path: resolve(__dirname, "../../../.env") // repo-root .env
});

const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://127.0.0.1:5173",
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  smsProvider: process.env.SMS_PROVIDER || "",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",
  anthropicModel: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5"
};

if (env.nodeEnv === "production" && (!env.supabaseUrl || !env.supabaseServiceKey)) {
  throw new Error("Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

console.log(`📦 Environment: ${env.nodeEnv}`);
console.log(`🔗 Supabase: ${env.supabaseUrl ? env.supabaseUrl.replace(/^https?:\/\//, "") : "not configured"}`);

export default env;
