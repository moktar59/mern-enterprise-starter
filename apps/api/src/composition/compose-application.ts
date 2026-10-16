import type { Express } from "express";
import { DefaultExecutionContextFactory } from "../execution-context/execution-context-factory.js";
import { AsyncLocalStorageExecutionContextScope } from "../infrastructure/execution-context/async-local-storage-execution-context-scope.js";
import { createExecutionContextMiddleware } from "../http/middleware/execution-context-middleware.js";
import { createApp } from "../app.js";

/**
 * Constructs the HTTP application and its dependencies.
 * This function must not open a network listener or start the process.
 */
export function composeApplication(): Express {
  const contextFactory = new DefaultExecutionContextFactory();
  const contextScope = new AsyncLocalStorageExecutionContextScope();
  const executionContextMiddleware = createExecutionContextMiddleware(
    contextFactory,
    contextScope
  );

  return createApp(executionContextMiddleware);
}
