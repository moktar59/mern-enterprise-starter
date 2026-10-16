# Phase 2 — Core Backend Scope and Acceptance Criteria

## Purpose

Build a minimal, runnable, extensible backend foundation that can start successfully, serve a real HTTP request, return a real response, handle HTTP errors safely and consistently, and shut down gracefully.

Phase 2 delivers a complete foundation for the capabilities included in this phase. It does not claim that the application is fully production-ready, and it does not implement capabilities assigned to later phases.

## Scope Boundaries

### Included

- Node.js 24 runtime, independently managed application packages using npm, native ESM, TypeScript, and Express 5. Each application owns its package manifest, dependencies, scripts, and lockfile; no root npm workspace or shared runtime package is used.
- Reproducible dependency installation through a committed npm lockfile.
- Development execution and compiled JavaScript production execution.
- Configuration loading, parsing, normalization, validation, and runtime immutability.
- Explicit application composition and deterministic startup.
- The HTTP adapter as the first supported transport adapter.
- A working dummy endpoint and a liveness endpoint.
- HTTP request execution-context establishment and isolation.
- A centralized HTTP error boundary and a documented public error-response contract.
- Safe handling of malformed requests, validation failures, unknown routes, and unexpected failures.
- Bounded graceful shutdown and lifecycle-owned cleanup.
- Focused automated checks using Node.js's built-in test runner.
- Documentation for setup, configuration, development, build, test, production startup, and shutdown.

### Excluded

- MongoDB, Redis, Docker, or any external infrastructure dependency.
- Authentication, authorization, business modules, and feature-specific business-error catalogs.
- Queue, scheduled-job, CLI, event-consumer, or other non-HTTP adapters.
- Logging frameworks, metrics, tracing, monitoring, dashboards, or observability pipelines.
- Comprehensive API design conventions such as success-response envelopes, pagination, resource naming, and the complete validation strategy. These remain in Phase 3.
- Full production-readiness claims.

## Accepted Runtime and Toolchain

- **Runtime:** Node.js 24.
- **Package management:** independently managed applications using npm. Each application owns its package manifest, dependencies, scripts, and lockfile; there is no root npm workspace or shared runtime package. The API commits `apps/api/package-lock.json`.
- **Module system:** native ECMAScript modules.
- **TypeScript:** `NodeNext` module and resolution settings aligned with Node.js ESM behavior.
- **HTTP framework:** Express 5.
- **Development execution:** `tsx`.
- **Build:** TypeScript compiler (`tsc`) emits JavaScript; production runs the compiled output with Node.js.
- **Initial automated checks:** Node.js built-in test runner (`node:test`).
- **Dependency wiring:** manual composition and constructor injection; no service locator or DI container.
- **Configuration validation:** Zod, isolated to the configuration boundary.
- **Execution context:** the existing Execution Context abstraction; `AsyncLocalStorage` remains a private propagation mechanism.
- **HTTP errors:** RFC 9457 Problem Details with the documented project extensions in this document.

The accepted architecture decisions in ADR-0001 through ADR-0004 remain authoritative for execution context, configuration architecture, dependency injection, and module boundaries. The runtime/toolchain and HTTP error representation are recorded in ADR-0005 and ADR-0006. Application packages are managed independently; ADR-0005 reflects this repository-level package-management choice.

## Configuration Contract

The configuration boundary owns loading, parsing, normalization, validation, and freezing before application composition or listener startup.

Initial environment contract:

| Variable | Contract |
|---|---|
| `NODE_ENV` | One of `development`, `test`, or `production`; defaults to `development` for local use. |
| `HOST` | Defaults to `127.0.0.1`; container deployments can explicitly configure `0.0.0.0` in the relevant phase. |
| `PORT` | Defaults to `3000`; must be an integer from 1 through 65535. |

No database, Redis, authentication, or other external-service configuration is required in this phase. Invalid configuration must fail startup before the HTTP listener begins accepting traffic. Runtime dependencies receive only the configuration they require. Application and business modules must not read `process.env` directly.

The validated configuration must be immutable at runtime, not merely typed as read-only in TypeScript. Any future nested configuration must preserve the same immutability guarantee.

## Bootstrap and Lifecycle Contract

Startup follows an explicit sequence:

1. Load and validate configuration.
2. Construct dependencies through the Composition Root.
3. Create the application and its HTTP adapter.
4. Complete required initialization.
5. Start the HTTP listener.

Importing application modules must not start the server or trigger unexpected infrastructure side effects. If startup fails, the process must fail clearly and must not leave an HTTP listener running.

Shutdown is owned by the application lifecycle:

1. Stop accepting new connections.
2. Allow in-flight requests to complete for up to 10 seconds.
3. Force-close remaining connections after the bound expires.
4. Perform registered cleanup once.

Repeated shutdown signals must not start uncontrolled duplicate cleanup. The lifecycle design must allow future application-owned resources to register cleanup without moving lifecycle ownership into business modules.

## HTTP and Execution Context Contract

HTTP is the only transport adapter implemented in Phase 2. It must provide a real HTTP response for a dummy endpoint and a liveness endpoint. Liveness indicates that the process can serve HTTP; it must not imply database or external-service readiness.

Each HTTP request receives a distinct execution context with server-generated execution, request, and correlation identifiers. Context must propagate through asynchronous work for that request and must not leak between concurrent requests.

- `executionId` identifies the execution context.
- `requestId` identifies the HTTP request and is returned in the `X-Request-Id` response header.
- `correlationId` is initially generated by the server. Trusting inbound correlation identifiers is deferred until an explicit validation policy is adopted.
- Client-provided identifiers must not override server-generated request identity in Phase 2.

Application code depends on the Execution Context abstraction rather than accessing `AsyncLocalStorage` directly.

## Public HTTP Error Contract

HTTP errors use RFC 9457 Problem Details, serialized with the `application/problem+json` media type. The project extends the standard with a stable machine-readable `code`, a `requestId`, and an optional `errors` array for field-level validation failures.

Example validation response:

```json
{
  "type": "about:blank",
  "title": "Unprocessable Content",
  "status": 422,
  "code": "VALIDATION_FAILED",
  "requestId": "server-generated-id",
  "errors": [
    {
      "field": "email",
      "code": "INVALID_FORMAT"
    }
  ]
}
```

The `title` follows the standard HTTP reason phrase when `type` is `about:blank`. `code`, `requestId`, and `errors` are project-defined extension members. The `errors` member is omitted when it is not applicable. Validation responses must not echo sensitive input values. Human-readable field messages are not required in the initial contract; clients can map stable codes to user-facing messages.

Initial mappings:

| Situation | HTTP status | Stable code |
|---|---:|---|
| Unknown route | 404 | `ROUTE_NOT_FOUND` |
| Malformed request syntax, including malformed JSON | 400 | `MALFORMED_REQUEST` |
| Syntactically valid request that fails validation | 422 | `VALIDATION_FAILED` |
| Unexpected internal failure | 500 | `INTERNAL_ERROR` |

The HTTP status and the Problem Details `status` member must agree. The server must set `X-Request-Id` on HTTP responses. Error responses must not disclose stack traces, secrets, raw internal exception messages, or implementation details. A small initial error catalog is included in Phase 2; feature-specific business errors are added alongside their future capabilities.

The application error model remains independent of Express and HTTP formatting. The HTTP boundary translates known application errors into the public representation and sanitizes unexpected errors. This contract does not define the future success-response envelope or the full API validation strategy.

## Acceptance Criteria

### Runtime and Build

- [ ] A clean checkout installs reproducibly using the committed npm lockfile.
- [ ] The API TypeScript source compiles with the declared configuration.
- [ ] Documented development and compiled production commands both work.
- [ ] Production execution uses compiled JavaScript and does not require the development TypeScript runner.

### Configuration and Composition

- [ ] Invalid or missing required configuration prevents startup before the listener accepts traffic.
- [ ] Configuration is loaded, normalized, validated, and frozen at the application boundary.
- [ ] Runtime dependencies receive only the configuration subsets they need.
- [ ] Application modules do not read `process.env` directly.
- [ ] Importing application modules does not start the server or cause unexpected infrastructure side effects.
- [ ] Dependencies are constructed and wired through explicit composition without a service locator or DI container.

### HTTP and Execution Context

- [ ] The application starts and serves a real dummy endpoint response over HTTP.
- [ ] The liveness endpoint responds while the process can serve HTTP and makes no external-infrastructure readiness claim.
- [ ] Each request receives a distinct execution context with server-generated identifiers.
- [ ] Context propagates through asynchronous work and does not leak across concurrent requests.
- [ ] Application code uses the Execution Context abstraction rather than accessing `AsyncLocalStorage` directly.
- [ ] `X-Request-Id` is returned and matches the request identifier in error responses.

### Errors and Shutdown

- [ ] Unknown routes return the agreed RFC 9457-based error format with status 404 and `ROUTE_NOT_FOUND`.
- [ ] Malformed requests return status 400 and `MALFORMED_REQUEST`.
- [ ] Validation failures return status 422 and `VALIDATION_FAILED`, including structured field errors when applicable.
- [ ] Unexpected failures return status 500 and `INTERNAL_ERROR` without exposing internal details.
- [ ] The Problem Details status matches the actual HTTP status.
- [ ] Graceful shutdown stops accepting new connections and gives in-flight requests up to 10 seconds to finish.
- [ ] Remaining connections are force-closed after the shutdown bound, and cleanup runs at most once.
- [ ] Startup failures do not leave a listener running.

### Verification and Documentation

- [ ] Automated checks cover configuration validation, HTTP success and error behavior, error sanitization, execution-context isolation, and lifecycle behavior.
- [ ] The verification suite runs without MongoDB, Redis, Docker, or external service credentials.
- [ ] The API README documents prerequisites, environment configuration, development, build, test, production startup, and shutdown.
- [ ] README, PROJECT, ROADMAP, and CHANGELOG accurately describe the actual repository state.
- [ ] All acceptance criteria pass before the `v0.2.0` tag is created and published.

## Release Gate

Phase 2 targets `v0.2.0`. The release must not be tagged or published until implementation is merged, all applicable acceptance criteria pass, documentation matches the tagged snapshot, and the release is explicitly reviewed. This scope document defines expected behavior; it is not evidence that implementation or tests have already passed.
