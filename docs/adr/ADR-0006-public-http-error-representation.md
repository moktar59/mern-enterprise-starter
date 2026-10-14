# ADR-0006: Public HTTP Error Representation

- **Status:** Accepted
- **Date:** 2026-10-14
- **Decision Owners:** Project Architecture
- **Scope:** API Core / HTTP Error Boundary

## Context

The Phase 2 HTTP adapter needs a stable public error contract so that a real dummy API can demonstrate predictable failures and future endpoints do not invent incompatible response formats.

The contract must support machine-readable error codes, safe client responses, validation feedback, and request correlation while keeping application errors independent of Express and HTTP serialization.

## Decision

Public HTTP errors use **RFC 9457 Problem Details**, serialized as `application/problem+json`.

The project adds these documented extension members:

- `code`: stable machine-readable project error code.
- `requestId`: server-generated identifier for the HTTP request.
- `errors`: optional array of validation issues. Each initial issue contains `field` and `code`; user-facing messages may be mapped by clients.

The standard members are used according to RFC 9457. When `type` is `about:blank`, `title` uses the standard HTTP reason phrase for the status. The `status` member, when present, must match the actual HTTP response status. The initial response omits `detail` when it adds no useful information and does not require `instance`.

The response includes no raw exception message or stack trace. Validation errors must not echo sensitive input values. Unexpected failures use a generic public representation.

The HTTP boundary owns translation from known application errors to HTTP status codes and Problem Details. The application error model does not depend on Express or the HTTP response schema.

Initial mapping:

| Situation | Status | Code |
|---|---:|---|
| Unknown route | 404 | `ROUTE_NOT_FOUND` |
| Malformed request syntax, including malformed JSON | 400 | `MALFORMED_REQUEST` |
| Valid syntax that fails request validation | 422 | `VALIDATION_FAILED` |
| Unexpected internal failure | 500 | `INTERNAL_ERROR` |

The server generates a request ID for each HTTP request and returns it in the `X-Request-Id` response header. The same ID appears as `requestId` in error responses. Client-provided request IDs do not override server-generated request identity in Phase 2.

The initial error catalog is intentionally small. Feature-specific business errors are introduced with their corresponding capabilities; this ADR does not predefine a comprehensive catalog for features that do not yet exist.

## Alternatives Considered

- **A project-specific error envelope:** Not selected because RFC 9457 provides an established HTTP error representation and avoids inventing a new base format.
- **Express-style or framework-specific error objects as the public contract:** Not selected because framework response conventions should not define the project's public API.
- **Human-readable messages as machine identifiers:** Rejected because message text can change or be localized; clients should use stable error codes.
- **Exposing internal exception details:** Rejected because it leaks implementation information and can expose sensitive data.
- **Defining every future business error in Phase 2:** Rejected because it would create speculative catalog entries before their behavior and status mapping are understood.

## Consequences

### Positive

- HTTP errors have a standards-based representation.
- Clients can branch on stable codes instead of parsing message text.
- Validation failures can identify fields without echoing submitted values.
- Error translation remains at the HTTP boundary.
- The initial catalog can grow alongside features without changing the envelope.
- Error behavior can be tested independently of internal exception details.

### Negative / Trade-offs

- The project must document its extension fields and maintain consistent status/code mappings.
- Clients need to handle the Problem Details members and the project-specific extensions.
- The response contract must be kept consistent across routes and future API versions.

### Follow-up

- Implement the centralized Express error boundary and the mappings during Phase 2.
- Add automated tests for response shape, status/code mapping, validation errors, request ID consistency, and sanitization.
- Keep success-response conventions and the broader API validation strategy in Phase 3.
