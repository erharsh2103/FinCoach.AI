// Quick MongoDB connectivity / credential check.
// Uses the exact same env resolution as the server, so a pass here means
// `npm run dev` will connect too.  Run with:  npm run db:check
import mongoose from "mongoose";
import env from "../src/config/env.js";

const masked = env.mongoUri.replace(/:\/\/([^:]+):([^@]+)@/, (_, user) => `://${user}:****@`);
console.log(`🔍 Testing MongoDB connection:\n   ${masked}\n`);

try {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log("✅ AUTH OK — MongoDB connection succeeded.");
  await mongoose.disconnect();
  process.exit(0);
} catch (error) {
  console.error(`❌ FAIL: ${error.message}\n`);
  if (/bad auth|authentication failed/i.test(error.message)) {
    console.error("   → Username/password rejected by Atlas.");
    console.error("     Reset the DB user's password in Atlas (Database Access → Edit → Edit Password → Update User),");
    console.error("     then update MONGODB_URI in backend/.env. Make sure the user's auth method is 'Password'");
    console.error("     and that it lives in the same Atlas project as the cluster.");
  } else if (/IP|whitelist|ENOTFOUND|querySrv|timed out|ECONNREFUSED|ServerSelection/i.test(error.message)) {
    console.error("   → Network/host issue (not credentials).");
    console.error("     Add your current IP under Atlas → Network Access, and verify the cluster host in the URI.");
  }
  process.exit(1);
}
