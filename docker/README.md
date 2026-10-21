# Local Docker Development

This repository uses Docker Compose to run the API, MongoDB, and Redis as separate local development services. The API remains an independent application under `apps/api`; this setup does not add database integration to the API.

## Requirements

- Docker Engine with the Docker Compose v2 plugin
- A terminal capable of running the commands below

## Initial setup

From the repository root, copy the safe example environment file and replace the local-only placeholder credentials:

```sh
cp .env.example .env
```

On PowerShell:

```powershell
Copy-Item .env.example .env
```

Do not commit `.env`. The root `.gitignore` excludes it. Never reuse these local development credentials in a shared or production environment.

## Start the core services

```sh
docker compose up --build
```

This starts the API, MongoDB, and Redis. The API is available at:

- `http://127.0.0.1:3000/`
- `http://127.0.0.1:3000/health/live`
- `http://127.0.0.1:3000/api/v1/items`
- `http://127.0.0.1:3000/api-docs`
- `http://127.0.0.1:3000/openapi.yaml`

The API binds to `0.0.0.0` inside its container so Docker can publish the port. The published host port is bound to loopback by default. Set `API_PORT` in `.env` if host port 3000 is already in use; the container continues to listen on port 3000.

API source is bind-mounted from `apps/api`. The API's existing `npm run dev` script uses `tsx watch`, so source changes trigger a development restart without rebuilding the image. Container dependencies live in a named volume and are not replaced by host `node_modules`.

## Optional administration tools

Start the core services and both optional tools with:

```sh
docker compose --profile tools up --build
```

- Mongo Express: `http://127.0.0.1:8081`
- Redis Insight: `http://127.0.0.1:5540`

The tools are not started by the default Compose command. Mongo Express uses the local MongoDB administrator credentials plus its own basic-auth credentials from `.env`. Redis Insight is available only on the local host by default; add a Redis connection using hostname `redis` and port `6379` from within its interface. The service names are resolved on the Compose network.

Change the optional UI ports with `MONGO_EXPRESS_PORT` and `REDISINSIGHT_PORT` in `.env`. The MongoDB and Redis ports are not published to the host; use the optional tools or `docker compose exec` for local inspection.

## Common commands

```sh
# Show service status and health
docker compose ps

# Follow logs
docker compose logs -f api
docker compose logs -f mongodb redis

# Restart the API after changing environment/container configuration
docker compose restart api

# Stop and remove containers and the Compose network; keep named volumes
docker compose down

# Rebuild the API image after changing its Dockerfile or dependencies
docker compose build api
docker compose up -d api
```

Use `docker compose --profile tools ps` to inspect the optional tools when the profile is enabled.

## Data and cleanup

- MongoDB stores its data in the named `mongodb_data` volume. Ordinary container recreation and `docker compose down` retain this data.
- Redis is intentionally configured without RDB snapshots or AOF persistence. Its data is disposable and is lost when the Redis container is recreated.
- Redis Insight stores its own saved configuration in `redisinsight_data`.
- `docker compose down -v` deletes the named volumes, including MongoDB data and Redis Insight settings. This is destructive; use it only when you intentionally want to reset local data.
- `docker compose down --remove-orphans` removes containers that are no longer described by the Compose file but preserves named volumes.

## Readiness and service boundaries

MongoDB and Redis have health checks. Mongo Express and Redis Insight wait for their respective dependency to become healthy. The API has a process-level liveness check using `/health/live`; it does not wait for MongoDB or Redis because the current API does not yet use either service. Database connection code, repositories, and application-level caching belong to later roadmap phases.

## Validation

From the repository root:

```sh
docker compose config --quiet
docker compose --profile tools config --quiet
docker compose build api
```

The API's existing tests, type-check, build, and OpenAPI lint can also be run from `apps/api` using the commands in that application's README.
