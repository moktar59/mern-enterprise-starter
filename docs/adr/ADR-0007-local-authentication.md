# ADR-0007: Local Authentication and Access Tokens

- **Status:** Accepted for Phase 7 implementation
- **Date:** 2026-10-22
- **Owner:** Project Architecture
- **Scope:** API authentication and user persistence

## Decision

Use local email/password authentication; normalize emails and enforce uniqueness in MongoDB; hash passwords with Argon2id; issue short-lived HS256 JWTs validated against an explicit algorithm allow-list, issuer, audience, subject, expiry, and access-token-use claim. Production requires a signing secret of at least 32 bytes. Inject application-owned repository, hasher, and token contracts. Enrich execution context only after token and user validation. Keep login failures generic and preserve sanitized RFC 9457 errors.

## Consequences

Tokens expire after 15 minutes by default and are not revocable in Phase 7. Refresh tokens, sessions, social login, recovery, MFA, and authorization remain later milestones. Argon2 native runtime compatibility must be verified in CI and Docker.
