import { performance } from "node:perf_hooks";
import type { RequestHandler } from "express";
import type { Logger } from "../../logging/logger.js";
import type { ExecutionContextScope } from "../../execution-context/execution-context-scope.js";

/** Emits one completion event per request without recording URLs, payloads, or credentials. */
export function createRequestLoggingMiddleware(logger: Logger, contextScope: ExecutionContextScope): RequestHandler {
  return (request, response, next) => {
    const startedAt = performance.now();
    response.once("finish", () => {
      const context = contextScope.current();
      const routePath = request.route?.path;
      const route = typeof routePath === "string"
        ? `${request.baseUrl}${routePath}` || "/"
        : undefined;
      const statusCode = response.statusCode;
      const fields = {
        requestId: context?.requestId ?? response.getHeader("X-Request-Id"),
        correlationId: context?.correlationId,
        method: request.method,
        ...(route ? { route } : {}),
        statusCode,
        durationMs: Math.round((performance.now() - startedAt) * 100) / 100
      };
      const message = "HTTP request completed";
      try {
        if (route === "/health/live" || request.path === "/health/live") {
          logger.debug(fields, message);
        } else if (statusCode >= 500) {
          logger.error(fields, message);
        } else if (statusCode >= 400) {
          logger.warn(fields, message);
        } else {
          logger.info(fields, message);
        }
      } catch {
        // Request completion must not be disrupted by a logging failure.
      }
    });
    next();
  };
}
