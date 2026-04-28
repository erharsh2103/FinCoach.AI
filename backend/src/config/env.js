import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({
  path: resolve(__dirname, "../../.env")
});

const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://127.0.0.1:5173",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/fincoach",
  smsProvider: process.env.SMS_PROVIDER || "",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "",
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || "",
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || ""
};

if (env.nodeEnv === "production" && !process.env.MONGODB_URI) {
  throw new Error("Missing required environment variable: MONGODB_URI");
}

export default env;
