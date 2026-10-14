import type { Server } from "node:http";
import { createApp } from "./app.js";
import { loadConfig } from "./config.js";

/** Validates configuration before constructing the app or opening a listener. */
export function startServer(env?: NodeJS.ProcessEnv): Server {
  const config = loadConfig(env);
  const app = createApp();

  const server = app.listen(config.port, config.host, () => {
    console.info(`API listening at http://${config.host}:${config.port}`);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    console.error("API failed to start.", error.message);
    process.exitCode = 1;
  });

  return server;
}
