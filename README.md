# MERN Enterprise Starter

> **An opinionated, enterprise-grade MERN starter for building production-ready applications.**

MERN Enterprise Starter is an open-source project developed as both a reusable MERN starter and a practical reference for software architecture and engineering decisions. It emphasizes clear boundaries, explicit contracts, maintainability, documentation, and incremental delivery.

## Current Status

**Phase 6 — Structured Logging: implementation merged; consolidated `v0.6.0` release preparation in progress.**

The repository includes architecture and ADR documentation, independently managed applications, a Node.js 24/TypeScript/Express 5 API foundation, validated configuration, HTTP execution context, RFC 9457-based errors, versioned API routes, pagination conventions, OpenAPI/Swagger UI, graceful shutdown, a Docker Compose development environment, MongoDB persistence, and structured logging.

Phases 3–6 are merged. The planned `v0.3.0`, `v0.4.0`, and `v0.5.0` tags were not published; their merged scope is being documented together in the consolidated `v0.6.0` release. This release preparation does not claim that intermediate tags exist.

## Roadmap

- [x] Phase 01 — Documentation
- [x] Phase 02 — Core Backend
- [x] Phase 03 — API Design (included in consolidated `v0.6.0` release)
- [x] Phase 04 — Docker Development Environment (included in consolidated `v0.6.0` release)
- [x] Phase 05 — Database (merged; included in consolidated `v0.6.0` release)
- [x] Phase 06 — Logging (merged; included in consolidated `v0.6.0` release)
- [ ] Phase 07 — Authentication
- [ ] Phase 08 — Social Authentication & Session Management
- [ ] Phase 09 — Authorization
- [ ] Phase 10 — Caching
- [ ] Phase 11 — Background Jobs
- [ ] Phase 12 — File Upload
- [ ] Phase 13 — Security Hardening
- [ ] Phase 14 — Testing
- [ ] Phase 15 — CI/CD
- [ ] Phase 16 — Monitoring

See ROADMAP.md for milestones and apps/api/README.md for API operation and database commands.

## Architecture and Documentation

- ARCHITECTURE.md — Runtime architecture and invariants
- docs/architecture/ — Detailed architecture specifications, including database persistence boundaries
- docs/adr/ — Architecture Decision Records
- docs/decisions/decision-register.md — Decision register
- apps/api/ — Backend API, persistence, and API contract
- apps/admin/ and apps/web/ — Independent frontend API consumers
- docker/ — Local Docker development guide
- compose.yaml — Local development services

The API owns backend and database access. Frontend applications consume its public HTTP API and must not import its persistence internals.

## Development Philosophy

- **Explicit architecture** over hidden conventions
- **Clear module boundaries** over implicit coupling
- **Incremental delivery** over premature complexity
- **Documentation and tests** as part of implementation

Contributions and constructive feedback are welcome. See CONTRIBUTING.md.
