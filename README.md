# MERN Enterprise Starter

> **An opinionated, enterprise-grade MERN starter for building production-ready applications.**

MERN Enterprise Starter is an open-source project developed as both a reusable MERN starter and a practical reference for software architecture and engineering decisions. It emphasizes clear boundaries, explicit contracts, maintainability, documentation, and incremental delivery.

## Current Status

**Phase 4 — Docker Development Environment: merged. Phase 5 — Database: implementation under review.**

The repository includes architecture and ADR documentation, independently managed applications, a Node.js 24/TypeScript/Express 5 API foundation, validated configuration, HTTP execution context, RFC 9457-based errors, versioned API routes, pagination conventions, OpenAPI/Swagger UI, graceful shutdown, and a Docker Compose development environment.

The Phase 5 proposal adds Mongoose persistence for the items endpoint. It requires MongoDB before the API listener starts, preserves the public pagination contract, keeps Mongoose behind a repository adapter, and uses an explicit repeatable seed command. It is not complete until review, CI, and merge.

## Roadmap

- [x] Phase 01 — Documentation
- [x] Phase 02 — Core Backend
- [x] Phase 03 — API Design (implementation merged; milestone release pending)
- [x] Phase 04 — Docker Development Environment (merged)
- [ ] Phase 05 — Database (implementation under review)
- [ ] Phase 06 — Logging
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
- docs/architecture/ — Detailed architecture specifications
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
