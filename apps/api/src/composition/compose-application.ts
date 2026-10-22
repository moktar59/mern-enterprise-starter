import type { Express } from "express";
import { loadConfig } from "../config.js";
import { DefaultExecutionContextFactory } from "../execution-context/execution-context-factory.js";
import { AsyncLocalStorageExecutionContextScope } from "../infrastructure/execution-context/async-local-storage-execution-context-scope.js";
import { createPinoLogger } from "../infrastructure/logging/pino-logger.js";
import { createExecutionContextMiddleware } from "../http/middleware/execution-context-middleware.js";
import { createApp } from "../app.js";
import type { Logger } from "../logging/logger.js";
import type { ItemRepository } from "../modules/items/item.repository.js";

export function composeApplication(itemRepository: ItemRepository, logger?: Logger): Express {
  const config = loadConfig();
  const contextFactory = new DefaultExecutionContextFactory();
  const contextScope = new AsyncLocalStorageExecutionContextScope();
  const applicationLogger = logger ?? createPinoLogger(config.logLevel);
  return createApp(
    createExecutionContextMiddleware(contextFactory, contextScope),
    itemRepository,
    applicationLogger,
    contextScope
  );
}
