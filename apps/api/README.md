# API Application

The API application establishes the Node.js 24, TypeScript, and Express 5 runtime foundation for Phase 2.

## Requirements

- Node.js 24
- npm 10 or later

## Commands

Run these commands from this directory (`apps/api`):

| Command | Purpose |
|---|---|
| `npm install` | Install API dependencies |
| `npm run dev` | Run the API with the development runner |
| `npm run build` | Compile TypeScript to `dist` |
| `npm start` | Run the compiled API |
| `npm test` | Run API tests with the Node.js test runner through `tsx` |
| `npm run typecheck` | Type-check the API without emitting files |

## Environment Configuration

Configuration is read and validated once at startup. Invalid configuration prevents application construction and listener startup.

| Variable | Default | Accepted values |
|---|---|---|
| `NODE_ENV` | `development` | `development`, `test`, `production` |
| `HOST` | `127.0.0.1` | Any non-empty host value |
| `PORT` | `3000` | Integer from `1` through `65535` |

Environment values are normalized before validation. The resulting configuration object is frozen at runtime. Only the configuration boundary reads `process.env`; application components receive the validated configuration through startup.

Example for Git Bash:

```bash
NODE_ENV=development HOST=127.0.0.1 PORT=3000 npm run dev
```

The starter response is available at `GET /` on `http://127.0.0.1:3000` with the default configuration. `GET /health/live` returns `{ "status": "ok" }` when the HTTP process can serve requests; it does not check database or external-service readiness.

## HTTP Error Contract

Errors use RFC 9457 Problem Details with the `application/problem+json` media type. Every response includes the server-generated `X-Request-Id` header; error bodies repeat that value as `requestId`.

| Situation | Status | Code |
|---|---:|---|
| Unknown route | 404 | `ROUTE_NOT_FOUND` |
| Malformed JSON request | 400 | `MALFORMED_REQUEST` |
| Application validation failure | 422 | `VALIDATION_FAILED` |
| Unexpected internal failure | 500 | `INTERNAL_ERROR` |

The response includes `type`, `title`, `status`, `code`, and `requestId`. Validation errors may also include an `errors` array containing stable field and error codes. The HTTP status and `status` member agree. Unexpected exception messages, stack traces, and internal details are not returned to clients.

## API Contract and Documentation

The Phase 3 OpenAPI contract is maintained at `openapi/openapi.yaml`. It defines the versioned API prefix (`/api/v1`), the example paginated collection response, pagination constraints, and the RFC 9457-based error responses.

Run `npm run validate:openapi` from this directory to lint the specification with the pinned Redocly CLI version. The same command runs in the dedicated OpenAPI GitHub Actions workflow when contract files change.

Swagger UI will be exposed by the application as `/api-docs` alongside the raw specification at `/openapi.yaml` in the API implementation pull request. Swagger UI presents the contract interactively; automated specification validation remains a separate check.

The initial example contract defines `GET /api/v1/items` with deterministic in-memory data and offset pagination. It does not introduce database integration or business CRUD functionality.

## Graceful Shutdown

The process registers `SIGINT` and `SIGTERM` handlers only after the HTTP listener starts. Shutdown stops accepting new connections, allows in-flight requests up to 10 seconds to complete, and then force-closes remaining connections. Repeated signals share the same shutdown operation, and registered cleanup tasks run at most once. Cleanup tasks run sequentially; a failing task is reported without preventing later tasks from running.

Application-owned resources can register cleanup through the optional `configureLifecycle` callback passed to `startServer`. Register cleanup before startup completes; registration after shutdown begins is rejected. The lifecycle implementation is available through `createApplicationLifecycle` for focused testing. Importing application and composition modules does not start the listener or install process signal handlers.

The API owns its backend implementation, dependencies, database integration, and persistence models. The admin and web applications are independent frontend API consumers; they do not import API internals or access its database directly.

The configuration, composition, execution-context, HTTP error-contract, liveness, and graceful-shutdown slices are implemented for Phase 2. Acceptance criteria have been verified on `main`; `v0.2.0` remains unpublished pending final documentation review and release approval.
