# MERN Enterprise Starter

> **An opinionated, enterprise-grade MERN starter for building production-ready applications.**

MERN Enterprise Starter is an open-source project being developed as both a reusable MERN starter and a practical reference for software architecture and engineering decisions. The documentation foundation is complete, and the Phase 2 core backend implementation has been merged. Final acceptance verification and release review remain in progress.

Unlike traditional boilerplates that focus only on project setup, this repository emphasizes **software architecture, engineering decisions, documentation, and long-term maintainability**.

---

## Why This Project?

Starting a new MERN application often involves repeating the same setup and making the same architectural decisions.

This project provides a well-structured foundation that enables developers and teams to focus on building features instead of rebuilding infrastructure.

The project is developed incrementally through documented phases, with architectural decisions and implementation scope made explicit before each capability is built.

---

## Current Status

**Phase 2 — Core Backend (implementation merged; acceptance verification in progress)**

Currently available:

- Project vision, engineering philosophy, design principles, and roadmap
- Runtime architecture principles and invariants
- Architecture Decision Records (ADRs) and a decision register
- Architecture guidance for execution context, module interaction, workflows, eventing, reliability, performance, and observability
- Contribution, security, and repository governance documentation
- API configuration validation, explicit composition, HTTP execution context, RFC 9457-based error handling, liveness endpoint, and graceful shutdown

The Phase 2 implementation is merged. Final acceptance verification, documentation reconciliation, and release review remain outstanding before `v0.2.0`. See [Core Backend Scope and Acceptance Criteria](docs/architecture/core-backend-foundation.md). Docker, database integration, authentication, caching, jobs, uploads, CI/CD, and monitoring remain later roadmap items.

---

## Roadmap

Development is organized into sixteen incremental phases.

- [x] Phase 01 — Documentation
- [ ] Phase 02 — Core Backend
- [ ] Phase 03 — API Design
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

- `docs/` — Architecture documentation
- `docs/adr/` — Architecture Decision Records (ADRs)
- `docs/handbook/` — Engineering handbook
- `docs/guides/` — Feature and implementation guides

---

## Repository Structure

```text
apps/
├── api/                    # Backend API (Express.js + TypeScript)
├── admin/                  # React admin dashboard (API consumer)
└── web/                    # Public web application (API consumer)

docker/                     # Docker development environment

docs/                       # Project documentation

scripts/                    # Automation and utility scripts

.github/                    # GitHub repository configuration and templates
```

Each application is independently managed with its own dependencies, scripts, and lockfile. There is no root npm workspace or shared runtime package. The API exclusively owns backend and database access; the admin and web applications consume its public API contract.

Additional directories will be introduced throughout the roadmap as the project evolves.

---

## Contributing

Contributions, discussions, suggestions, and reviews are welcome.

Please read **CONTRIBUTING.md** before submitting issues or pull requests.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.
