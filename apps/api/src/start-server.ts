import { createServer, type Server } from "node:http";
import { composeApplication } from "./composition/compose-application.js";
import { loadConfig } from "./config.js";
import { connectDatabase } from "./infrastructure/database/connect-database.js";
import { MongooseItemRepository } from "./infrastructure/items/mongoose-item.repository.js";
import { createApplicationLifecycle, registerShutdownSignals, type ApplicationLifecycle } from "./lifecycle/graceful-shutdown.js";
export type ConfigureApplicationLifecycle = (lifecycle: ApplicationLifecycle) => void;

/** Database readiness is a startup prerequisite; the listener opens only after connection succeeds. */
export async function startServer(env?: NodeJS.ProcessEnv, configureLifecycle?: ConfigureApplicationLifecycle): Promise<Server> {
  const config = loadConfig(env);
  const database = await connectDatabase(config.mongoUri);
  const server = createServer(composeApplication(new MongooseItemRepository()));
  const lifecycle = createApplicationLifecycle(server);
  lifecycle.registerCleanup(() => database.disconnect());
  try { configureLifecycle?.(lifecycle); }
  catch (error) { await lifecycle.shutdown(); throw error; }

  server.once("listening", () => {
    console.info(`API listening at http://${config.host}:${config.port}`);
    registerShutdownSignals(lifecycle);
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
    await lifecycle.shutdown();
    throw error;
  }
  return server;
}
