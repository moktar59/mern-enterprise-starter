# API Application

The API is an independently managed Node.js 24, TypeScript, Express 5 application. Phase 5 uses Mongoose for MongoDB persistence while keeping database details behind repository contracts and the composition boundary.

## Requirements

- Node.js 24
- npm 10 or later
- MongoDB for running the API
- Docker Compose is the recommended local option

## Commands

Run these commands from `apps/api`:

| Command | Purpose |
|---|---|
| `npm ci` | Install exact dependencies from the lockfile |
| `npm run dev` | Run the API with the development runner |
| `npm run build` | Compile TypeScript to `dist` |
| `npm start` | Run the compiled API |
| `npm test` | Run unit and HTTP contract tests without MongoDB |
| `npm run test:integration` | Run MongoDB repository integration tests |
| `npm run seed:items` | Explicitly seed the deterministic sample items |
| `npm run typecheck` | Type-check the API without emitting files |
| `npm run validate:openapi` | Lint the OpenAPI specification |

## Environment Configuration

Configuration is read and validated once at startup. The API requires a reachable MongoDB database before it starts listening; connection or index initialization failure aborts startup. There is no degraded mode or in-memory runtime fallback.

| Variable | Default | Purpose |
|---|---|---|
| `NODE_ENV` | `development` | `development`, `test`, or `production` |
| `HOST` | `127.0.0.1` | HTTP bind host |
| `PORT` | `3000` | Integer from 1 through 65535 |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/mern_enterprise_starter` | MongoDB connection URI |

Only the configuration boundary reads runtime `process.env`. Do not put credentials in source code or commit a populated `.env` file. The root Compose setup supplies the MongoDB URI using local-only credentials from the root `.env` file.

For a local MongoDB instance, the default URI is sufficient. With Docker Compose, follow [Local Docker Development](../../docker/README.md).

## Persistence Boundaries

The HTTP route validates pagination and calls an application-owned item service. The service depends on the `ItemRepository` contract; the Mongoose adapter implements that contract. Only the adapter and database infrastructure know about Mongoose models or documents. The composition root injects the repository; importing composition modules does not connect to MongoDB.

The repository performs sorting, skip/limit pagination, and counting in MongoDB. Records are ordered by the stable public `id`, which is unique and separate from MongoDB's internal `_id`. No generic repository framework or cross-module model access is introduced.

## API Contract

`GET /api/v1/items` returns `records` and `pagination`. Pagination defaults to page 1 and 10 records, with `perPage` capped at 500. Invalid supplied values return `422 VALIDATION_FAILED`; an out-of-range page returns 200 with an empty array and accurate metadata. An empty collection reports `totalItems: 0` and `totalPages: 0`. RFC 9457 Problem Details and request-ID behavior remain unchanged.

`GET /health/live` indicates that the HTTP process can serve requests; it does not indicate MongoDB readiness. The listener starts only after MongoDB connection and model index initialization succeed.

## Seed Data

Seeding is an explicit command and never runs during API startup:

```sh
npm run seed:items
```

The command upserts 23 deterministic sample records (`item-001` through `item-023`). Existing records with those IDs have their sample names reset to the deterministic values; unrelated records are not deleted. Re-running the command is safe. Run it from `apps/api` with `MONGODB_URI` set to the intended database. Do not point it at a production database.

There is no migration framework for this initial collection. Schema validation and the unique item-ID index are declared with the Mongoose model and initialized before the API listener opens. Future schema evolution must document compatible changes and any required backfill before release.

## Testing

`npm test` uses a fake repository for HTTP and application unit tests and does not require MongoDB. Set `TEST_MONGODB_URI` to a dedicated disposable test database and run `npm run test:integration` for the repository integration test. The integration test deletes only records with its reserved `item-test-` prefix; never point it at a production database.

## Docker Development

From the repository root, copy `.env.example` to `.env`, set local-only credentials, and run:

```sh
docker compose up --build
```

Compose waits for MongoDB health before starting the API. The MongoDB data volume persists across container recreation. See [Local Docker Development](../../docker/README.md) for optional tools and cleanup instructions.

## Graceful Shutdown

The process registers `SIGINT` and `SIGTERM` handlers only after the listener starts. Shutdown stops accepting requests, drains in-flight requests within the existing bounded timeout, and disconnects MongoDB through the lifecycle cleanup registry. Cleanup tasks run once and sequentially.


## Authentication

- `POST /api/v1/auth/register` returns a public profile and does not issue a token.
- `POST /api/v1/auth/login` returns a 15-minute JWT access token and profile.
- `GET /api/v1/auth/me` requires `Authorization: Bearer <access-token>`.
- Passwords use Argon2id (time cost 2, memory 19,456 KiB, parallelism 1); password length is 12–128 characters. Emails are trimmed and lowercased; MongoDB enforces uniqueness. Login failures are generic.
- Configure `AUTH_JWT_SECRET` (at least 32 bytes; required in production and Compose), `AUTH_JWT_ISSUER` (default `mern-enterprise-starter-api`), `AUTH_JWT_AUDIENCE` (default `mern-enterprise-starter-clients`), and `AUTH_ACCESS_TOKEN_TTL_SECONDS` (default `900`, range 60–3600). Replace the `.env.example` placeholder with a unique random secret; never commit real secrets. Non-production uses an ephemeral key when omitted. JWT verification restricts HS256 and validates issuer, audience, subject, expiry, and access-token use. The verified subject populates the execution context as a human principal; client identity headers are ignored.
- Refresh tokens, sessions/revocation, social login, recovery, MFA, roles, authorization, and frontend screens remain out of scope. Valid tokens remain usable until expiry.
