import app from "./app.js";
import env from "./config/env.js";
import { bootstrapBackend } from "./bootstrap.js";

async function startServer() {
  await bootstrapBackend();

  app.listen(env.port, () => {
    console.log(`FinCoach backend running at http://localhost:${env.port}`);
  });
}

startServer().catch(error => {
  console.error("Failed to start backend");
  console.error(error);
  process.exit(1);
});
