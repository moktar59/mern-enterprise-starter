# Execution Context

## 1. Purpose

The Execution Context provides a consistent representation of the identity and trusted metadata associated with an independent unit of work.

It allows application components to access execution-scoped information without requiring that information to be explicitly passed through every application-layer function.

The Execution Context is an architectural concept. Its runtime propagation mechanism is an implementation detail and must remain behind the appropriate infrastructure boundary.

This document defines the architectural model, contracts, lifecycle, propagation semantics, ownership rules, security model, and integration boundaries for Execution Context within the application.

---

## 2. Problem Statement

Application execution frequently crosses multiple layers and asynchronous operations.

A single execution may pass through:

```text
HTTP Request
    │
    ▼
Middleware
    │
    ▼
Controller
    │
    ▼
Application Service
    │
    ├── Repository
    ├── External Service
    └── Background Operation
```

Multiple executions may occur concurrently and may follow the same application path.

Without an explicit execution-scoped model, components may have to pass execution metadata through unrelated function parameters, or they may depend on global mutable state.

Both approaches create architectural problems.

Explicitly passing every piece of execution metadata can cause unrelated application interfaces to become polluted with infrastructure concerns.

Global mutable state can cause execution data to leak between concurrent operations.

The application therefore requires an explicit model that:

* identifies an independent execution
* carries trusted execution-scoped metadata
* remains isolated between concurrent executions
* supports asynchronous execution
* has clear ownership and lifecycle rules
* does not couple application code to a specific runtime propagation mechanism

The Execution Context addresses these requirements.

---

## 3. Architectural Model

An Execution Context belongs to an independent execution.

The high-level model is:

```text
Execution Boundary
        │
        │ creates
        ▼
ExecutionContext
        │
        │ propagated through execution
        ▼
Application Components
        │
        ├── Application Logic
        ├── Infrastructure
        └── Observability Integrations
```

The Execution Context is not a general-purpose dependency container.

It is not:

* application state
* a service locator
* a transaction container
* a logging container
* a tracing implementation
* a cancellation mechanism
* a replacement for explicit business parameters

The context exists specifically to represent metadata that belongs to the execution itself.

The architecture separates the conceptual model from the runtime mechanism:

```text
Execution Context
        │
        ▼
Context Contract
        │
        ▼
Infrastructure Implementation
        │
        ▼
Runtime Propagation Mechanism
```

The underlying runtime mechanism may change without changing the architectural meaning of Execution Context.

---

## 4. Execution Boundary

An execution boundary is the point at which an independent unit of work enters the application runtime.

The execution boundary is responsible for establishing the execution environment and creating the initial Execution Context.

Examples include:

* HTTP request handling
* background job processing
* message consumption
* scheduled task execution
* explicitly initiated independent asynchronous work

The boundary determines when a new execution begins.

Internal application calls do not automatically constitute new execution boundaries.

For example:

```text
HTTP Request
    │
    ▼
Controller
    │
    ▼
Application Service
    │
    ▼
Repository
```

All of these operations belong to the same execution unless the architecture explicitly defines otherwise.

Execution boundaries therefore establish the ownership point for context creation.

Only the component responsible for an execution boundary may create the initial Execution Context for that execution.

---

## 5. Execution Lifecycle

An Execution Context follows the lifecycle of the execution that owns it.

The lifecycle is:

```text
Create
  │
  ▼
Initialize
  │
  ▼
Enrich
  │
  ▼
Execute
  │
  ▼
Complete
  │
  ▼
Release
```

### Create

The execution boundary creates the initial Execution Context.

### Initialize

Initial execution metadata is established.

This may include:

* execution identity
* correlation information
* execution source
* trusted boundary metadata

### Enrich

Additional trusted information becomes available during execution.

For example, authentication may establish the principal associated with the execution.

Enrichment updates the existing execution context. It does not create a new execution.

### Execute

Application processing occurs within the context.

Application components may read context information required for their responsibilities.

### Complete

The execution reaches a successful or unsuccessful terminal state.

### Release

The context is no longer associated with the completed execution.

The lifecycle of the context must never outlive the lifecycle of its owning execution.

---

## 6. Execution Identity

Every independent execution must have an Execution Identity.

The Execution Identity provides a stable identifier for the lifetime of that execution.

Conceptually:

```text
Execution
    │
    └── executionId
```

The identifier is not a business identifier.

It exists to identify the execution itself.

Execution Identity may be used for:

* operational diagnostics
* structured logging
* error correlation
* audit metadata
* tracing integration
* debugging concurrent execution behavior

An Execution Identity must not be interpreted as authentication or authorization by itself.

A valid execution identifier does not establish who initiated the execution or what that execution is permitted to do.

---

## 7. ExecutionContext

`ExecutionContext` is the primary architectural representation of execution-scoped state.

Conceptually, it contains information such as:

```text
ExecutionContext
├── executionId
├── correlationId
├── source
├── principal
└── tenant
```

The actual implementation may contain additional metadata when justified by the architecture.

The context should remain intentionally small.

Every field must have a clear relationship to the execution.

Application state that belongs to a particular business operation must not be placed into the Execution Context merely for convenience.

The context is therefore a controlled architectural contract rather than an arbitrary key-value store.

---

## 8. ExecutionContextCreationInput

`ExecutionContextCreationInput` represents the trusted input required to establish an initial Execution Context.

Conceptually:

```text
ExecutionContextCreationInput
├── executionId
├── correlationId
├── source
└── initial trusted metadata
```

The creation input belongs to the execution boundary.

The boundary is responsible for determining which information is available and trustworthy at creation time.

External input must not automatically become trusted context data.

For example, a value supplied by an HTTP client may be used as a correlation identifier only according to the application's validation and trust rules.

`ExecutionContextCreationInput` is not intended to expose every request property.

It should contain only information required to establish execution identity and trusted initial metadata.

---

## 9. ExecutionSource

`ExecutionSource` identifies the type of boundary from which the execution originated.

Examples may include:

```text
HTTP
QUEUE
EVENT
SCHEDULE
CLI
INTERNAL
```

The exact enumeration is an application-level contract and should be expanded only when a new execution boundary requires a distinct source.

Execution source provides contextual information about the execution.

It must not be used as a substitute for authorization or authentication.

For example:

```text
source = HTTP
```

does not indicate that the caller is authenticated.

---

## 10. Principal

`Principal` represents the authenticated or otherwise trusted identity associated with an execution.

A Principal is established only after the appropriate authentication or identity-verification process has succeeded.

Conceptually:

```text
Principal
├── principalId
├── principalType
└── trusted identity metadata
```

The exact shape is defined by the authentication architecture.

An unauthenticated execution may have no Principal.

For example:

```text
ExecutionContext
├── executionId
├── source
└── principal = undefined
```

After successful authentication:

```text
ExecutionContext
├── executionId
├── source
└── principal
       └── authenticated identity
```

The existence of a Principal does not itself grant permissions.

Authorization remains the responsibility of the authorization architecture.

---

## 11. TenantContext

`TenantContext` represents the trusted tenant or organizational scope associated with an execution.

Conceptually:

```text
TenantContext
└── tenantId
```

Tenant information must be established through an appropriate trusted resolution mechanism.

An externally supplied tenant identifier must not automatically be treated as trusted tenant context.

Tenant resolution may depend on:

* authenticated identity
* domain or host information
* validated request metadata
* application-specific tenant resolution rules

The Execution Context carries the resolved tenant identity but does not perform tenant authorization itself.

The authorization layer remains responsible for determining whether the Principal may operate within the resolved tenant.

---

## 12. ExecutionContextFactory

`ExecutionContextFactory` is responsible for creating an Execution Context from a valid `ExecutionContextCreationInput`.

Conceptually:

```text
ExecutionContextCreationInput
             │
             ▼
   ExecutionContextFactory
             │
             ▼
       ExecutionContext
```

The factory owns construction rules.

It does not own:

* HTTP request handling
* authentication
* authorization
* business logic
* persistence
* logging implementation

The factory must establish a valid initial context according to the Execution Context contract.

Context creation must occur only through an execution boundary or a component explicitly responsible for creating a new independent execution.

---

## 13. ExecutionContextScope

`ExecutionContextScope` represents the lifetime and propagation scope of an Execution Context.

A scope establishes which asynchronous operations belong to the execution.

Conceptually:

```text
ExecutionContextScope
        │
        ├── operation A
        ├── operation B
        ├── async operation C
        └── operation D
```

All operations belonging to the same scope observe the same execution context.

A scope must not allow one concurrent execution to observe another execution's context.

The scope is an infrastructure concern.

Application modules consume the context through its contract rather than managing the underlying scope mechanism directly.

---

## 14. AsyncLocalStorage

Node.js `AsyncLocalStorage` may be used to implement Execution Context propagation.

`AsyncLocalStorage` is not the Execution Context itself.

The architectural distinction is:

```text
ExecutionContext
    = application-level architectural concept

AsyncLocalStorage
    = Node.js runtime implementation mechanism
```

Application and business modules must not directly depend on `AsyncLocalStorage`.

The dependency must remain behind the execution infrastructure abstraction.

This allows the propagation mechanism to change without requiring changes throughout the application.

`AsyncLocalStorage` must also be used in a manner that preserves isolation between concurrent executions.

---

## 15. Context Creation and Enrichment

Context creation and context enrichment are separate operations.

### Creation

Creation establishes the initial execution context at the execution boundary.

### Enrichment

Enrichment adds trusted information to the existing context as the execution progresses.

For example:

```text
Execution Boundary
        │
        ▼
Create Context
        │
        ▼
Authenticate
        │
        ▼
Enrich Principal
        │
        ▼
Resolve Tenant
        │
        ▼
Enrich TenantContext
        │
        ▼
Application Execution
```

Enrichment does not create a new execution.

Only explicitly authorized components may enrich the context.

Enrichment must follow the trust model defined by this architecture.

---

## 16. Context Immutability

Execution Context should be immutable from the perspective of ordinary consumers.

Consumers may read context information but must not arbitrarily mutate it.

Changes to context must occur through controlled context operations.

This provides:

* predictable state transitions
* explicit ownership
* reduced accidental mutation
* stronger concurrent execution guarantees
* easier testing

The complete context must not be replaced by an arbitrary application component.

Context enrichment must be explicit.

---

## 17. Context Conflict Rules

Context enrichment may encounter information that conflicts with information already present in the context.

Conflicts must not be resolved through silent overwriting.

Examples include:

```text
Existing tenantId
        ≠
New tenantId
```

or:

```text
Existing principal
        ≠
New principal
```

The architecture must define whether a field is:

* immutable after creation
* enrichable once
* enrichable under controlled replacement
* invalid when conflicting

Identity-related fields should generally be treated as immutable once established.

If trusted sources produce conflicting identity information, the execution should fail explicitly rather than silently replacing the existing value.

This prevents context mutation from becoming a mechanism for changing execution identity.

---

## 18. Security and Trust Model

Execution Context contains trusted and potentially security-sensitive metadata.

Trust must therefore be established explicitly.

The architecture distinguishes between:

```text
External Input
      │
      ▼
Validation / Verification
      │
      ▼
Trusted Context Data
```

External input is not trusted merely because it has been placed into the context.

Security-sensitive values must not be stored unnecessarily.

In particular, the context must not contain:

* passwords
* raw authentication credentials
* access tokens when unnecessary
* refresh tokens
* secrets

The context must not bypass:

* input validation
* authentication
* authorization
* tenant isolation
* security policy enforcement

The Execution Context provides trusted execution metadata to those systems; it does not replace them.

---

## 19. Async and Concurrency Semantics

Execution Context must remain associated with the correct execution across asynchronous operations.

For concurrent executions:

```text
Execution A ───────► Context A
Execution B ───────► Context B
Execution C ───────► Context C
```

No execution may observe another execution's context.

This requirement applies to asynchronous operations including:

* Promises
* `async` / `await`
* timers
* I/O operations
* framework callbacks
* database operations
* external service calls

Asynchronous scheduling must not change execution identity.

An asynchronous operation remains part of the current execution unless it explicitly represents a new execution boundary.

---

## 20. Independent Asynchronous Work

Independent asynchronous work represents a new execution.

Examples include:

* background jobs
* scheduled tasks
* independently consumed messages
* work submitted to a separate execution system
* explicitly detached execution

Such work must establish a new Execution Context.

Selected metadata may be intentionally propagated when required.

For example:

```text
Parent Execution
    │
    ├── executionId = A
    └── correlationId = C
            │
            │ enqueue
            ▼
      Background Job
            │
            ├── executionId = B
            └── correlationId = C
```

The background job receives a new execution identity.

It must not implicitly inherit the complete parent context.

This distinction preserves independent execution lifecycle and isolation.

---

## 21. Queue and Event Executions

Each queue message or event handler invocation represents an independent execution unless the architecture explicitly defines otherwise.

A worker receiving a message should therefore establish a new Execution Context.

Conceptually:

```text
Message
   │
   ▼
Queue Boundary
   │
   ▼
Create ExecutionContext
   │
   ▼
Process Message
   │
   ▼
Complete Execution
```

Correlation metadata may be propagated from the producer when required for observability.

Execution identity must be newly established for the consumer execution.

A message payload must not be treated as trusted context metadata without appropriate validation.

---

## 22. Worker Threads

Worker threads represent a separate execution environment.

Execution Context must not be assumed to propagate automatically across worker-thread boundaries.

When work is transferred to a worker thread, the worker must establish its own Execution Context according to the execution-boundary contract.

Explicit metadata may be transferred when required.

The receiving worker must validate and establish that metadata within its own execution context.

The worker must not implicitly share mutable context state with the originating execution.

---

## 23. Database Transactions

Database transactions are not part of the Execution Context.

A transaction may exist within an execution:

```text
ExecutionContext
       │
       └── Application Operation
                │
                └── Database Transaction
```

but the two concepts have different lifecycles and responsibilities.

An Execution Context identifies and describes the execution.

A database transaction controls database consistency and atomicity.

A transaction must therefore not be stored in the Execution Context merely to make it globally accessible.

Transaction propagation must follow the database and application transaction architecture.

---

## 24. Logging

Logging may consume Execution Context metadata to provide execution correlation.

For example:

```text
{
  executionId,
  correlationId,
  message
}
```

The logging infrastructure may automatically attach appropriate context metadata to structured logs.

Business modules should not need to know how context metadata reaches the logging system.

Sensitive context data must not be logged automatically.

Logging remains an infrastructure concern.

---

## 25. Distributed Tracing

Distributed tracing is related to Execution Context but is not the same architectural concept.

Tracing may use execution metadata to correlate operations.

For example:

```text
Execution Context
       │
       └── correlation metadata
                │
                ▼
        Tracing Integration
                │
                ▼
          Trace / Span
```

Trace identifiers and span state should not be treated as arbitrary Execution Context fields merely because both concepts are execution-related.

The tracing infrastructure owns tracing-specific state.

The Execution Context may provide integration points for correlation without becoming a tracing implementation.

---

## 26. Cancellation and Timeouts

Cancellation and timeout state are not inherently part of Execution Context.

A request may have:

* a timeout
* an abort signal
* a cancellation condition

without those concepts becoming properties of the Execution Context itself.

Cancellation must be propagated through the appropriate cancellation mechanism.

Timeout enforcement must remain the responsibility of the component or infrastructure layer that owns the relevant operation.

Execution Context may provide execution identity for diagnostics related to cancellation, but it must not become the cancellation mechanism.

---

## 27. Graceful Shutdown

Graceful shutdown must respect active execution lifecycles.

When shutdown begins:

```text
Shutdown Signal
      │
      ▼
Stop Accepting New Executions
      │
      ▼
Allow Active Executions to Complete
      │
      ▼
Release Execution Contexts
      │
      ▼
Terminate Process
```

New execution boundaries should stop accepting work according to the application's shutdown policy.

Existing executions should be allowed to complete within configured limits.

Execution Context itself does not control shutdown.

It provides execution identity and metadata that may assist shutdown diagnostics and operational visibility.

---

## 28. Testing Strategy

The Execution Context architecture must be tested at both contract and integration levels.

Tests should verify:

### Context Creation

* a context is created at a valid execution boundary
* required execution identity exists
* invalid creation input is rejected

### Context Access

* the current context can be accessed inside an execution
* context access fails explicitly outside a required execution scope

### Isolation

* concurrent executions receive independent contexts
* one execution cannot observe another execution's context

### Enrichment

* authorized enrichment succeeds
* unauthorized mutation is prevented
* conflicting identity information is rejected

### Async Propagation

* context remains available across supported asynchronous operations
* context remains associated with the correct execution

### Independent Execution

* background work receives a new execution identity
* explicitly propagated metadata is preserved according to contract
* the parent context is not implicitly shared

### Lifecycle

* context exists for the lifetime of its execution
* completed executions do not retain active context scope

Tests must verify architectural behavior rather than implementation details whenever possible.

---

## 29. Dependency Rules

Execution Context follows the project's dependency ownership principles.

The dependency direction is:

```text
Execution Boundary
        │
        ▼
Execution Infrastructure
        │
        ▼
Execution Context Contract
        ▲
        │
Application Components
```

The following rules apply:

1. Business modules must not depend directly on `AsyncLocalStorage`.
2. Business modules must not create Execution Contexts.
3. Business modules must not manage context lifecycle.
4. Context creation belongs to execution-boundary infrastructure.
5. Context propagation belongs to execution infrastructure.
6. Context access occurs through the defined contract.
7. Context enrichment is controlled by the context API.
8. Runtime-specific implementation details must remain behind infrastructure boundaries.
9. Execution Context must not become a service locator.
10. Dependencies must have a clear owner.

The architecture must remain compatible with the project's modular-monolith dependency rules.

---

## 30. Architectural Invariants

The following invariants are mandatory.

1. Every independent execution has exactly one active Execution Context.
2. An Execution Context belongs to one execution.
3. Execution Context creation occurs only at an execution boundary.
4. Internal application components do not create execution contexts.
5. Context identity cannot be silently replaced.
6. Concurrent executions remain isolated.
7. Asynchronous operations belonging to an execution retain that execution's context.
8. Independent asynchronous work establishes a new execution context.
9. Parent execution context is never implicitly shared with an independent execution.
10. Context enrichment does not create a new execution.
11. Context consumers cannot arbitrarily mutate the complete context.
12. External input is not trusted merely because it exists in the context.
13. Authentication establishes Principal identity.
14. Authorization determines permissions.
15. Tenant resolution establishes trusted tenant context.
16. Database transactions are separate from Execution Context.
17. Distributed tracing is separate from Execution Context.
18. Cancellation and timeout mechanisms are separate from Execution Context.
19. `AsyncLocalStorage` is an implementation mechanism, not the architectural contract.
20. Business modules do not depend directly on runtime propagation mechanisms.
21. Context lifetime does not exceed execution lifetime.
22. Execution Context does not become a general-purpose application state container.

Any implementation that violates these invariants requires an explicit architectural decision.

---

## 31. Integration Examples

### HTTP Execution

```text
HTTP Request
     │
     ▼
HTTP Execution Boundary
     │
     ▼
Create Execution Context
     │
     ├── executionId
     ├── correlationId
     └── source = HTTP
     │
     ▼
Authentication
     │
     ▼
Enrich Principal
     │
     ▼
Tenant Resolution
     │
     ▼
Enrich TenantContext
     │
     ▼
Application Service
     │
     ▼
Response
     │
     ▼
Execution Complete
```

### Background Job

```text
Queue Message
     │
     ▼
Queue Execution Boundary
     │
     ▼
Create New Execution Context
     │
     ├── new executionId
     ├── propagated correlationId
     └── source = QUEUE
     │
     ▼
Process Job
     │
     ▼
Execution Complete
```

### Internal Application Call

```text
Execution Context A
       │
       ▼
Controller
       │
       ▼
Application Service
       │
       ▼
Domain Logic
       │
       ▼
Repository
```

No new Execution Context is created merely because execution crosses application layers.

### Independent Asynchronous Work

```text
Execution A
    │
    └── Initiates independent work
                │
                ▼
          Execution Boundary
                │
                ▼
          Execution Context B
```

The independent work receives its own execution identity.

Only explicitly permitted metadata may cross the boundary.

---

## 32. Future Considerations

The Execution Context architecture is intentionally designed to allow future integration without changing its core contract.

Potential future considerations include:

* distributed execution propagation
* additional execution sources
* richer tenant models
* advanced observability integrations
* execution-level metrics
* workflow execution
* saga or orchestration metadata
* platform-level request correlation
* additional runtime environments

Future capabilities must not be added to the Execution Context merely because they are associated with an execution.

Each proposed addition must first answer:

1. Does this information fundamentally belong to the execution?
2. Does the information require execution-wide availability?
3. Does adding it preserve context simplicity?
4. Does it introduce coupling to another infrastructure concern?
5. Does it require a separate architectural abstraction?

If a capability has its own lifecycle, ownership, or semantics, it should normally remain a separate architectural concern and integrate with Execution Context through an explicit boundary.

The Execution Context should remain small, stable, and focused on execution identity and trusted execution-scoped metadata.
