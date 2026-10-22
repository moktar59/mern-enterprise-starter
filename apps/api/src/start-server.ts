import { createServer, type Server } from "node:http";
import { composeApplication } from "./composition/compose-application.js";
import { loadConfig } from "./config.js";
import { createPinoLogger } from "./infrastructure/logging/pino-logger.js";
import { connectDatabase } from "./infrastructure/database/connect-database.js";
import { MongooseItemRepository } from "./infrastructure/items/mongoose-item.repository.js";
import { createApplicationLifecycle, registerShutdownSignals, type ApplicationLifecycle } from "./lifecycle/graceful-shutdown.js";
export type ConfigureApplicationLifecycle = (lifecycle: ApplicationLifecycle) => void;

function safelyLog(operation: () => void): void {
  try { operation(); } catch { /* Logging must not change application behavior. */ }
}

/** Database readiness is a startup prerequisite; the listener opens only after connection succeeds. */
export async function startServer(env?: NodeJS.ProcessEnv, configureLifecycle?: ConfigureApplicationLifecycle): Promise<Server> {
  const config = loadConfig(env);
  const logger = createPinoLogger(config.logLevel);
  let database: Awaited<ReturnType<typeof connectDatabase>>;
  try {
    safelyLog(() => logger.info({ event: "startup.started", nodeEnv: config.nodeEnv }, "Application startup started"));
    database = await connectDatabase(config.mongoUri);
    safelyLog(() => logger.info({}, "Database connection ready"));
  } catch (error) {
    try {
      logger.error({ event: "startup.database_failed", errorName: error instanceof Error ? error.name : "UnknownError" }, "Application startup failed during database readiness");
    } catch { /* Logging must not replace the startup error. */ }
    throw error;
  }

  const server = createServer(composeApplication(new MongooseItemRepository(), logger));
  const lifecycle = createApplicationLifecycle(server, {
    onError: (error) => {
      try {
        logger.error({
          event: "lifecycle.cleanup_failed",
          errorName: error instanceof Error ? error.name : "UnknownError",
          ...(error instanceof Error && error.stack ? { stack: error.stack.split("\n").slice(1).join("\n") } : {})
        }, "Application lifecycle cleanup failed");
      } catch { /* A logger failure must not interrupt remaining cleanup. */ }
    },
    onStart: () => safelyLog(() => logger.info({ event: "shutdown.started" }, "Application shutdown started")),
    onComplete: () => safelyLog(() => logger.info({ event: "shutdown.completed" }, "Application shutdown completed"))
  });
  lifecycle.registerCleanup(() => database.disconnect());
  try { configureLifecycle?.(lifecycle); }
  catch (error) { await lifecycle.shutdown(); throw error; }

  server.once("listening", () => {
    safelyLog(() => logger.info({ event: "startup.listening", host: config.host, port: config.port }, "API listening"));
    registerShutdownSignals(lifecycle, process, (error) => {
      try {
        logger.error({
          event: "shutdown.failed",
          errorName: error instanceof Error ? error.name : "UnknownError",
          ...(error instanceof Error && error.stack ? { stack: error.stack.split("\n").slice(1).join("\n") } : {})
        }, "Graceful shutdown failed");
      } catch { /* Avoid recursive logging failures. */ }
    });
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error) => { server.removeListener("listening", onListening); reject(error); };
      const onListening = () => { server.removeListener("error", onError); resolve(); };
      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(config.port, config.host);
    });
  } catch (error) {
    try {
      logger.error({ event: "startup.listener_failed", errorName: error instanceof Error ? error.name : "UnknownError" }, "Application failed to start HTTP listener");
    } catch { /* Preserve the original startup failure. */ }
    await lifecycle.shutdown();
    throw error;
  }
  return server;
}
