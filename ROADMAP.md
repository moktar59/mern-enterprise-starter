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

Version numbers progress incrementally until the first stable release. The phase table defines the planned milestone versions; it does not prohibit patch releases between milestones.

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
| Phase 3  | v0.3.0                    |
| ...      | ...                       |
| Phase 16 | v1.0.0                    |

---

# Phase Overview

| Phase | Name                                       | Release |
| ----- | ------------------------------------------ | ------- |
| 1     | Documentation                              | v0.1.0  |
| 2     | Core Backend                               | v0.2.0  |
| 3     | API Design                                 | v0.3.0  |
| 4     | Docker Development Environment             | v0.4.0  |
| 5     | Database                                   | v0.5.0  |
| 6     | Logging                                    | v0.6.0  |
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

Development phases are planned milestones; checkmarks reflect implementation status on the current main branch.

- [x] Phase 01 — Documentation
- [x] Phase 02 — Core Backend
- [x] Phase 03 — API Design (implementation merged; release pending)
- [ ] Phase 04 — Docker Development Environment
- [ ] Phase 05 — Database
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

**Git Tag:** `v0.3.0`

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

**Git Tag:** `v0.4.0`

---

# Phase 5 — Database

## Objective

Introduce persistent storage with a scalable data access strategy.

## Deliverables

* Database connection
* Models
* Repository structure
* Index strategy
* Migration/seeding strategy (if applicable)
* Data validation foundation

## Key Architectural Decisions

* Data access organization
* Repository boundaries
* Persistence strategy

## Learning Outcomes

Learn how to organize persistence for long-term maintainability.
