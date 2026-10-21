# Local Docker Development

Docker Compose runs the API, MongoDB, and Redis as separate local development services. The API connects to MongoDB using the `mongodb` Compose hostname and waits for MongoDB health before opening its HTTP listener.

## Setup

From the repository root, copy `.env.example` to `.env` and change the local-only placeholder credentials:

```sh
cp .env.example .env
docker compose up --build
```

Never commit `.env` or reuse these credentials in shared or production environments. If you change the MongoDB password to include URI-reserved characters, percent-encode it in the URI.

The API is available at `http://127.0.0.1:3000/`, `/health/live`, `/api/v1/items`, `/api-docs`, and `/openapi.yaml`. Set `API_PORT` if host port 3000 is occupied. The published API port is loopback-only by default. Source is bind-mounted from `apps/api`; the development runner uses `tsx watch`.

## Optional administration tools

```sh
docker compose --profile tools up --build
```

Mongo Express is at `http://127.0.0.1:8081`; Redis Insight is at `http://127.0.0.1:5540`. In Redis Insight, add a connection to hostname `redis`, port `6379`. These tools are not started by the default command, and MongoDB/Redis ports are not published directly to the host.

## MongoDB and seed data

MongoDB data persists in the named `mongodb_data` volume. The API must connect and initialize the unique item-ID index before it listens; there is no in-memory runtime fallback. The `/health/live` endpoint indicates HTTP process liveness, not database readiness.

Seed the deterministic 23-record sample dataset explicitly from `apps/api`:

```sh
npm run seed:items
```

The command upserts `item-001` through `item-023`; names for those sample IDs are reset to deterministic values, while unrelated records are left alone. Seeding never runs automatically during API startup. Set `MONGODB_URI` deliberately and never run this command against production.

## Common commands

```sh
docker compose ps
docker compose logs -f api
docker compose logs -f mongodb redis
docker compose restart api
docker compose down
docker compose build api
docker compose up -d api
```

`docker compose down` keeps named volumes. `docker compose down -v` deletes MongoDB data and Redis Insight settings and is destructive. Redis is intentionally ephemeral.

## Validation

Run `docker compose config --quiet`, `docker compose --profile tools config --quiet`, and `docker compose build api` from the repository root. From `apps/api`, run `npm test`, `npm run test:integration`, `npm run typecheck`, `npm run build`, and `npm run validate:openapi` as appropriate.
