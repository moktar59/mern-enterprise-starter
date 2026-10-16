import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";
import type { ExecutionContextFactory } from "../../execution-context/execution-context-factory.js";
import type { ExecutionContextScope } from "../../execution-context/execution-context-scope.js";

/** Establishes a server-owned execution context for each HTTP request. */
export function createExecutionContextMiddleware(
  factory: ExecutionContextFactory,
  scope: ExecutionContextScope
): RequestHandler {
  return (_request, response, next) => {
    const requestId = randomUUID();
    const correlationId = randomUUID();

    response.setHeader("X-Request-Id", requestId);

    const context = factory.create({
      source: "HTTP",
      requestId,
      correlationId
    });

    scope.run(context, () => next());
  };
}
