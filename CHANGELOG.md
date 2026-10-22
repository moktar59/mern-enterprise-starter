# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on **Keep a Changelog**, and this project follows **Semantic Versioning**.

## Versioning

Project releases are aligned with the milestones defined in `ROADMAP.md`.

Each release represents a stable milestone in the evolution of the repository. Patch releases may be issued between milestones for backward-compatible corrections, including material documentation corrections. Existing tags remain immutable.

---

## [Unreleased]

_No changes recorded yet._

---

## [0.6.0] - 2026-10-22

> Consolidated milestone release covering the merged Phase 3–6 implementation. The intermediate Phase 3, Phase 4, and Phase 5 milestone tags were not published; this release does not imply that those versions exist.

### Added

#### Phase 3 — API Design
- Added versioned API routes, resource response conventions, validation behavior, collection pagination, and an OpenAPI contract with automated validation.
- Documented API design standards and aligned contract examples with runtime behavior.

#### Phase 4 — Docker Development Environment
- Added a reproducible Docker Compose environment for the API, MongoDB, and Redis.
- Added optional Mongo Express and Redis Insight tools profiles, health checks, local development configuration, and API image validation.

#### Phase 5 — Database
- Added Mongoose persistence for the items endpoint behind an explicit repository boundary.
- Required MongoDB readiness and index initialization before the API listener starts; startup fails if the database is unavailable.
- Added stable database-side sorting, pagination, and counting, plus an explicit repeatable seed command that never runs automatically at startup.
- Added MongoDB repository integration tests in CI and graceful database shutdown.

#### Phase 6 — Structured Logging
- Added an application-owned logger contract and Pino infrastructure adapter with validated `LOG_LEVEL` configuration.
- Added structured HTTP completion events using server-generated request context IDs, sensitive-field redaction, sanitized error diagnostics, and startup/shutdown lifecycle logging.
- Preserved the public RFC 9457 error response contract and isolated logging failures from request handling and cleanup.

### Changed

- Updated API, Docker, database, logging, and architecture documentation to reflect the implemented behavior and boundaries.
- Kept API, admin, and web applications independently managed, with backend and database access owned by the API.

### Verification

- CI for the Phase 6 merge passed dependency installation, API tests, type checking, production build, OpenAPI validation, Docker Compose validation, API image build, and MongoDB integration tests.

### Scope Notes

This is a consolidated release of the current repository snapshot, not a claim that the skipped intermediate version tags were published. The project remains under active development; future roadmap phases, including authentication, authorization, caching, background jobs, file uploads, security hardening, CI/CD, and monitoring, are not included in this release.

---

## [0.2.0] - 2026-10-17

> Core Backend Foundation milestone. Phase 2 acceptance checks were completed on `main`; this release does not claim that the full starter is production-ready.

### Added

- Established the API runtime foundation with Node.js 24, TypeScript, native ESM, and Express 5.
- Added validated, normalized, immutable startup configuration using Zod.
- Added explicit application composition and HTTP execution context with server-generated execution, request, and correlation identifiers.
- Added RFC 9457 Problem Details error responses, stable public error codes, request-ID propagation, and safe handling of unexpected failures.
- Added the liveness endpoint at `GET /health/live`.
- Added graceful HTTP shutdown with a bounded connection-drain period, force-closing of remaining connections, idempotent shutdown, and lifecycle cleanup registration.
- Added automated coverage for configuration, composition, request context, HTTP errors, liveness, graceful shutdown, and startup failures.

### Changed

- Documented the Phase 2 core backend scope, architectural decisions, acceptance criteria, and API runtime behavior.
- Aligned project status and roadmap documentation with the completed Phase 2 acceptance checks.
- Clarified that `apps/api`, `apps/admin`, and `apps/web` are independently managed applications; the API owns backend/database access, while the admin and web applications consume its public API.

### Verification

- Clean dependency installation with `npm ci`.
- 37 automated tests passed.
- Type checking and production build passed.
- HTTP smoke checks passed for the root endpoint, liveness endpoint, and unknown-route error response.
- Manual startup and graceful-shutdown checks passed.

### Scope Notes

This milestone establishes the core HTTP backend foundation. Database integration, Docker development environment, API versioning/design, authentication, authorization, caching, background jobs, file uploads, CI/CD, and monitoring remain outside this release and are planned in later roadmap phases.

---

## [0.1.1] - 2026-10-14

> Documentation patch release covering Phase 1 improvements merged after the existing `v0.1.0` tag. The original `v0.1.0` tag remains an immutable historical snapshot.

### Added

- Detailed architecture specifications for execution context, cross-module workflows, eventing and reliable delivery, failure handling and idempotency, module interaction performance, and observability and resilience.
- Accepted ADRs for execution context, configuration architecture, dependency injection and resolution, and module boundaries.
- A centralized architectural decision register and ADR index.
- GitHub issue templates for bug reports and feature requests.

### Changed

- Corrected documentation navigation, release-policy references, and handbook filenames while preserving empty placeholders.
- Clarified the distinction between current repository contents and capabilities planned for later roadmap phases.
- Aligned project metadata, documentation navigation, design terminology, and Phase 1 deliverables.
- Standardized the pull request template filename and updated `.gitignore` for repository development needs.
- Removed empty architecture placeholders where no documented content or inbound references existed.
- Defined release handling for post-tag corrections, including documentation fixes that materially affect the accuracy of a release snapshot.

---

## [0.1.0] - 2026-08-01

> Historical entry for the existing `v0.1.0` tagged snapshot. Changes merged after that tag belong under Unreleased until included in a later release.

### Added

#### Repository Foundation

* Initial repository structure
* Repository documentation
* Pull request template
* MIT License

#### Documentation

* `README.md`
* `PROJECT.md`
* `PHILOSOPHY.md`
* `DESIGN.md`
* `ROADMAP.md`
* `CONTRIBUTING.md`

#### Engineering Workflow

* Branching strategy
* Pull request workflow
* Code review guidelines
* Release strategy
* Repository governance

### Changed

*None.*

### Deprecated

*None.*

### Removed

*None.*

### Fixed

*None.*

### Security

* Added the MIT License to clearly define the project's licensing terms.

---

### Maintaining the Changelog

The changelog should summarize **notable changes**, not every commit.

When preparing a release:

1. Review the release scope and select the appropriate milestone or patch version.
2. Verify that the README, roadmap, and release notes accurately describe the tagged snapshot.
3. Move the included changes from **Unreleased** into the new version section and record the release date.
4. Create a fresh **Unreleased** section for future development.
5. Create the tag and GitHub Release only after the release snapshot has been reviewed and approved.

Never rewrite an existing version's changelog entry to include changes that were merged after its tag.
