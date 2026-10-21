# Database Persistence Architecture

## Purpose

Phase 5 introduces MongoDB persistence for the example items endpoint without allowing Mongoose to leak into the HTTP or application contract. The implementation is intentionally small: one repository contract, one Mongoose adapter, one collection model, and one explicit seed command.

## Dependency direction

HTTP route → item service → ItemRepository contract ← MongooseItemRepository → Mongoose model → MongoDB.

- The route validates query parameters and formats the existing public response.
- The application-owned item contract contains plain TypeScript data and pagination types only.
- The service depends on the repository contract, not Mongoose.
- The infrastructure adapter owns Mongoose queries, document-to-contract mapping, stable sorting, skip/limit pagination, and database counting.
- The composition root injects the Mongoose adapter into the HTTP application.
- Tests inject a test-only repository; production composition does not select an in-memory fallback.

## Data identity and indexes

The public `id` (for example, `item-001`) is distinct from MongoDB's internal `_id`. The Mongoose schema declares `id` unique and immutable and initializes the index before the API listener starts. The repository sorts by this stable public identifier, so page order does not depend on natural collection order. No additional speculative indexes are introduced for the current unfiltered endpoint.

## Startup and shutdown

The API validates configuration, connects to MongoDB, verifies the connection, and initializes the model indexes before creating a listening server. A connection or index-initialization failure aborts startup; there is no degraded mode or in-memory runtime fallback. The database connection is registered with the existing lifecycle cleanup mechanism and disconnected after HTTP draining.

The liveness endpoint remains a process-level HTTP check. It is not a database readiness endpoint; startup gating is the guarantee that the server begins accepting traffic only after the database is ready.

## Seeding and schema evolution

Seeding is explicit through `npm run seed:items`; it is never invoked during API startup. The command upserts the deterministic 23 sample IDs and resets their sample names while leaving unrelated IDs untouched. This is repeatable sample-data initialization, not a general migration framework. Future schema changes must document compatibility, required backfills, and index rollout before implementation.

## Consistency and pagination

MongoDB performs sorting, page selection, and total counting. Records and count are currently queried in parallel; during concurrent writes, the two results may reflect slightly different instants. The endpoint does not promise snapshot-consistent pagination. A transaction or snapshot read should be introduced only if the product contract later requires that stronger guarantee.

## Verification

Unit and HTTP contract tests use a fake repository and run without MongoDB. The repository integration test uses `TEST_MONGODB_URI` targeting a dedicated test database. Never run integration tests or the seed command against a production database.
