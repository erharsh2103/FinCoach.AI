import mongoose from "mongoose";
import env from "./env.js";

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (mongoose.connection.readyState === 2) {
    return mongoose.connection.asPromise();
  }

  mongoose.set("strictQuery", true);

  try {
    await mongoose.connect(env.mongoUri, {
      autoIndex: true,
      serverSelectionTimeoutMS: 8000
    });
    console.log("MongoDB connected");
  } catch (error) {
    const safeUri = env.mongoUri.replace(/\/\/([^:]*):([^@]*)@/, "//$1:****@");
    console.error("\n❌ MongoDB connection failed.");
    console.error(`   URI: ${safeUri}`);
    console.error("   • Local Docker: make sure the container is up → docker start fincoach-mongo");
    console.error("   • Atlas: check Network Access (allow 0.0.0.0/0) and that the cluster isn't paused.");
    console.error(`   Reason: ${String(error.message).split("\n")[0]}\n`);
    throw error;
  }
}
