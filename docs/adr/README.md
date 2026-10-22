# Architecture Decision Records (ADRs)

## Purpose

Architecture Decision Records (ADRs) document significant architectural and technical decisions made during the development of the MERN Enterprise Starter.

An ADR captures the context behind a decision, the problem being addressed, the alternatives considered, the chosen approach, and its consequences.

ADRs help maintain architectural consistency, preserve decision-making context, and explain why the project follows particular engineering principles and constraints.

This directory is the canonical location for the project's ADRs.

## ADR Index

| ADR | Decision | Status |
|---|---|---|
| [ADR-0001: Execution Context](ADR-0001-execution-context.md) | Define execution context across application execution boundaries. | Accepted |
| [ADR-0002: Configuration Architecture](ADR-0002-configuration-architecture.md) | Establish configuration ownership and architecture. | Accepted |
| [ADR-0003: Dependency Injection and Resolution](ADR-0003-dependency-injection-and-resolution.md) | Define dependency registration and resolution responsibilities. | Accepted |
| [ADR-0004: Module Boundaries and Module Architecture](ADR-0004-module-boundaries-and-architecture.md) | Define module boundaries and architectural constraints. | Accepted |
| [ADR-0005: Core Backend Runtime and Toolchain](ADR-0005-core-backend-runtime-and-toolchain.md) | Select the core backend runtime and toolchain. | Accepted |
| [ADR-0006: Public HTTP Error Representation](ADR-0006-public-http-error-representation.md) | Define the public HTTP error response contract. | Accepted |

For the complete decision overview, including status tracking and scope, see the [Decision Register](../decisions/decision-register.md).

## Naming Convention

ADR files use the following naming convention:

`ADR-NNNN-short-decision-title.md`

Examples:

- `ADR-0001-execution-context.md`
- `ADR-0002-configuration-architecture.md`
- `ADR-0003-dependency-injection-and-resolution.md`

Each ADR receives a unique, sequential identifier. Once assigned, an identifier must not be reused, even if the decision is later rejected or superseded.

Use a short, descriptive filename that identifies the decision.

## Required Metadata

Every ADR must identify its status, date, decision owners, and scope.

Use the following metadata fields:

- **Status:** Current lifecycle status of the decision.
- **Date:** Date the ADR was created or formally decided, according to the project's ADR template convention.
- **Decision Owners:** The person, team, or group accountable for the decision.
- **Scope:** The architectural area affected by the decision.

Follow the existing conventions in [ADR-0000-template.md](ADR-0000-template.md) when creating a new record. Keep metadata formatting consistent across ADRs.

## ADR Structure

An ADR should provide enough information for a future contributor to understand the decision without reconstructing the original discussion.

Depending on the nature of the decision, include:

1. **Context** — The problem, constraints, and circumstances requiring a decision.
2. **Decision Drivers** — The requirements and principles that influence the choice.
3. **Considered Options** — Reasonable alternatives and their trade-offs.
4. **Decision** — The chosen approach and its rationale.
5. **Consequences** — Benefits, limitations, risks, and follow-up implications.
6. **Related Decisions** — Relevant ADRs and architecture documentation.

Use the existing ADR template as the starting point. Sections may be adapted when necessary, but the reasoning behind significant decisions must remain clear.

## ADR Lifecycle

ADRs use the following lifecycle statuses:

- **Proposed** — The decision is under consideration and has not been accepted.
- **Accepted** — The decision has been approved and represents the current architectural direction.
- **Rejected** — The proposal was considered but not adopted. Preserve the record and its rationale.
- **Superseded** — A later decision replaces the ADR. Preserve the original record and link to the replacing ADR.

A superseded ADR remains part of the project's architectural history. Do not delete it or reuse its identifier.

Update the ADR status and the [Decision Register](../decisions/decision-register.md) when the decision lifecycle changes.

## Proposing a New ADR

Create an ADR when a decision has a meaningful, long-term effect on architecture, dependency ownership, module boundaries, reliability, security, performance, or operational complexity.

Examples include:

- Introducing or changing a core architectural abstraction.
- Establishing a new module interaction pattern.
- Changing transaction or workflow ownership.
- Selecting a foundational infrastructure integration.
- Changing an established reliability or security strategy.

Not every implementation detail requires an ADR. Routine changes that follow existing decisions should normally be documented in the relevant implementation or feature documentation.

### Process

1. Review existing ADRs and architecture documentation to avoid duplicating an existing decision.
2. Copy `ADR-0000-template.md` to a new file using the next available identifier.
3. Describe the context, constraints, options, decision, and consequences.
4. Set the initial status to **Proposed** while the decision is under review.
5. Submit the ADR through a pull request and request appropriate architectural review.
6. After approval, update the status to **Accepted** and update the Decision Register.
7. Update related architecture documentation when the decision changes established principles or constraints.

Do not mark a proposal as accepted before the decision has been approved.

## Maintaining ADRs

- Treat accepted ADRs as the authoritative records of their respective decisions.
- Keep each ADR focused on one cohesive decision.
- Update an existing ADR only when clarifying or correcting its record; use a new ADR when a materially different decision is required.
- When replacing a decision, create a new ADR and link the old and new records.
- Keep the ADR Index and Decision Register consistent with the actual files and statuses.
- Verify relative links whenever ADR files are renamed or moved.
- Do not silently change an accepted architectural decision through implementation alone; document and review material changes.

## Related Documentation

- [Architecture Overview](../../ARCHITECTURE.md)
- [Decision Register](../decisions/decision-register.md)
- [ADR Template](ADR-0000-template.md)


## ADR-0007 — Local Authentication and Access Tokens

Defines local email/password authentication, Argon2id password hashing, short-lived JWTs, MongoDB uniqueness, execution-context principal propagation, and Phase 7 exclusions.
