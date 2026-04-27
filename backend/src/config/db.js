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

  await mongoose.connect(env.mongoUri, {
    autoIndex: true
  });

  console.log("MongoDB connected");
}
