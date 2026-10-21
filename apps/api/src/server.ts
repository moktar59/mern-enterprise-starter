import { startServer } from "./start-server.js";
startServer().catch((error: unknown) => {
  console.error("API startup failed.", error instanceof Error ? error.message : "Unknown startup error");
  process.exitCode = 1;
});
