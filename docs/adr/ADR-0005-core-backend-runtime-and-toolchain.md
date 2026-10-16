# ADR-0005: Core Backend Runtime and Toolchain

- **Status:** Accepted
- **Date:** 2026-10-14
- **Decision Owners:** Project Architecture
- **Scope:** API Core / Runtime and Toolchain

## Context

Phase 2 must deliver a minimal, runnable backend foundation with reproducible installation, explicit module semantics, a clear development/build workflow, and a real HTTP response. Foundational tooling affects contributor workflow, module resolution, runtime behavior, and future maintenance.

The selection should be opinionated without introducing unnecessary framework machinery. It must align with the existing modular-monolith architecture, explicit composition, and documentation-first workflow.

## Decision

The Phase 2 API uses:

- **Node.js 24** as its runtime.
- **npm with independently managed application packages**; each application owns its package manifest, dependencies, scripts, and lockfile. No root npm workspace or shared runtime package is used.
- **Native ECMAScript modules (ESM)**.
- **TypeScript** with `NodeNext` module and resolution settings aligned with Node.js ESM behavior.
- **Express 5** as the HTTP framework.
- **tsx** for development execution.
- **tsc** to compile TypeScript to JavaScript; production runs the compiled output with Node.js.
- **Node.js built-in test runner (`node:test`)** for the initial automated checks.
- **Zod** for runtime configuration validation at the configuration boundary.
- **Manual composition and constructor injection**, consistent with ADR-0003; no service locator or DI container is introduced in Phase 2.

The API must be runnable without MongoDB, Redis, Docker, or external service credentials.

## Alternatives Considered

- **CommonJS:** Not selected because the project adopts native ESM as its explicit module format.
- **A different package manager:** Not selected; npm is used independently within each application, avoiding a root workspace or shared runtime package.
- **A TypeScript runtime in production:** Not selected; production executes compiled JavaScript to keep the production runtime independent of the development runner.
- **A third-party test framework for the initial checks:** Deferred because Node.js provides a built-in test runner sufficient for the foundation's initial verification needs.
- **A DI container:** Not selected because explicit manual composition remains manageable and is the accepted default in ADR-0003.
- **A configuration validation library coupled throughout the application:** Rejected; Zod is confined to the configuration boundary and does not become an application-wide dependency.

## Consequences

### Positive

- Runtime and package management choices are explicit and reproducible.
- ESM behavior is aligned with Node.js through TypeScript's NodeNext settings.
- Development and production execution paths are distinct and documented.
- Initial tests do not require an additional test framework.
- Configuration validation is typed and centralized.
- Explicit composition remains visible and testable.
- The foundation runs without external infrastructure.

### Negative / Trade-offs

- ESM and NodeNext require consistent file extensions and module-resolution conventions.
- A compiled production workflow adds a build step.
- The project must maintain its Node.js runtime requirement and dependency lockfile.
- The built-in test runner provides fewer integrated conveniences than some third-party testing frameworks; reassess only when concrete needs justify another dependency.

### Follow-up

- Document and implement the selected scripts, TypeScript configuration, independently managed application packages, and per-application lockfiles during Phase 2.
- Verify clean installation, build, development execution, compiled production execution, and tests before the `v0.2.0` release.
- Keep the selected runtime and toolchain reflected in the API documentation.
