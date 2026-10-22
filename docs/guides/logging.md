# Application Logging

## Architecture

The API uses an application-owned `Logger` contract. The Pino adapter lives in infrastructure and is created at the composition/startup boundary. Application and business modules must not import Pino or construct global loggers.

Logs are structured JSON written to standard output. The configured level is controlled by `LOG_LEVEL`.

| Environment | Default level |
| --- | --- |
| development | `debug` |
| test | `silent` |
| production | `info` |

Supported values: `trace`, `debug`, `info`, `warn`, `error`, `fatal`, and `silent`. Invalid values fail configuration validation before database connection or listener startup.

## HTTP request events

The HTTP logging middleware emits one completion event per request. It records the server-generated request ID, correlation ID, HTTP method, route template when available, status code, and duration in milliseconds. Liveness checks are logged at debug level. HTTP 4xx responses use warning severity and 5xx responses use error severity.

Do not log raw URLs or query strings, request/response bodies, cookies, authorization headers, access tokens, or other secrets. Never use a client-provided request ID as the authoritative server request ID. Unknown routes may not have a route template; do not substitute the raw URL.

## Error and lifecycle events

Unexpected errors are logged internally with diagnostic context while public HTTP responses remain sanitized and retain the established RFC 9457 error contract. Startup, database readiness, shutdown, and cleanup failures are structured events. Logging failures must never replace the original application error or prevent cleanup.

## Scope

This foundation does not provide metrics, distributed tracing, dashboards, alerting, or log aggregation. Those concerns remain separate roadmap capabilities.
