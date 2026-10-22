# ROADMAP

> *A roadmap is more than a list of tasks. It is a representation of how a system is expected to evolve over time. This roadmap defines the planned evolution of **mern-enterprise-starter**, ensuring that every phase builds upon a stable foundation while remaining independently valuable.*

---

# Vision

The objective of this roadmap is to build an opinionated, enterprise-grade MERN starter that demonstrates professional software engineering practices from the very first commit.

Rather than focusing solely on delivering features, the roadmap emphasizes architecture, maintainability, documentation, security, testing, and operational excellence.

The completed repository should serve both as a production-ready foundation and as an educational resource for developers who want to learn how modern engineering teams build scalable applications.

---

# Development Principles

The roadmap follows a small set of principles that guide every phase.

## Incremental Development

Each phase introduces a focused set of capabilities without requiring major restructuring of previously completed work.

## Stable Foundations

Every release should provide a usable and stable foundation for the next phase.

## Documentation First

Documentation evolves together with implementation. Every completed phase includes the documentation necessary to understand the decisions introduced during that phase.

---

# Release Strategy

Development is organized into milestone-based releases.

Each completed phase results in:

* A reviewed and merged pull request.
* Updated documentation.
* A dedicated Git tag.
* A GitHub Release for that exact tagged snapshot.
* A stable foundation for the following phase.

Version numbers progress incrementally until the first stable release. The phase table defines planned milestone versions; a consolidated release may intentionally include multiple merged phases when explicitly documented. It does not prohibit patch releases between milestones.

## Release and Tagging Rules

* **Milestone releases** deliver the planned scope of a roadmap phase. Phase 1 targets `v0.1.0`; Phase 2 targets `v0.2.0`, and so on.
* **Patch releases** may be used between milestones for backward-compatible corrections that materially affect the accuracy, usability, or integrity of a released snapshot, including documentation corrections. A patch release does not replace or rewrite the original tag.
* **Tags are immutable release records.** Never move an existing version tag to a different commit to make the historical snapshot appear corrected.
* **A GitHub Release must match its tag.** Before publishing, verify that the tagged snapshot's README, changelog, and stated capabilities accurately describe that snapshot.
* **Post-tag changes remain under `[Unreleased]`** until they are included in a subsequent release. Do not describe changes merged after a tag as part of that earlier version.
* A release is not published merely because a phase is listed in the roadmap. The scope must be reviewed and the tagged snapshot must be ready.

The existing `v0.1.0` tag is retained as a historical snapshot. Documentation changes merged after it are not retroactively part of `v0.1.0`. The next release version must be chosen based on the scope and review of the proposed release, not by moving the existing tag.

| Phase    | Planned milestone release |
| -------- | ------------------------- |
| Phase 1  | v0.1.0                    |
| Phase 2  | v0.2.0                    |
| Phase 3  | v0.6.0 (consolidated)      |
| ...      | ...                       |
| Phase 16 | v1.0.0                    |

---

# Phase Overview

| Phase | Name                                       | Release |
| ----- | ------------------------------------------ | ------- |
| 1     | Documentation                              | v0.1.0  |
| 2     | Core Backend                               | v0.2.0  |
| 3     | API Design                                 | v0.6.0* |
| 4     | Docker Development Environment             | v0.6.0* |
| 5     | Database                                   | v0.6.0* |
| 6     | Logging                                    | v0.6.0* |
| 7     | Authentication                             | v0.7.0  |
| 8     | Social Authentication & Session Management | v0.8.0  |
| 9     | Authorization                              | v0.9.0  |
| 10    | Caching                                    | v0.10.0 |
| 11    | Background Jobs                            | v0.11.0 |
| 12    | File Upload                                | v0.12.0 |
| 13    | Security Hardening                         | v0.13.0 |
| 14    | Testing                                    | v0.14.0 |
| 15    | CI/CD                                      | v0.15.0 |
| 16    | Monitoring                                 | v1.0.0  |

---

# Phase Overview

Development phases are planned milestones; checkmarks reflect implementation status on the current main branch. Phases 3–6 are included in the planned consolidated `v0.6.0` release; the intermediate `v0.3.0`, `v0.4.0`, and `v0.5.0` tags were not published.

- [x] Phase 01 — Documentation
- [x] Phase 02 — Core Backend
- [x] Phase 03 — API Design (merged; included in consolidated `v0.6.0` release)
- [x] Phase 04 — Docker Development Environment (merged; included in consolidated `v0.6.0` release)
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

---

# Development Phases

---

# Phase 1 — Documentation

## Objective

Establish the engineering foundation of the repository before implementation begins.

## Deliverables

* README.md, PROJECT.md, PHILOSOPHY.md, DESIGN.md, and ROADMAP.md
* Authoritative runtime architecture and architectural invariants (`ARCHITECTURE.md`)
* Architecture specifications under `docs/architecture/`
* Architecture Decision Records and ADR template under `docs/adr/`
* Decision register under `docs/decisions/`
* Contribution, security, license, and community governance documentation
* Repository standards and GitHub issue/PR templates
* Release strategy, branching strategy, and versioning documentation

## Learning Outcomes

Understand how documentation guides engineering decisions and why architecture should be established before implementation begins.

## Release

**Git Tag:** `v0.1.0`

---

# Phase 2 — Core Backend

## Objective

Build a minimal, runnable, extensible backend foundation that can start successfully, serve a real HTTP request, return a real response, handle HTTP errors safely and consistently, and shut down gracefully. This phase establishes the foundation; it does not claim that the application is fully production-ready.

## Deliverables

* Node.js 24, TypeScript, and Express 5 runtime foundation
* Validated environment configuration and explicit application composition
* HTTP execution context and consistent RFC 9457-based error handling
* Liveness endpoint and graceful shutdown
* Automated tests, type checking, and production build

## Learning Outcomes

Understand how to establish a minimal backend foundation with explicit responsibilities and reliable lifecycle behavior.

## Release

**Git Tag:** `v0.2.0`

---

# Phase 3 — API Design

## Objective

Establish consistent API standards before exposing business functionality.

## Deliverables

* URL versioning and resource-oriented response conventions
* API-wide validation and request-validation conventions
* Collection and pagination conventions
* OpenAPI contract, Swagger UI endpoint, and automated contract/runtime validation

The RFC 9457-based HTTP error contract is established in Phase 2; Phase 3 refines its integration with the broader API conventions without replacing it.

## Key Architectural Decisions

* API consistency
* Versioning strategy
* Request/response standards

## Learning Outcomes

Learn how well-designed APIs improve maintainability and developer experience.

## Release

**Release:** Included in consolidated `v0.6.0`; the intermediate `v0.3.0` tag was not published.

---

# Phase 4 — Docker Development Environment

## Objective

Provide a reproducible local development environment that enables contributors to start the API, MongoDB, and Redis with minimal setup.

## Deliverables

* Root Docker Compose configuration and API Dockerfile
* API development container with source mounting and hot reload
* MongoDB service with persistent development storage
* Redis service with explicitly ephemeral development data
* Optional Mongo Express and Redis Insight profiles
* Shared development network and service health checks
* Safe local environment example and Docker build-context exclusions
* Documentation for setup, logs, restarts, shutdown, and destructive cleanup
* CI validation of Compose configuration and API image build

The API does not connect to MongoDB or Redis in this phase. Database integration and caching remain later phases.

## Key Architectural Decisions

* Containerized local development
* Service isolation and discovery
* Local-only host port bindings
* Persistent database storage versus disposable cache data
* Reproducible image and dependency installation

## Learning Outcomes

Understand how containerization supports consistent onboarding and isolated development dependencies.

## Release

**Release:** Included in consolidated `v0.6.0`; the intermediate `v0.4.0` tag was not published.

---

# Phase 5 — Database

## Objective

Introduce persistent storage with a scalable data access strategy.

## Deliverables

* Pin Mongoose in the API's independent manifest and lockfile.
* Validate the MongoDB URI at the configuration boundary.
* Connect and initialize required indexes before the HTTP listener opens; fail startup if MongoDB is unavailable.
* Keep Mongoose models and query types inside the persistence adapter.
* Replace the in-memory items endpoint with an injected repository implementation.
* Preserve the public response shape, validation codes, page defaults, maximum page size, stable ordering, and empty-collection metadata.
* Add an explicit repeatable seed command; never seed automatically during API startup.
* Register database disconnection with graceful shutdown.
* Add repository integration checks against an isolated MongoDB test database.
* Document local configuration, seed behavior, index ownership, and testing.

## Key Architectural Decisions

* Mongoose is the selected persistence adapter.
* The public item identifier is distinct from MongoDB's `_id` and has a unique index.
* MongoDB performs sorting, pagination, and counting; the application does not load the whole collection to paginate in memory.
* Startup fails closed when MongoDB is unavailable; no in-memory runtime fallback.
* Seeding is explicit and idempotent, updating sample records while preserving unrelated records.
* No generic repository framework or migration framework is introduced without a concrete need.

## Acceptance Criteria

- [ ] A clean `npm ci` succeeds using the committed lockfile.
- [ ] API unit/HTTP tests run without MongoDB by injecting a fake repository.
- [ ] MongoDB integration tests run in CI against a dedicated test database.
- [ ] API startup connects to MongoDB and initializes indexes before listening.
- [ ] A failed connection or index initialization prevents the listener from starting.
- [ ] Shutdown disconnects MongoDB through lifecycle cleanup.
- [ ] `GET /api/v1/items` preserves its existing response contract and validation behavior.
- [ ] Pagination, ordering, and counting execute in MongoDB.
- [ ] Repeated seed commands are safe and never run automatically at startup.
- [ ] OpenAPI, README, Docker guide, roadmap, and changelog accurately describe the implementation.
- [ ] Type-check, build, API tests, integration tests, OpenAPI lint, and Compose validation pass before the consolidated `v0.6.0` release review.

## Learning Outcomes

Learn how to organize persistence behind explicit application contracts, keep database technology out of HTTP/application boundaries, and manage database startup and shutdown as lifecycle-owned infrastructure.


---

# Phase 6 — Logging

## Objective

Establish a structured application logging foundation with clear ownership, execution context, safe diagnostic output, and reliable lifecycle integration. This phase does not attempt to deliver the full observability platform.

## Deliverables

* An application-owned `Logger` contract that keeps vendor types out of application and business modules.
* A Pino infrastructure adapter created at the composition/startup boundary; no global logger singleton.
* Validated `LOG_LEVEL` configuration with environment-specific defaults: development `debug`, test `silent`, production `info`.
* One structured completion event per HTTP request with server-generated request/correlation IDs, method, route template where available, status, and duration.
* Liveness requests logged at debug level; 4xx and 5xx responses logged at warning and error levels respectively.
* Structured diagnostics for unexpected HTTP errors, database readiness, startup, shutdown, and cleanup failures.
* Redaction of common credential fields and a documented prohibition on logging raw URLs/query strings, request/response bodies, cookies, and authorization headers.
* Tests for configuration, redaction, request logging, public error compatibility, and non-blocking lifecycle diagnostics.

## Key Architectural Decisions

* Application code depends on the project-owned logger contract, not Pino.
* The logger is constructed once at the composition/startup boundary and injected.
* The existing execution context remains the source of request and correlation identifiers; no second correlation mechanism is introduced.
* Public RFC 9457 error responses remain sanitized and compatible.
* Logging failures must not replace original failures, prevent cleanup, or recursively trigger logging failures.

## Acceptance Criteria

- [ ] A clean `npm ci` succeeds with the committed manifest and lockfile.
- [ ] `LOG_LEVEL` accepts only supported values and invalid configuration fails before database connection or listener startup.
- [ ] Development, test, and production defaults are `debug`, `silent`, and `info`.
- [ ] Pino is confined to the infrastructure adapter; business modules and app-owned interfaces expose no Pino types.
- [ ] HTTP completion events include request ID, correlation ID, method, route template when available, status code, and duration.
- [ ] Liveness events are debug-level; successful requests are info-level; 4xx and 5xx responses use warning and error severity.
- [ ] Raw URLs/query strings, request/response bodies, cookies, authorization values, and common secret fields are not emitted by default.
- [ ] Unexpected errors are logged internally without changing the public RFC 9457 response contract.
- [ ] Startup, database readiness, shutdown, and cleanup failures are logged without interrupting cleanup or replacing the original error.
- [ ] Unit/HTTP tests, type-check, production build, OpenAPI lint, MongoDB integration tests, and Docker Compose validation pass before the consolidated `v0.6.0` release review.

## Out of Scope

Metrics, dashboards, distributed tracing/OpenTelemetry, alerting, log aggregation, vendor integrations, Nginx, deployment automation, and Docker optimization remain outside this phase.

## Learning Outcomes

Understand how to introduce structured logging through explicit application-owned contracts, propagate execution context into diagnostics, and preserve security and lifecycle guarantees while instrumenting an HTTP service.

## Release

**Git Tag:** `v0.6.0`
