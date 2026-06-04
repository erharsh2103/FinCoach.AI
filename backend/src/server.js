import app from "./app.js";
import env from "./config/env.js";
import { bootstrapBackend } from "./bootstrap.js";

async function startServer() {
  await bootstrapBackend();

  const server = app.listen(env.port, () => {
    console.log(`FinCoach backend running at http://localhost:${env.port}`);
  });

  // Graceful shutdown — releases the port before nodemon restarts the process.
  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  server.on("error", error => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${env.port} is already in use. Kill the process holding it, then restart.`);
    } else {
      console.error(error);
    }
    process.exit(1);
  });
}

startServer().catch(error => {
  console.error("Failed to start backend");
  console.error(error);
  process.exit(1);
});
