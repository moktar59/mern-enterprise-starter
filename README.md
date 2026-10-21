# MERN Enterprise Starter

> **An opinionated, enterprise-grade MERN starter for building production-ready applications.**

MERN Enterprise Starter is an open-source project being developed as both a reusable MERN starter and a practical reference for software architecture and engineering decisions. The documentation foundation and Phase 2 core backend implementation are complete. Phase 3 API contract implementation is merged; its milestone release and Phase 4 Docker environment are being prepared incrementally.

Unlike traditional boilerplates that focus only on project setup, this repository emphasizes **software architecture, engineering decisions, documentation, and long-term maintainability**.

---

## Why This Project?

Starting a new MERN application often involves repeating the same setup and making the same architectural decisions.

This project provides a well-structured foundation that enables developers and teams to focus on building features instead of rebuilding infrastructure.

The project is developed incrementally through documented phases, with architectural decisions and implementation scope made explicit before each capability is built.

---

## Current Status

**Phase 3 — API Design (implementation merged; milestone release pending)**

Currently available:

- Project vision, engineering philosophy, design principles, and roadmap
- Runtime architecture principles and invariants
- Architecture Decision Records (ADRs) and a decision register
- Architecture guidance for execution context, module interaction, workflows, eventing, reliability, performance, and observability
- Contribution, security, and repository governance documentation
- API configuration validation, explicit composition, HTTP execution context, RFC 9457-based error handling, liveness endpoint, and graceful shutdown
- Versioned API route, pagination conventions, OpenAPI contract, Swagger UI endpoint, and automated API contract/runtime checks

Phase 2 acceptance checks passed on `main`; Phase 3 implementation is merged. Phase 4 establishes a reproducible Docker development environment before Phase 5 introduces database integration. The API currently uses deterministic in-memory example data and does not connect to MongoDB or Redis.

---

## Roadmap

Development is organized into sixteen incremental phases.

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

For detailed milestones, see **ROADMAP.md**.

---

## Documentation

Project documentation is treated as a first-class deliverable.

### Project

- `README.md` — Project overview and current implementation status
- `PROJECT.md` — Vision, mission, audience, and scope
- `PHILOSOPHY.md` — Engineering philosophy and guiding principles
- `DESIGN.md` — High-level architecture and design decisions
- `ROADMAP.md` — Development roadmap and milestones
- `ARCHITECTURE.md` — Authoritative runtime architecture, principles, and invariants
- `docs/architecture/` — Detailed architecture specifications
- `docs/adr/` — Architecture Decision Records and ADR template
- `docs/decisions/decision-register.md` — Index of accepted and proposed decisions

### Community

- `CONTRIBUTING.md` — Contribution guidelines
- `CHANGELOG.md` — Release history
- `SECURITY.md` — Security policy
- `CODE_OF_CONDUCT.md` — Community participation standards
- `LICENSE` — MIT license

### Technical Documentation

- `apps/api/` — Backend API application
- `docker/` — Local Docker development documentation
- `docs/` — Architecture documentation and engineering guides

---

## Repository Structure

```text
apps/
├── api/                    # Backend API (Express.js + TypeScript)
├── admin/                  # React admin dashboard (API consumer)
└── web/                    # Public web application (API consumer)

docker/                     # Local Docker development guide
docs/                       # Architecture and engineering documentation
compose.yaml                # Local development services
```

---

## Development Philosophy

This project prioritizes:

- **Explicit architecture** over hidden conventions
- **Clear module boundaries** over implicit coupling
- **Incremental delivery** over premature complexity
- **Documentation and tests** as part of the implementation

Contributions and constructive feedback are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.
