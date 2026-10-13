# Decision Register

This document provides a centralized index of architectural and significant technical decisions for the MERN Enterprise Starter.

The register summarizes each decision and its current status. The corresponding Architecture Decision Record (ADR) contains the detailed context, decision rationale, alternatives considered, and consequences.

## Decision Status

- **Proposed:** Under consideration; not yet accepted as a project decision.
- **Accepted:** Approved and represents the current decision.
- **Superseded:** Replaced by a later decision. The historical record is retained for traceability.

## Architectural Decisions
| ADR | Decision | Status | Scope |
|---|---|---|---|
| [ADR-0001: Execution Context](../adr/ADR-0001-execution-context.md) | Define how execution context is established, propagated, and accessed across application execution boundaries. | Accepted | API Core / Execution Infrastructure |
| [ADR-0002: Configuration Architecture](../adr/ADR-0002-configuration-architecture.md) | Establish the project's configuration architecture and ownership boundaries. | Accepted | API Core / Execution Infrastructure |
| [ADR-0003: Dependency Injection and Resolution](../adr/ADR-0003-dependency-injection-and-resolution.md) | Define dependency registration, resolution, and lifecycle responsibilities. | Accepted | API Core / Execution Infrastructure |
| [ADR-0004: Module Boundaries and Architecture](../adr/ADR-0004-module-boundaries-and-architecture.md) | Define module boundaries and the architectural constraints governing module interactions. | Accepted | API Core |
## Maintaining This Register

- Add an entry when a new ADR is proposed or accepted.
- Update the status when an ADR is accepted or superseded.
- Link each entry to its canonical ADR file under `docs/adr/`.
- When a decision is superseded, preserve the original ADR and identify the decision that replaces it.
- Keep this register concise; place detailed reasoning, alternatives, and consequences in the individual ADR.
- Do not list an unverified decision as accepted. Confirm its ADR status before updating the register.

## Related Documentation

- [Architecture Overview](../../ARCHITECTURE.md)
- [ADR Directory](../adr/README.md)
