// Quick Razorpay credential check. Uses the same env + client the server uses,
// then asks Razorpay to create a tiny TEST order (₹1) to prove the key/secret pair.
// Test-mode keys (rzp_test_*) create throwaway orders with no real money. Run with:
//   npm run razorpay:check
import env from "../src/config/env.js";
import { getRazorpayClient } from "../src/config/razorpay.js";

const keyPreview = env.razorpayKeyId ? `${env.razorpayKeyId.slice(0, 12)}…` : "(empty)";
console.log(`🔍 Testing Razorpay key: ${keyPreview}  secret: ${env.razorpayKeySecret ? "set" : "(empty)"}\n`);

try {
  const razorpay = getRazorpayClient();
  const order = await razorpay.orders.create({ amount: 100, currency: "INR", receipt: `check_${Date.now()}` });
  console.log(`✅ RAZORPAY OK — created test order ${order.id} (${order.amount / 100} ${order.currency}). Keys are valid.`);
  process.exit(0);
} catch (error) {
  const description = error?.error?.description || error?.message || String(error);
  const statusCode = error?.statusCode ? ` [HTTP ${error.statusCode}]` : "";
  console.error(`❌ FAIL${statusCode}: ${description}\n`);
  if (/not configured/i.test(description)) {
    console.error("   → backend/.env is missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET (remember: nodemon does not reload .env — restart the server).");
  } else if (/authentication|unauthor|key|invalid/i.test(description)) {
    console.error("   → Key/secret rejected. Copy both from Razorpay Dashboard → Settings → API Keys (test mode). They must be from the SAME key pair.");
  }
  process.exit(1);
}
