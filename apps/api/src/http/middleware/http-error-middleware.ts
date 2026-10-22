import { STATUS_CODES } from "node:http";
import type { ErrorRequestHandler, RequestHandler, Response } from "express";
import { ApplicationError } from "../../errors/application-error.js";
import type { Logger } from "../../logging/logger.js";
import type { ExecutionContextScope } from "../../execution-context/execution-context-scope.js";

interface ProblemDetails {
  readonly type: "about:blank";
  readonly title: string;
  readonly status: number;
  readonly code: string;
  readonly requestId: string;
  readonly errors?: readonly { readonly field: string; readonly code: string }[];
}

function sendProblem(
  response: Response,
  status: number,
  code: string,
  errors?: readonly { readonly field: string; readonly code: string }[]
): void {
  const requestIdValue = response.getHeader("X-Request-Id");
  const requestId = typeof requestIdValue === "string" ? requestIdValue : "unavailable";
  const problem: ProblemDetails = {
    type: "about:blank",
    title: status === 422 ? "Unprocessable Content" : (STATUS_CODES[status] ?? "Internal Server Error"),
    status,
    code,
    requestId,
    ...(errors?.length ? { errors } : {})
  };
  response.status(status).type("application/problem+json").json(problem);
}

/** Handles requests that do not match a registered route. */
export const notFoundHandler: RequestHandler = (_request, response) => {
  sendProblem(response, 404, "ROUTE_NOT_FOUND");
};

/** Returns the supported methods for a recognized endpoint. */
export const methodNotAllowedHandler: RequestHandler = (_request, response) => {
  response.setHeader("Allow", "GET, HEAD");
  sendProblem(response, 405, "METHOD_NOT_ALLOWED");
};

/** Final HTTP boundary: translate known failures and sanitize all unknown errors. */
export function createHttpErrorHandler(logger?: Logger, contextScope?: ExecutionContextScope): ErrorRequestHandler {
  return (error: unknown, _request, response, next) => {
    if (response.headersSent) return next(error);

    if (error instanceof ApplicationError && error.code === "VALIDATION_FAILED") {
      sendProblem(response, 422, "VALIDATION_FAILED", error.errors);
      return;
    }
    if (isMalformedRequest(error)) {
      sendProblem(response, 400, "MALFORMED_REQUEST");
      return;
    }

    if (logger) {
      const context = contextScope?.current();
      try {
        logger.error({
          requestId: context?.requestId ?? response.getHeader("X-Request-Id"),
          correlationId: context?.correlationId,
          errorName: error instanceof Error ? error.name : "UnknownError",
          ...(error instanceof Error && error.stack ? { stack: error.stack } : {})
        }, "Unhandled HTTP error");
      } catch {
        // Logging must never interfere with the public error boundary.
      }
    }
    // Never serialize exception messages, stack traces, or arbitrary error properties.
    sendProblem(response, 500, "INTERNAL_ERROR");
  };
}

/** Backward-compatible default handler for isolated tests and consumers. */
export const httpErrorHandler: ErrorRequestHandler = createHttpErrorHandler();

function isMalformedRequest(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { status?: unknown; type?: unknown };
  return candidate.status === 400 && candidate.type === "entity.parse.failed";
}
