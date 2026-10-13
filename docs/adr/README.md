# Architecture Decision Records

Architecture Decision Records (ADRs) capture significant architectural decisions, including their context, rationale, alternatives, and consequences.

## Accepted Decisions

| ADR | Decision | Status |
|---|---|---|
| [ADR-0001: Execution Context](ADR-0001-execution-context.md) | Define execution context ownership, propagation, and lifecycle. | Accepted |
| [ADR-0002: Configuration Architecture](ADR-0002-configuration-architecture.md) | Define configuration architecture and ownership boundaries. | Accepted |
| [ADR-0003: Dependency Injection and Resolution](ADR-0003-dependency-injection-and-resolution.md) | Define dependency registration, resolution, and lifecycle responsibilities. | Accepted |
| [ADR-0004: Module Boundaries and Architecture](ADR-0004-module-boundaries-and-architecture.md) | Define module boundaries and constraints governing module interactions. | Accepted |

Use [the decision register](../decisions/decision-register.md) for a concise status and scope overview.

## Creating an ADR

1. Start from [ADR-0000-template.md](ADR-0000-template.md).
2. Assign the next available sequential ADR number and a descriptive filename.
3. Record the status, date, decision owners, and scope accurately.
4. Explain context, the decision, alternatives considered, and consequences.
5. Update the decision register and any affected architecture documentation in the same change.

Accepted ADRs must not contradict `ARCHITECTURE.md`. If a foundational architectural principle or invariant needs to change, update and review the authoritative architecture document alongside the relevant ADR.

## Status Definitions

- **Proposed** — under consideration and not yet an accepted project decision.
- **Accepted** — approved and represents the current decision.
- **Superseded** — replaced by a later decision; retain the original for historical traceability.
