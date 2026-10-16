import { STATUS_CODES } from "node:http";
import type { ErrorRequestHandler, RequestHandler, Response } from "express";
import { ApplicationError } from "../../errors/application-error.js";

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
    title: STATUS_CODES[status] ?? "Internal Server Error",
    status,
    code,
    requestId,
    ...(errors?.length ? { errors } : {})
  };

  response
    .status(status)
    .type("application/problem+json")
    .json(problem);
}

/** Handles requests that do not match a registered route. */
export const notFoundHandler: RequestHandler = (_request, response) => {
  sendProblem(response, 404, "ROUTE_NOT_FOUND");
};

/** Final HTTP boundary: translate known failures and sanitize all unknown errors. */
export const httpErrorHandler: ErrorRequestHandler = (error: unknown, _request, response, _next) => {
  if (response.headersSent) {
    // Delegate to Express's default handler so it can close a partially-written response.
    return _next(error);
  }

  if (error instanceof ApplicationError && error.code === "VALIDATION_FAILED") {
    sendProblem(response, 422, "VALIDATION_FAILED", error.errors);
    return;
  }

  if (isMalformedRequest(error)) {
    sendProblem(response, 400, "MALFORMED_REQUEST");
    return;
  }

  // Never serialize exception messages, stack traces, or arbitrary error properties.
  sendProblem(response, 500, "INTERNAL_ERROR");
};

function isMalformedRequest(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { status?: unknown; type?: unknown };
  return candidate.status === 400 && candidate.type === "entity.parse.failed";
}
