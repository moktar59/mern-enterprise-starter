import type { Express } from "express";
import { DefaultExecutionContextFactory } from "../execution-context/execution-context-factory.js";
import { AsyncLocalStorageExecutionContextScope } from "../infrastructure/execution-context/async-local-storage-execution-context-scope.js";
import { createExecutionContextMiddleware } from "../http/middleware/execution-context-middleware.js";
import { createApp } from "../app.js";
import type { ItemRepository } from "../modules/items/item.repository.js";
export function composeApplication(itemRepository: ItemRepository): Express {
  const contextFactory = new DefaultExecutionContextFactory();
  const contextScope = new AsyncLocalStorageExecutionContextScope();
  const middleware = createExecutionContextMiddleware(contextFactory, contextScope);
  return createApp(middleware, itemRepository);
}
