# Execution Architecture

This document defines how a logical execution is created, represented, propagated, and completed within the application.

The execution model provides a consistent foundation for HTTP requests, background jobs, scheduled jobs, message consumers, CLI commands, event handlers, and other externally initiated executions.

The architecture separates:

* **Execution Context** — information associated with the current execution.
* **Execution Scope** — controlled propagation and access to the current context.
* **Execution Boundary** — where an execution begins and its context is established.
* **Execution Lifecycle** — the stages an execution passes through from entry to completion.

---

# 1. Execution Context

`ExecutionContext` is a foundational runtime abstraction.

It represents information associated with the current logical execution.

Typical information may include:

* Execution ID
* Correlation ID
* Causation ID
* Principal
* Tenant
* Locale
* Request metadata
* Trusted execution metadata

The context is designed to be:

* Immutable
* Explicit
* Execution-scoped
* Propagated across asynchronous execution
* Safe to consume from infrastructure
* Independent of HTTP-specific objects

Conceptually:

```text
                 ExecutionContext
                        │
        ┌───────────────┼────────────────┐
        │               │                │
   executionId    correlationId      principal
                                      │
                                    tenant
```

Execution context represents execution metadata. It is not a container for arbitrary business state, dependencies, secrets, or application data.

---

## 1.1 Context Creation

Execution contexts are created through a dedicated factory.

```ts
ExecutionContextFactory.create(input)
```

Context creation establishes the initial trusted execution identity for a logical execution.

Creation is different from enrichment.

The component responsible for establishing an execution boundary owns initial context creation.

Internal application services should not independently create a new context for an execution that is already in progress.

---

## 1.2 Context Enrichment

Trusted infrastructure may derive a new context containing additional trusted information.

The context remains immutable.

Conceptually:

```ts
const enriched = context.withPrincipal(principal);
```

produces a new context rather than modifying the existing context.

Typical enrichment may include:

```text
Initial Context
      │
      ├── Request Metadata
      │
      ├── Principal
      │
      ├── Tenant
      │
      └── Locale
```

Enrichment must use explicit contracts.

Security-sensitive information such as principal and tenant identity must have controlled write semantics and must not be arbitrarily overwritten later in the execution lifecycle.

---

# 2. Execution Context Scope

`ExecutionContextScope` provides controlled access to the context associated with the current logical execution.

The application depends on the scope abstraction rather than on a runtime-specific propagation mechanism.

Conceptually:

```ts
ExecutionContextScope.run(context, operation)
```

establishes the supplied context for the duration of the logical operation.

A scope may provide:

```ts
interface ExecutionContextScope {
  run<T>(
    context: ExecutionContext,
    operation: () => T
  ): T;

  getCurrent(): ExecutionContext | undefined;

  requireCurrent(): ExecutionContext;
}
```

The exact interface may evolve during implementation, but the architectural responsibility remains stable.

---

## 2.1 Scope Ownership

The execution boundary establishes the initial scope.

Application services consume the current context through the application-owned abstraction.

Business modules must not directly manage the lifetime of the execution scope.

Conceptually:

```text
Execution Boundary
        │
        ▼
Create Context
        │
        ▼
Establish Scope
        │
        ▼
Application Execution
        │
        ▼
Scope Ends
```

---

## 2.2 Deliberate Scope Restrictions

The public scope abstraction should not encourage arbitrary mutable operations such as:

```ts
set()
clear()
enterWith()
```

The objective is to prevent execution context from becoming uncontrolled mutable global state.

Context lifetime and ownership should remain explicit.

---

# 3. Asynchronous Context Propagation

The execution context must remain isolated across concurrent asynchronous executions.

For Node.js, `AsyncLocalStorage` may provide the underlying runtime mechanism.

However:

> **AsyncLocalStorage is infrastructure, not the application contract.**

The application depends on:

```text
ExecutionContext
ExecutionContextFactory
ExecutionContextScope
```

rather than directly depending on Node.js `AsyncLocalStorage`.

Conceptually:

```text
Application
    │
    ▼
ExecutionContextScope
    │
    ▼
AsyncLocalStorage
    │
    ▼
Node.js Runtime
```

This keeps the application contract independent of the underlying propagation mechanism.

---

## 3.1 Isolation

Concurrent executions must not observe one another's context.

For example:

```text
Request A ──────► Context A
                    │
                    └── async work A

Request B ──────► Context B
                    │
                    └── async work B
```

Context A must never become visible to Request B, and vice versa.

Isolation is an architectural requirement, not merely an implementation detail.

---

# 4. Execution Boundary

An execution boundary defines where a logical execution begins and where its execution context is established.

Typical execution boundaries include:

* HTTP requests
* Background jobs
* Scheduled jobs
* Message consumers
* CLI commands
* Event handlers
* Other externally initiated executions

The boundary is responsible for establishing the execution foundation before application execution begins.

Conceptually:

```text
External Trigger
      │
      ▼
Execution Boundary
      │
      ├── normalize input
      ├── create context
      ├── establish scope
      └── execute operation
                │
                ▼
           Application
```

Internal application services normally consume the current execution context rather than creating a new one.

---

## 4.1 Boundary Responsibilities

An execution boundary may be responsible for:

1. Receiving an external trigger.
2. Translating the external input into an application-level input.
3. Creating the initial execution context.
4. Establishing the execution scope.
5. Performing trusted context enrichment.
6. Invoking the application operation.
7. Translating the result or error back to the external protocol.
8. Completing the execution scope.

The boundary must not become a location for business rules.

Adapters translate protocols; business capabilities remain inside the application modules.

---

# 5. Execution Input and Execution Context

`ExecutionInput` and `ExecutionContext` represent different concerns.

### ExecutionInput

Describes **what is being executed**.

Examples:

```text
Create User
Authenticate Credentials
Process Payment
Send Notification
```

### ExecutionContext

Describes **the environment in which the execution occurs**.

Examples:

```text
Execution ID
Correlation ID
Principal
Tenant
Locale
```

Conceptually:

```text
External Input
      │
      ▼
Execution Boundary
      │
      ├───────────────┐
      ▼               ▼
ExecutionInput   ExecutionContext
      │               │
      └───────┬───────┘
              ▼
       Application Execution
```

External transport objects such as Express `Request` and `Response` must not become application execution contracts.

---

# 6. Execution Lifecycle

Every externally initiated execution follows a controlled lifecycle.

The conceptual lifecycle is:

```text
RECEIVED
   │
   ▼
NORMALIZED
   │
   ▼
CONTEXT CREATED
   │
   ▼
CONTEXT ENRICHED
   │
   ▼
SCOPED
   │
   ▼
EXECUTING
   │
   ├──────────────► SUCCEEDED
   │
   └──────────────► FAILED
                         │
                         ▼
                     FINALIZED
```

The exact implementation may vary by execution boundary, but the ownership model remains consistent.

---

## 6.1 Execution Lifecycle Responsibilities

### Received

An external trigger enters through an execution boundary.

### Normalized

The boundary translates protocol-specific input into an application-level `ExecutionInput`.

### Context Created

The boundary creates the initial `ExecutionContext`.

### Context Enriched

Trusted execution metadata may be added through controlled derivation.

### Scoped

The context is established for the logical execution.

### Executing

The application operation executes using the normalized input and current execution context.

### Succeeded / Failed

The execution completes either successfully or with an error.

### Finalized

The boundary translates the result or error into the appropriate external representation and completes the execution scope.

---

# 7. HTTP Execution

HTTP is one execution boundary.

A typical HTTP execution follows:

```text
HTTP Request
     │
     ▼
HTTP Boundary
     │
     ▼
Normalize ExecutionInput
     │
     ▼
Create ExecutionContext
     │
     ▼
Establish ExecutionContextScope
     │
     ▼
Request Metadata Enrichment
     │
     ▼
Authentication
     │
     ▼
Principal Enrichment
     │
     ▼
Tenant Resolution
     │
     ▼
Tenant Enrichment
     │
     ▼
Controller / Application Entry
     │
     ▼
Application Service
     │
     ▼
Domain / Infrastructure
     │
     ▼
Response Translation
     │
     ▼
Execution Scope Ends
```

The HTTP boundary owns HTTP-specific concerns.

Business logic remains independent of Express or other HTTP framework abstractions.

---

# 8. Background Execution

Background work represents a separate execution boundary.

A background job must not assume that it is still executing inside the originating HTTP request.

Conceptually:

```text
HTTP Request
     │
     └── enqueue job
             │
             ▼
        Queue / Broker
             │
             ▼
        Job Consumer
             │
             ▼
    Create ExecutionContext
             │
             ▼
    Establish ExecutionScope
             │
             ▼
        Execute Job
```

The job receives its own execution context.

Selected metadata from the originating execution may be propagated when appropriate, such as correlation information.

The execution itself remains independent.

This prevents accidental coupling between the HTTP request lifecycle and detached background work.

---

# 9. Other Execution Boundaries

The same execution model applies to other externally initiated executions.

Examples include:

```text
Scheduled Job
     │
     ▼
Execution Boundary
     │
     ▼
Create Context
     │
     ▼
Establish Scope
     │
     ▼
Execute
```

```text
Message Consumer
     │
     ▼
Execution Boundary
     │
     ▼
Create Context
     │
     ▼
Establish Scope
     │
     ▼
Execute
```

```text
CLI Command
     │
     ▼
Execution Boundary
     │
     ▼
Create Context
     │
     ▼
Establish Scope
     │
     ▼
Execute
```

Each boundary may have protocol-specific translation, but all follow the same execution model.

---

# 10. Authentication and Principal Context

Authentication establishes identity.

Authorization determines whether that identity may perform an operation.

These concerns remain separate.

Conceptually:

```text
Credentials
    │
    ▼
Authentication
    │
    ▼
Principal
    │
    ▼
ExecutionContext
    │
    ▼
Authorization
    │
    ▼
Permission Decision
```

The principal represents the actor performing the execution.

The principal is not necessarily the complete User domain entity.

This prevents infrastructure-level identity from becoming coupled to the User module's persistence model.

Authentication may enrich the execution context with a principal.

The presence of a principal does not imply that every operation is authorized.

Authorization remains an explicit application decision.

---

# 11. Tenant Context

In a multi-tenant system, tenant identity represents the security boundary within which an execution operates.

Tenant resolution should occur before tenant-scoped business operations.

Conceptually:

```text
Request
   │
   ▼
Tenant Resolution
   │
   ▼
Validated Tenant
   │
   ▼
ExecutionContext
   │
   ▼
Tenant-scoped Use Case
```

Tenant identity should be treated as trusted execution metadata only after the appropriate validation and authorization rules have been applied.

Tenant context must not be treated as arbitrary request metadata.

---

# 12. Context Propagation Rules

The following rules govern execution context propagation.

### Rule 1 — One Root Context per Execution

Each independent logical execution establishes its own root execution context.

### Rule 2 — Boundaries Create Contexts

Root contexts are created by execution boundaries.

### Rule 3 — Internal Services Do Not Create Root Contexts

An application service executing within an established execution must use the current context.

### Rule 4 — Context Is Immutable

Context enrichment produces a derived context rather than mutating the existing context.

### Rule 5 — Propagation Is Controlled

Context propagation must occur through the execution scope abstraction.

### Rule 6 — Runtime Mechanisms Remain Hidden

Application and business modules must not depend directly on `AsyncLocalStorage`.

### Rule 7 — Detached Work Gets Its Own Context

Background or otherwise independent asynchronous work establishes a new execution context.

### Rule 8 — Selected Metadata May Cross Boundaries

Correlation information and other explicitly approved metadata may be propagated into a new execution.

### Rule 9 — No Arbitrary Context Replacement

An active execution must not allow arbitrary components to replace its execution context.

---

# 13. Execution Context Invariants

The following invariants are architectural requirements.

### Immutability

An established context is never mutated in place.

### Isolation

Concurrent executions must not observe one another's context.

### Explicit Creation

Every externally initiated execution establishes an execution context.

### Controlled Enrichment

Trusted infrastructure enriches context through explicit contracts.

### Security Identity Integrity

Principal and tenant information must not be arbitrarily overwritten.

### No Fabricated Context

Infrastructure must not silently create a fake execution context merely because a caller forgot to establish one.

### Detached Execution

Independent background or asynchronous work establishes its own execution boundary.

### Transport Independence

Execution context and application execution contracts must not depend on HTTP-specific objects.

---

# 14. Architectural Boundaries

The execution architecture preserves the existing architectural boundaries:

```text
                 Execution Boundary
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
      ExecutionInput       ExecutionContext
             │                     │
             └──────────┬──────────┘
                        ▼
                  Application
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
        Business Modules     Infrastructure
```

The execution model does not introduce a new business layer.

It provides the runtime foundation through which external executions enter and interact with the existing architecture.

---

# 15. Summary

The execution architecture is based on four fundamental concepts:

```text
ExecutionContext
        │
        ▼
ExecutionContextScope
        │
        ▼
Execution Boundary
        │
        ▼
Execution Lifecycle
```

The model provides:

* Explicit execution identity
* Controlled context propagation
* Concurrent execution isolation
* Clear boundary ownership
* Transport-independent application contracts
* Independent background execution
* Separation of authentication and authorization
* Explicit tenant context
* Infrastructure isolation

The central architectural principle is:

> **Every externally initiated execution establishes an explicit execution boundary and execution context, while the application remains independent of the runtime mechanism used to propagate that context.**
