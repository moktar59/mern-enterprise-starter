import type { Server } from "node:http";
import { composeApplication } from "./composition/compose-application.js";
import { loadConfig } from "./config.js";
import { createApplicationLifecycle, registerShutdownSignals } from "./lifecycle/graceful-shutdown.js";

/** Validates configuration before composing the app or opening a listener. */
export function startServer(env?: NodeJS.ProcessEnv): Server {
  const config = loadConfig(env);
  const app = composeApplication();
  const server = app.listen(config.port, config.host);
  const lifecycle = createApplicationLifecycle(server);

  server.once("listening", () => {
    console.info(`API listening at http://${config.host}:${config.port}`);
    registerShutdownSignals(lifecycle);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    console.error("API failed to start or encountered a server error.", error.message);
    process.exitCode = 1;
    if (server.listening) void lifecycle.shutdown();
  });

  return server;
}
