# ADR-0007 — Module Boundaries and Module Architecture

**Status:** Accepted

**Date:** 2026-10-01

**Decision Owners:** Project Architecture

**Scope:** API Core / Module Architecture

---

## 1. Context

The application is designed as a scalable modular monolith.

The architecture requires strong module isolation while preserving the simplicity and performance advantages of a single application process.

A module boundary must therefore provide more than directory organization.

It must define:

* Business capability ownership
* Public contracts
* Internal implementation boundaries
* Dependency direction
* Data ownership
* Transaction ownership
* Cross-module communication
* Consistency boundaries
* Scalability and performance expectations
* Future evolution toward physical separation

The architecture must also avoid creating unnecessary complexity.

Modules must not become miniature frameworks, generic shared layers, or artificial boundaries that introduce runtime overhead without architectural value.

---

## 2. Problem

Without explicit module boundaries, business capabilities tend to become coupled through:

* Internal service access
* Shared repositories
* Direct database access
* Shared persistence models
* Generic utility layers
* Circular dependencies
* Shared transaction state
* Technology-specific contracts

These relationships make ownership unclear and increase the cost of change.

They also make future scaling and physical separation more difficult.

At the same time, excessively rigid module structures can create unnecessary abstractions and runtime complexity.

The architecture therefore needs a module model that provides strong ownership and encapsulation without requiring identical internal structures or premature distributed architecture.

---

## 3. Decision

A module is an independently owned business capability with a private implementation boundary.

Each module owns:

* Business rules
* Application behavior
* Domain concepts
* Data required by its capabilities
* Persistence structures for its owned data
* Infrastructure adapters required by its implementation
* Public capability contracts

Only explicitly defined public capability contracts may cross module boundaries.

Module internals remain private.

Module boundaries are architectural dependency and ownership boundaries. They are not merely directory boundaries and are not required to correspond to deployment or process boundaries.

---

## 4. Module Ownership

A module represents a cohesive business capability.

Examples include:

```text
Users
Orders
Inventory
Payments
Notifications
```

The module owns the rules and implementation necessary to provide its capability.

A module must not become a general-purpose container for unrelated business functionality.

Repeatedly shared business responsibilities should trigger an ownership review rather than automatically being moved into a generic shared module.

---

## 5. Public Capability Contracts

A module exposes its capabilities through explicit public contracts.

Consumers may depend only on these contracts.

A capability contract should expose the smallest stable capability required by consumers.

It must not expose:

* Repository implementations
* Database models
* Persistence structures
* Internal application services
* Infrastructure implementations
* Framework abstractions
* Database sessions
* Transaction handles
* Internal utilities

Capability contracts describe **what** the module provides rather than **how** it implements that capability.

---

## 6. Module Encapsulation

All implementation details outside the public capability surface remain private.

Other modules must not directly access:

* Internal services
* Repositories
* Domain implementation details
* Persistence models
* Database collections or tables
* Infrastructure adapters
* Internal utilities

Directory structure alone does not establish encapsulation.

The architecture depends on explicit public surfaces and dependency rules.

---

## 7. Module Communication

Modules communicate through explicit public capabilities or intentional asynchronous contracts.

### 7.1 Synchronous Communication

Synchronous capability invocation is the default when an immediate result is required.

Examples include:

* Authentication
* Authorization
* Stock reservation
* Payment authorization
* Capability-oriented reads

Synchronous communication is preferred when it provides a clearer and simpler execution model.

### 7.2 Asynchronous Communication

Asynchronous events may be used when:

* Immediate results are unnecessary
* Independent processing is beneficial
* Consumers should remain decoupled
* Eventual consistency is acceptable

Events are public contracts owned by the module that defines the corresponding business capability or state transition.

Events must not become an implicit replacement for understandable application workflows.

---

## 8. Module Dependency Direction

Module dependencies must follow capability ownership and explicit use-case requirements.

A module may depend only on another module's public capabilities.

Dependency cycles are prohibited.

A cycle must not be hidden through:

* Lazy dependency resolution
* Service locators
* Runtime container tricks
* Other dependency-resolution mechanisms

Cycles must instead be resolved through:

* Responsibility reassignment
* Capability redesign
* Ownership changes
* Application-level orchestration
* Explicit architectural boundaries

Application-level orchestration may coordinate multiple module capabilities without taking ownership of their internal business rules.

---

## 9. Data Ownership

Each business module owns the data required to implement its capabilities.

For example:

```text
Users     → user data
Orders    → order data
Inventory → inventory data
Payments  → payment data
```

A shared physical database does not imply shared logical data ownership.

A module must not directly access another module's:

* Collections
* Tables
* Persistence models
* Repositories
* Queries
* Database-specific transaction state

A module may store an identity reference such as:

```text
order.userId
```

without owning the User entity or its persistence representation.

Cross-module reads and writes must occur through the owning module's public capability or through an explicitly designed cross-module contract.

---

## 10. Shared Infrastructure

Infrastructure may be physically shared without becoming shared business ownership.

For example:

```text
MongoDB connection pool
Redis client
Logger
HTTP client
```

may be shared infrastructure resources.

However:

```text
Users
Orders
Payments
```

retain independent ownership of their business data and capabilities.

Shared resources therefore do not imply shared ownership.

---

## 11. Transaction Boundaries

A module normally owns the transaction boundary for the data and business invariants it owns.

A database transaction is a technical mechanism.

A business transaction may span multiple modules without requiring one shared database transaction.

Cross-module workflows must therefore be coordinated explicitly.

Cross-module atomic transactions are exceptional.

They require explicit architectural justification and must not become the normal mechanism for module communication.

Transaction infrastructure must not be exposed through public capability contracts.

Repeated requirements for cross-module atomicity are a signal to reassess:

* Module boundaries
* Data ownership
* Business invariants
* Consistency boundaries

---

## 12. Consistency Model

The architecture does not prescribe one universal consistency mechanism.

Depending on the business requirement, a cross-module workflow may use:

```text
Local transaction
      ↓
Synchronous capability
      ↓
Asynchronous event
      ↓
Compensation / recovery
```

The appropriate mechanism is determined by the business consistency requirement.

The guiding principle is:

> Use the least expensive mechanism that guarantees the required business consistency.

---

## 13. Transactional Outbox

When a committed local state change must reliably produce an asynchronous event, a transactional outbox may be used.

Conceptually:

```text
BEGIN
    update business state
    create outbox record
COMMIT
```

A separate publisher then delivers the event.

The outbox solves the database-write/event-publication dual-write problem.

It does not guarantee exactly-once delivery.

The expected delivery model should therefore support idempotent consumers where duplicate delivery is possible.

The project must not introduce an outbox implementation merely because events exist.

Its use must be justified by reliability requirements.

---

## 14. Idempotency and Retries

Asynchronous consumers must tolerate duplicate delivery when the delivery mechanism provides at-least-once semantics.

Retryable operations must be designed so that repeated execution does not incorrectly repeat business effects.

Idempotency may be required for:

* Event consumers
* HTTP operations
* Background jobs
* Webhooks
* External service interactions

Retry behavior must also define a terminal failure strategy so that permanently failing operations do not consume resources indefinitely.

---

## 15. Compensation

A local transaction can roll back uncommitted database changes.

It cannot automatically undo an already committed operation in another module or an external system.

When a cross-module workflow partially succeeds, compensation may be required.

For example:

```text
Create Order
      ↓
Reserve Inventory
      ↓
Payment Fails
      ↓
Release Inventory
      ↓
Cancel Order
```

Compensation is a business operation rather than a database rollback.

It should be introduced only when the workflow requires recovery from committed intermediate states.

---

## 16. Scalability and Performance

Module boundaries must remain efficient under expected workload.

Performance problems must not be solved by bypassing module ownership.

The preferred optimization progression is:

```text
Direct capability
      ↓
Bulk capability
      ↓
Caching
      ↓
Asynchronous processing
      ↓
Owned projection / read model
      ↓
Physical data separation
      ↓
Independent service
```

This is an evolution path rather than a mandatory sequence.

Each step should be introduced only when justified by actual workload, latency, throughput, or scaling requirements.

---

## 17. Bulk Capability Operations

A module contract should support appropriate bulk operations when consumers legitimately require multiple records.

For example:

```text
getUser(id)
```

may be complemented by:

```text
getUsersByIds(ids[])
```

when a consumer legitimately needs multiple users.

Bulk capability operations preserve ownership while avoiding unnecessary N+1 interactions.

Consumers must not bypass the module boundary by querying its database directly to solve an N+1 problem.

---

## 18. Caching

Caching may duplicate information without transferring business ownership.

A module may maintain cached representations of information it consumes when justified by performance requirements.

Cache ownership must remain explicit.

Shared cache infrastructure does not imply shared business ownership.

Caching strategies must account for invalidation, staleness, and consistency requirements.

---

## 19. Projections and CQRS

The architecture does not require CQRS or projections merely because modules have independent data ownership.

A direct capability is preferred when it satisfies the workload.

A projection or read model may be introduced when requirements such as:

* high read volume
* complex read patterns
* latency requirements
* reporting workloads
* independent scaling
* reduced runtime coupling

justify the additional complexity.

Projections should remain owned by the capability that uses them.

---

## 20. Runtime Dependency Depth

Architectural dependency does not necessarily imply a runtime call on every execution.

However, deep synchronous call chains should be treated as a scalability and coupling signal.

For example:

```text
Orders
  ↓
Users
    ↓
Permissions
      ↓
Tenant
```

may introduce unnecessary latency and resource consumption.

Where independent capabilities are required, application orchestration may execute them concurrently when safe and when resource capacity permits.

Parallel execution must not be introduced blindly because concurrency can increase resource contention.

---

## 21. Future Physical Separation

Logical module boundaries are independent of physical deployment.

The application may initially run as:

```text
One Process
    ↓
Modular Monolith
    ↓
Shared Database Infrastructure
```

while preserving logical ownership.

A future architecture may evolve toward:

```text
Orders Service
    ↓
Orders Database

Users Service
    ↓
Users Database
```

without requiring the logical capability model to be redesigned.

Physical separation is an evolutionary option, not an architectural requirement.

---

## 22. Distributed Monolith Risk

A module boundary must not be evaluated solely by whether the module could technically be extracted.

If modules depend on each other through deep synchronous call chains, shared transactions, or shared persistence, extracting them may produce a distributed monolith.

Therefore extraction should follow mature ownership boundaries rather than precede them.

A healthy module should minimize hidden coupling while remaining appropriate for the current modular-monolith deployment model.

---

## 23. Internal Module Structure

Modules do not require identical internal structures.

A simple capability may use a small implementation.

A complex capability may require explicit separation of:

* Application behavior
* Domain logic
* Persistence
* Infrastructure adapters
* Public contracts

Architectural consistency does not require identical folder structures.

The project follows progressive complexity:

> Structure is introduced when it provides meaningful architectural value.

The architecture does not require a `domain`, `application`, `infrastructure`, or similar directory in every module merely for structural symmetry.

---

## 24. Module Evolution

A module may evolve as its complexity, responsibility, change rate, consistency requirements, or scaling characteristics change.

A module should be reconsidered when:

* It owns unrelated capabilities
* Its dependency graph becomes difficult to control
* Its data ownership becomes unclear
* It repeatedly requires cross-module transactions
* Its scaling characteristics diverge from neighboring capabilities
* Its change patterns materially diverge
* Its public contract becomes excessively broad

Module decomposition must follow meaningful ownership and responsibility boundaries rather than file count alone.

---

## 25. Alternatives Considered

### 25.1 Technical-Layer Modules

Example:

```text
controllers/
services/
repositories/
```

Rejected because technical layers do not establish business capability ownership.

---

### 25.2 Identical Internal Structure for Every Module

Rejected because it introduces unnecessary ceremony and forces complexity onto simple capabilities.

---

### 25.3 Generic Shared Business Module

Rejected because it becomes an implicit dependency center and weakens ownership.

---

### 25.4 Direct Cross-Module Database Access

Rejected because it violates data ownership and couples consumers to persistence implementation.

---

### 25.5 Universal Event-Driven Communication

Rejected because asynchronous events introduce operational and consistency complexity and are unnecessary when synchronous capability invocation provides the required behavior.

---

### 25.6 Universal Cross-Module Transactions

Rejected because large transaction scopes increase coupling, contention, failure propagation, and future extraction difficulty.

---

### 25.7 Immediate Microservice Separation

Rejected because physical distribution introduces network, operational, and consistency complexity before the system demonstrates a need for it.

---

### 25.8 CQRS and Projections Everywhere

Rejected because projections add synchronization and operational complexity and are not necessary for every module interaction.

---

## 26. Consequences

### Positive Consequences

This decision provides:

* Clear capability ownership
* Strong module encapsulation
* Explicit public contracts
* Controlled dependency direction
* Independent data ownership
* Clear transaction ownership
* Better change isolation
* A scalable optimization path
* Framework-independent module boundaries
* A foundation for future physical separation
* Protection against accidental distributed architecture

### Trade-offs

The architecture introduces:

* More explicit design work
* The need to maintain public capability contracts
* Additional consideration for cross-module consistency
* Potential use of outbox, idempotency, retries, and compensation
* The need to evaluate performance without bypassing boundaries
* More deliberate module decomposition

These costs are accepted because implicit coupling creates significantly greater long-term architectural risk.

---

## 27. Architectural Invariants

The following invariants are mandatory.

### Invariant 1 — Capability Ownership

Each business module owns a cohesive business capability.

---

### Invariant 2 — Private Implementation

Module implementation details remain private.

Only explicitly defined public capabilities may cross the module boundary.

---

### Invariant 3 — Public Contract Ownership

The module providing a capability owns its public capability contract.

Consumers must depend on the provider's contract rather than redefine its internal interface.

---

### Invariant 4 — Dependency Direction

Modules may depend only on the public capabilities of other modules.

Dependency cycles are prohibited.

---

### Invariant 5 — Data Ownership

Each business module owns the data and persistence structures required for its capabilities.

---

### Invariant 6 — Persistence Encapsulation

A module must not directly access another module's persistence structures.

---

### Invariant 7 — Transaction Ownership

A module normally owns the transaction boundary for its data and business invariants.

Cross-module atomic transactions are exceptional.

---

### Invariant 8 — Explicit Communication

Cross-module communication must use explicit public capabilities or intentional asynchronous contracts.

---

### Invariant 9 — Boundary-Preserving Performance

Performance optimizations must preserve module ownership and public boundaries wherever practical.

---

### Invariant 10 — Progressive Complexity

Additional architectural mechanisms must be introduced only when justified by actual requirements.

---

### Invariant 11 — Deployment Independence

Logical module boundaries are independent of physical deployment.

---

### Invariant 12 — No Generic Business Dependency Center

A generic shared business module must not become an implicit dependency center.

---

## 28. Relationship to Previous Decisions

This decision builds on the existing architecture decisions.

### Application Boundary

The module architecture operates inside the established application/process boundary.

### Application Entry Point

Modules are composed through the established application entry point.

### Bootstrap Contract

Modules participate in application startup through the established bootstrap contract without owning application startup.

### Composition Root

The Composition Root creates modules and wires their dependencies.

Modules do not construct or locate their own dependencies.

### Configuration Architecture

Modules receive only the configuration required for their responsibilities.

They do not access configuration sources directly.

### Dependency Injection and Resolution

Dependencies are supplied explicitly.

Constructor injection remains the default.

Dependency resolution remains composition infrastructure and must not bypass module boundaries.

---

## 29. Relationship to Execution Context

Execution Context is an execution infrastructure capability rather than a business module.

Modules may consume execution metadata through its defined contract where required.

Modules must not redefine execution identity or use Execution Context as a dependency-resolution mechanism.

Execution Context therefore supports module execution without becoming part of module ownership.

---

## 30. Decision Summary

The project will use a capability-oriented modular architecture.

Each module owns a cohesive business capability, its business rules, data, persistence, transactions, and required implementation details.

Only explicit public capability contracts and intentional asynchronous contracts may cross module boundaries.

Module dependencies must be directed and acyclic.

Transactions normally remain within module-owned consistency boundaries.

Cross-module workflows are coordinated explicitly, with synchronous capabilities, asynchronous events, compensation, outbox, and idempotency introduced only when justified.

Performance optimization must preserve ownership through mechanisms such as bulk capabilities, caching, asynchronous processing, and projections when required.

Modules may use different internal structures according to their complexity.

Logical module boundaries remain independent from physical deployment, preserving the option for future extraction without requiring premature distribution.

This establishes module boundaries that are explicit, scalable, performance-aware, framework-independent, and consistent with the project's Composition-First and No Magic principles.
