# Architecture

## Purpose

This document defines the runtime architecture of the MERN Enterprise Starter.

It serves the architectural building blocks, their responsibilities, interactions, composition model, and governing principles.

The objective of this document is to establish a stable architectural foundation before implementation begins, ensuring that future development remains consistent, maintainable, and scalable.

This document intentionally focuses on architecture rather than implementation details. Technologies, frameworks, and libraries may evolve over time, but the architectural principles defined here are intended to remain stable throughout the lifetime of the project.

---

# Architecture Vision

The MERN Enterprise Starter follows a **Composition-First Modular Monolith Architecture** where business capabilities are organized into independently evolvable modules with explicit boundaries, explicit composition, and technology-independent business logic.

Every architectural decision prioritizes simplicity, maintainability, replaceability, and long-term scalability while avoiding unnecessary complexity.


---

# Core Principles

The architecture is governed by the following principles.

## 1. Business Capability First

Modules represent business capabilities rather than technical concerns.

Examples include:

- Authentication
- Users
- Orders
- Inventory
- Payments

rather than:

- Services
- Controllers
- Repositories

Business capabilities define the architectural boundaries of the system.

---

## 2. Explicit Composition

Application composition is performed explicitly during application startup.

Object creation, dependency wiring, and module composition are centralized within the application composition root.

No module is responsible for creating its own dependencies.

---

## 3. Explicit Dependencies

Every dependency should be visible.

Dependencies are supplied through composition rather than being discovered through hidden runtime mechanisms.

The architecture favors explicitness over magic.

---

## 4. Technology Independence

Business modules should not depend directly on frameworks, databases, messaging systems, or transport protocols.

Technology choices belong to infrastructure and composition, never to business capabilities.

This allows infrastructure implementations to evolve without affecting business logic.

---

## 5. Capability-Oriented APIs

Modules expose business capabilities rather than implementation details.

Public contracts describe what the module can do instead of how it is implemented.

Consumers interact with business capabilities, never with internal services, repositories, or utilities.

---

## 6. Progressive Complexity

Complexity should be introduced only when justified.

Simple solutions are preferred until measurable architectural needs require additional abstractions.

The project intentionally avoids premature adoption of advanced architectural patterns.

---

## 7. Replaceability Through Composition

Infrastructure implementations should be replaceable through application composition.

Changing infrastructure providers must not require modifications to business modules.

Examples include replacing:

- MongoDB
- Redis
- Payment Providers
- Email Providers
- Storage Providers

without changing business capabilities.

---

## 8. Stable Architectural Boundaries

Each module owns its own business capability.

Communication between modules occurs exclusively through published capability contracts.

Internal implementation details remain private to the owning module.

---

## 9. Explicit Over Magic

The architecture favors readability and predictability over implicit runtime behavior.

Reflection, automatic discovery, hidden registrations, and implicit dependency resolution should only be introduced when they provide clear architectural value.

Developers should be able to understand how the application is composed by reading the composition root.

---

## 10. Framework Independence

The architecture is not built around Express, Node.js, MongoDB, or any specific framework.

Frameworks are considered implementation details that support the architecture rather than define it.

This philosophy allows the architectural model to remain stable even as implementation technologies evolve.

---

# Runtime Architecture

The MERN Enterprise Starter follows a Composition-First runtime architecture where the application is assembled during startup and business capabilities remain at the center of the system.

The runtime architecture separates business capabilities from infrastructure concerns and transport mechanisms, ensuring that business logic remains independent of implementation technologies.

The runtime model consists of five primary architectural components:

- Application
- Infrastructure
- Business Modules
- Adapters
- Plugins

```
                           Application
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
 Infrastructure           Business Modules          Adapters
        │                        │                        │
        │                 Capability Contracts           │
        └────────────────────────┼────────────────────────┘
                                 │
                              Plugins
```

Business Modules represent the core of the system.

Infrastructure, adapters, and plugins exist to support business capabilities rather than define them.

---

# Application Lifecycle

Application startup follows a deterministic lifecycle.

Each stage has a single responsibility.

```
Load Configuration
        │
        ▼
Create Infrastructure
        │
        ▼
Compose Business Modules
        │
        ▼
Connect Adapters
        │
        ▼
Start Application
        │
        ▼
Graceful Shutdown
```

## 1. Load Configuration

The application loads configuration required for startup.

Configuration includes environment-specific settings such as:

- Database configuration
- Cache configuration
- Authentication configuration
- External service configuration

Configuration must be immutable after application startup.

---

## 2. Create Infrastructure

Infrastructure components are created before business modules.

Typical infrastructure includes:

- Database connections
- Cache clients
- Logging
- File storage
- Email services
- Message publishers
- Time providers
- Identifier generators

Infrastructure components do not contain business rules.

---

## 3. Compose Business Modules

Business modules are composed after infrastructure has been initialized.

Each module receives only the dependencies required to fulfill its business responsibility.

Modules do not construct their own dependencies.

All dependency wiring occurs during application composition.

---

## 4. Connect Adapters

Adapters expose business capabilities to external systems.

Examples include:

- HTTP APIs
- WebSocket gateways
- Background jobs
- Scheduled tasks
- CLI commands
- Message consumers

Adapters translate external requests into business capability invocations.

Adapters must not contain business logic.

---

## 5. Start Application

After successful composition, the application begins accepting external requests.

At this point all dependencies have already been created and connected.

Runtime composition must not continue after application startup.

---

## 6. Graceful Shutdown

Application shutdown occurs in the reverse order of startup.

Typical shutdown responsibilities include:

- Stop accepting new requests
- Complete active work
- Flush logs
- Close external connections
- Release infrastructure resources

Business modules should remain unaware of the shutdown process.

---

# Composition Model

The architecture follows a Composition-First model.

Application composition occurs exactly once during startup.

Composition is responsible for:

- Creating infrastructure
- Creating business modules
- Wiring dependencies
- Connecting adapters
- Producing the executable application

Business modules never create other modules.

Business modules never locate dependencies.

Business modules never manage application startup.

These responsibilities belong exclusively to the composition process.

---

## Composition Root

The Composition Root is the single location responsible for constructing the application.

Its responsibilities include:

- Creating infrastructure implementations
- Creating business modules
- Connecting module capability contracts
- Registering adapters
- Producing the runnable application

The Composition Root serves as the authoritative description of how the application is assembled.

Developers should be able to understand the application's runtime composition by reading this location.

---

## Composition Principles

The composition process follows the following principles.

### Explicit Construction

Every dependency is created explicitly.

Hidden runtime object creation should be avoided.

---

### Explicit Wiring

Dependencies are connected deliberately rather than discovered automatically.

---

### Single Composition

Application composition occurs exactly once.

Business modules remain immutable after composition.

---

### Replaceability

Infrastructure implementations can be replaced through composition without modifying business modules.

---

### Visibility

Application composition should remain understandable by reading the composition root without requiring knowledge of hidden runtime behavior.

---

# Module Architecture

Business modules are the fundamental building blocks of the application.

Each module encapsulates a single business capability together with the implementation required to provide that capability.

Modules are autonomous, independently evolvable, and isolated from the internal implementation details of other modules.

A module owns:

- Business rules
- Use cases
- Internal services
- Repository implementations
- Domain models
- Internal utilities
- Tests

A module exposes exactly one public runtime artifact:

**Its Capability Contract.**

Everything else remains private.

---

## Module Responsibilities

A module is responsible for:

- Implementing one business capability.
- Protecting its internal implementation.
- Publishing a stable capability contract.
- Enforcing its own business invariants.
- Coordinating its internal components.

A module is **not** responsible for:

- Creating dependencies.
- Creating other modules.
- Managing application startup.
- Knowing transport protocols.
- Choosing infrastructure implementations.

---

## Capability Contract

A Capability Contract is the only public interface of a module.

Consumers communicate exclusively through capability contracts.

Capability contracts expose business operations rather than implementation details.

Examples include:

```

authentication.authenticate()

authentication.refreshSession()

users.create()

inventory.reserve()

payments.capture()

```

Capability contracts must never expose:

- Repositories
- Internal services
- Database models
- Utility functions
- Framework abstractions

Capability contracts define **what** the module can do, not **how** it is implemented.

---

# Internal Module Structure

The internal organization of a module is private to the module itself.

A typical module consists of:

```

Module

├── Capability Contract

├── Use Cases

├── Domain Logic

├── Internal Services

├── Repository Implementations

├── Domain Models

├── Internal Utilities

└── Tests

```

Consumers must never depend on anything except the capability contract.

---

# Module Communication

Modules communicate directly through published capability contracts.

Example:

```

Orders

↓

Inventory Capability

↓

Inventory Module

```

Modules must never communicate through:

- Repository implementations
- Internal services
- Database access
- Shared utility functions

Communication must always occur through stable business capabilities.

---

## Synchronous Communication

Direct capability invocation is the default communication model.

Business workflows requiring immediate results should use synchronous communication.

Examples include:

- Authentication
- Authorization
- Stock reservation
- Payment authorization

Synchronous communication provides:

- Explicit execution flow
- Simplicity
- Predictable debugging
- Strong consistency

---

## Asynchronous Communication

Asynchronous communication should be introduced only when immediate execution is unnecessary.

Typical examples include:

- Email delivery
- Audit logging
- Analytics
- Notifications
- Cache invalidation

Asynchronous communication complements direct capability communication rather than replacing it.

---

# Dependency Management

The architecture follows a Composition-First dependency model.

Dependencies are supplied during application composition.

Business modules never discover or construct their own dependencies.

Dependencies must always be explicit.

---

## Dependency Ownership

Every dependency has exactly one owner.

Typical ownership examples include:

| **Component / Dependency** | **Owner**      | **Reason for Ownership** |
|:---------------------------|:---------------|:-------------------------|
| Configuration              | Application    | Controls application-wide settings and composition. |
| Database Connection        | Infrastructure | Manages persistence infrastructure and database connectivity. |
| Cache Client               | Infrastructure | Provides caching and queue infrastructure. |
| Logger                     | Infrastructure | Centralizes structured logging across the application. |
| Capability Contracts       | Modules        | Defines the public contracts exposed by each module. |
| HTTP Server                | Adapter Layer  | Handles incoming HTTP requests and outgoing responses. |

Ownership must remain unambiguous throughout the application.

---

# Infrastructure Layer

Infrastructure provides technical capabilities required by business modules.

Infrastructure includes components such as:

- Databases
- Cache
- File Storage
- Email
- Logging
- Messaging
- Time
- Identifiers

Infrastructure contains technical implementations only not business rules.

Business modules depend on infrastructure abstractions supplied during composition.

---

# Adapter Layer

Adapters translate external protocols into business capability invocations.

Examples include:

- HTTP
- GraphQL
- WebSockets
- CLI
- Scheduled Jobs
- Message Consumers

Adapters are responsible for:

- Request translation
- Response translation
- Protocol-specific concerns

Adapters are not responsible for:

- Business rules
- Workflow orchestration
- Persistence
- Domain validation

Adapters should remain thin and stateless whenever possible.

---

# Plugin & Extension Architecture

The architecture is designed to evolve without requiring structural changes to existing business modules.

New capabilities should be introduced through composition and extension rather than modification.

The system follows the Open/Closed Principle at the architectural level:

- Open for extension.
- Closed for modification.

---

## Extension Points

The architecture defines controlled extension points.

Typical extension points include:

- Infrastructure Providers
- Authentication Providers
- Payment Providers
- Storage Providers
- Notification Providers
- Background Job Providers
- External Service Integrations

Extensions integrate through published contracts rather than direct implementation dependencies.

---

## Plugin Principles

Plugins are independently developed capabilities that integrate with the application through defined extension points.

Plugins must:

- Depend only on published capability contracts.
- Never access another module's internal implementation.
- Never bypass architectural boundaries.
- Be composed during application startup.
- Be removable without modifying existing business modules.

Plugins extend the application.

They never redefine its architecture.

---

# Architectural Invariants

The following invariants define the architectural laws of the system.

These rules are expected to remain stable throughout the lifetime of the project.

## Invariant 1

Business modules own business capabilities.

No other architectural component may own business logic.

---

## Invariant 2

Every module exposes exactly one public capability contract.

All remaining implementation details remain private.

---

## Invariant 3

Modules communicate exclusively through capability contracts.

Direct access to another module's repositories, services, models, or utilities is prohibited.

---

## Invariant 4

Business modules never depend directly on infrastructure technologies.

Technology dependencies belong to infrastructure and application composition.

---

## Invariant 5

Adapters translate protocols.

Adapters never implement business rules.

---

## Invariant 6

Infrastructure provides technical capabilities.

Infrastructure never contains business rules.

---

## Invariant 7

Application composition occurs exactly once during startup.

Modules remain immutable after composition.

---

## Invariant 8

Every dependency has a single owner.

Ownership must remain explicit throughout the application.

---

## Invariant 9

Frameworks support the architecture.

The architecture never depends on a framework.

---

## Invariant 10

Complexity must be justified.

Architectural abstractions are introduced only when supported by demonstrated application needs.

---

# Architecture Governance

This document is the authoritative specification of the runtime architecture.

Future architectural evolution must preserve the principles and invariants defined here.

Architectural changes should be deliberate, documented, and reviewed before implementation.

---

## Relationship with Architectural Decision Records (ADRs)

Architectural Decision Records (ADRs) document individual architectural decisions.

ADRs complement this document.

They do not replace it.

The relationship between architecture and implementation follows this hierarchy:

```
ARCHITECTURE.md
        │
        ▼
Architectural Principles
        │
        ▼
Architectural Invariants
        │
        ▼
Architectural Decision Records
        │
        ▼
Implementation
```

No ADR may contradict the architectural principles or invariants defined in this document.

When an architectural principle changes, the architecture document must be updated before any dependent ADRs or implementation.

---

# Architecture Decision Summary

| **Area**                  | **Decision**                       | **Rationale**                                                                     |
| :------------------------ | :--------------------------------- | :-------------------------------------------------------------------------------- |
| **Architecture Style**    | Composition-First Modular Monolith | Build a scalable, maintainable application without unnecessary complexity.        |
| **Business Organization** | Capability-Oriented Modules        | Organize code around business capabilities instead of technical layers.           |
| **Runtime Composition**   | Explicit Composition Root          | Assemble the application in a single location during startup.                     |
| **Dependency Strategy**   | Explicit Composition               | Keep dependencies visible, predictable, and easy to trace.                        |
| **Module Communication**  | Capability Contracts               | Prevent tight coupling by exposing only public contracts.                         |
| **Infrastructure**        | Replaceable Through Composition    | Allow infrastructure implementations to change without affecting business logic.  |
| **Adapters**              | Protocol Translators               | Isolate external protocols and keep business rules framework-agnostic.            |
| **Plugin Strategy**       | Extension Through Composition      | Add new capabilities without modifying existing modules.                          |
| **Public Module API**     | Capability Contracts               | Define a stable and minimal public interface for every module.                    |
| **Framework Role**        | Supporting Infrastructure          | Treat frameworks as implementation details rather than architectural foundations. |

---

# Future Evolution

The architecture intentionally leaves room for future evolution without changing its foundational principles.

Areas expected to evolve include:

- API Versioning Strategy
- Background Job Runtime
- Event Publishing Model
- Distributed Deployment
- Multi-process Coordination
- Service Extraction Strategy
- Observability Enhancements

These concerns should extend the existing architecture rather than redefine it.

---

# Closing Statement

The MERN Enterprise Starter is designed as a Composition-First Modular Monolith where business capabilities remain the center of the system.

The architecture emphasizes explicit composition, stable module boundaries, technology independence, and progressive complexity.

Every implementation within this project is expected to preserve these principles so that the architecture remains understandable, maintainable, and adaptable as the application evolves.