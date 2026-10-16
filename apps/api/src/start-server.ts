import { createServer, type Server } from "node:http";
import { composeApplication } from "./composition/compose-application.js";
import { loadConfig } from "./config.js";
import {
  createApplicationLifecycle,
  registerShutdownSignals,
  type ApplicationLifecycle
} from "./lifecycle/graceful-shutdown.js";

export type ConfigureApplicationLifecycle = (lifecycle: ApplicationLifecycle) => void;

/** Validates configuration and lifecycle resources before opening the listener. */
export function startServer(
  env?: NodeJS.ProcessEnv,
  configureLifecycle?: ConfigureApplicationLifecycle
): Server {
  const config = loadConfig(env);
  const app = composeApplication();
  const server = createServer(app);
  const lifecycle = createApplicationLifecycle(server);

  try {
    configureLifecycle?.(lifecycle);
  } catch (error) {
    void lifecycle.shutdown();
    throw error;
  }

  server.once("listening", () => {
    console.info(`API listening at http://${config.host}:${config.port}`);
    registerShutdownSignals(lifecycle);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    console.error("API failed to start or encountered a server error.", error.message);
    process.exitCode = 1;
    void lifecycle.shutdown();
  });

  try {
    server.listen(config.port, config.host);
  } catch (error) {
    void lifecycle.shutdown();
    throw error;
  }

  return server;
}
