# API Design Conventions

## Purpose

This document establishes the API contract conventions introduced in Phase 3. The OpenAPI document at `apps/api/openapi/openapi.yaml` is the machine-readable contract for the initial versioned API.

## Versioning

- Public resource endpoints use URL versioning under `/api/v1`.
- A breaking public contract change requires a deliberate versioning decision.
- Existing infrastructure endpoints remain outside the version prefix: `GET /` and `GET /health/live`.

## Resource and response naming

- Resource collection endpoints use plural resource names.
- A single primary object uses a context-specific singular property, for example `record`.
- A collection uses `records`.
- A paginated collection uses `records` and `pagination`.
- The API does not require a universal `data` wrapper.
- Multiple semantically distinct objects use context-specific camelCase names.
- A no-content response uses HTTP `204` and has no response body.

## Pagination

The initial collection convention uses offset pagination with 1-based page numbers:

`offset = (page - 1) * perPage`

| Parameter | Default | Constraints |
| --- | ---: | --- |
| `page` | 1 | Positive integer |
| `perPage` | 10 | Positive integer, maximum 500 |

An explicitly supplied invalid value is not silently clamped or replaced with a default. Zero, negative, fractional, non-numeric, and out-of-range `perPage` values return `422 VALIDATION_FAILED`.

A page beyond the final page returns `200 OK`, an empty `records` array, and accurate metadata. The response shape is:

```json
{
  "records": [],
  "pagination": {
    "page": 99,
    "perPage": 10,
    "totalItems": 25,
    "totalPages": 3
  }
}
```

For an empty collection, `totalItems` and `totalPages` are both zero. `page` and `perPage` reflect the validated request.

## Errors

The existing Phase 2 RFC 9457 Problem Details contract remains authoritative. Error responses use `application/problem+json` and include `type`, `title`, `status`, `code`, and `requestId`; sanitized validation errors may include an `errors` array. The `X-Request-Id` response header matches the body's `requestId`. Internal exception details must not be exposed.

| Situation | Status | Code |
| --- | ---: | --- |
| Unknown route | 404 | `ROUTE_NOT_FOUND` |
| Unsupported method on a recognized endpoint | 405 | `METHOD_NOT_ALLOWED` |
| Malformed JSON | 400 | `MALFORMED_REQUEST` |
| Invalid request parameters | 422 | `VALIDATION_FAILED` |
| Unexpected internal failure | 500 | `INTERNAL_ERROR` |

A 405 response includes the `Allow` header listing supported methods.

## Documentation and validation

- Keep the OpenAPI specification checked into the API application.
- Validate the OpenAPI document automatically as part of the API test/validation workflow.
- Validate representative implementation responses against documented schemas where practical.
- Swagger UI is an interactive presentation of the OpenAPI contract, not a substitute for automated contract checks.
- The API implementation and documentation must evolve together.

## Initial example scope

The initial versioned example endpoint is `GET /api/v1/items`, backed by deterministic in-memory data. It demonstrates response naming, validation, and pagination without introducing persistence or business workflows.

Filtering, sorting, cursor pagination, authentication, authorization, and database integration are outside this initial API Design scope.
