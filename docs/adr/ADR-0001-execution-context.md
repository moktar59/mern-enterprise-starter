# ADR: Introduce Execution Context as a Core Execution-Boundary Abstraction

* **Status:** Accepted
* **Date:** 2026-09-19
* **Decision Owners:** Project Architecture
* **Scope:** API Core / Execution Infrastructure

## 1. Context

The application needs a consistent way to represent and propagate information about the current unit of execution across asynchronous application code.

The backend will support multiple execution entry points, including:

* HTTP requests
* Queue messages
* Event consumers
* Scheduled jobs
* CLI commands

These execution boundaries need common contextual information such as:

* execution identity
* correlation identity
* request identity
* execution source
* start time
* authenticated principal
* tenant context
* locale

Without a dedicated abstraction, this information can become scattered across function parameters, HTTP-specific objects, global state, or infrastructure-specific mechanisms.

Node.js provides `AsyncLocalStorage` for asynchronous context propagation. However, exposing `AsyncLocalStorage` directly to application code would couple the application architecture to a specific runtime implementation and would make execution semantics dependent on a propagation mechanism.

The system therefore needs an architectural abstraction that defines **what an execution context means**, independently of **how that context is propagated at runtime**.

---

## 2. Decision

The backend will introduce **Execution Context** as a core architectural capability.

An `ExecutionContext` represents the current independent unit of work.

Each independent execution has exactly one root execution context.

Execution boundaries are responsible for creating root contexts.

Internal application calls do not create new execution contexts.

The architecture will separate four responsibilities:

```text
ExecutionContext
    ↓
Describes the current execution

ExecutionContextFactory
    ↓
Creates and derives contexts

ExecutionContextScope
    ↓
Propagates and observes the current context

AsyncLocalStorage
    ↓
Private runtime implementation
```

The architectural abstraction is therefore independent from the Node.js propagation mechanism.

---

## 3. Execution Boundary

An execution boundary is the point where an independent unit of work enters the system.

Examples include:

* HTTP request
* Queue message
* Event consumer invocation
* Scheduled task
* CLI command

Only execution-boundary adapters may create root execution contexts.

Application modules must not create root contexts.

For example:

```text
HTTP Request
    ↓
HTTP Boundary
    ↓
Create Root ExecutionContext
    ↓
Establish ExecutionContextScope
    ↓
Application
    ↓
Domain
    ↓
Infrastructure
```

An internal call such as:

```text
Controller
    ↓
Application Service
    ↓
Domain Service
    ↓
Repository
```

does not create a new execution context.

---

## 4. Execution Identity

Every independent execution receives a unique `executionId`.

The `executionId`:

* is generated internally
* is not supplied by external clients
* remains stable for the lifetime of the execution
* distinguishes one execution from another

`executionId` is distinct from:

* `requestId`
* `correlationId`

For example:

```text
HTTP Execution
executionId: E1
requestId:    R1
correlationId: C1

Queue Execution
executionId: E2
requestId:    -
correlationId: C1
```

Here:

```text
E1 ≠ E2
C1 = C1
```

A shared correlation ID may connect multiple independent executions without making them the same execution.

---

## 5. Execution Context Contract

The conceptual context is intentionally small and stable.

```ts
interface ExecutionContext {
  readonly executionId: ExecutionId;
  readonly correlationId?: CorrelationId;
  readonly requestId?: RequestId;

  readonly source: ExecutionSource;
  readonly startedAt: Instant;

  readonly principal?: Principal;
  readonly tenant?: TenantContext;
  readonly locale?: Locale;
}
```

The context must remain focused on execution metadata.

It must not contain:

* HTTP request or response objects
* access tokens
* refresh tokens
* passwords
* secrets
* complete user entities
* complete tenant entities
* repositories
* services
* dependency containers
* arbitrary business state
* generic metadata bags

---

## 6. Principal and Tenant Semantics

`Principal` represents the actor associated with an execution.

A principal is not equivalent to a User domain entity.

Possible principal types include:

```ts
type Principal =
  | HumanPrincipal
  | ServicePrincipal
  | SystemPrincipal
  | AnonymousPrincipal;
```

The context stores only the identity necessary to describe the execution.

Similarly, `TenantContext` represents the tenant scope of an execution.

It is not the Tenant domain entity.

Conceptually:

```ts
interface TenantContext {
  readonly id: string;
}
```

Authentication and tenant-resolution components may enrich an existing execution context, but they do not create new executions.

---

## 7. Context Creation and Enrichment

Context creation and derivation are owned by `ExecutionContextFactory`.

The factory is responsible for:

* creating root contexts
* generating execution IDs
* establishing execution timestamps
* deriving immutable contexts
* validating enrichment
* detecting conflicting identity information

The factory does not:

* authenticate users
* authorize actions
* inspect HTTP requests
* manipulate asynchronous storage
* perform business operations

The conceptual contract is:

```ts
interface ExecutionContextFactory {
  create(
    input: ExecutionContextCreationInput
  ): ExecutionContext;

  withPrincipal(
    context: ExecutionContext,
    principal: Principal
  ): ExecutionContext;

  withTenant(
    context: ExecutionContext,
    tenant: TenantContext
  ): ExecutionContext;

  withLocale(
    context: ExecutionContext,
    locale: Locale
  ): ExecutionContext;
}
```

`executionId` is deliberately absent from the creation input because it must be generated internally.

---

## 8. Immutability and Context Integrity

Execution contexts are immutable.

Context enrichment creates a derived context rather than modifying an existing context.

Semantic identity cannot be silently replaced.

Examples:

```text
No principal → Principal A
Allowed

Principal A → Principal A
Allowed

Principal A → Principal B
Conflict

Tenant A → Tenant A
Allowed

Tenant A → Tenant B
Conflict
```

The architecture distinguishes between:

* absence of a principal
* an explicitly anonymous principal
* an authenticated principal

These states must not be conflated.

Impersonation or acting-on-behalf-of behavior requires explicit semantics and must not be implemented as ordinary principal replacement.

---

## 9. Execution Context Scope

The application will use an `ExecutionContextScope` abstraction for accessing and propagating the current context.

The conceptual contract is:

```ts
interface ExecutionContextScope {
  run<T>(
    context: ExecutionContext,
    operation: () => T
  ): T;

  current(): ExecutionContext | undefined;

  require(): ExecutionContext;
}
```

The scope is responsible for:

* establishing a context for an operation
* exposing the current context
* supporting nested scopes
* restoring the parent context
* preserving context across supported asynchronous execution

The scope does not:

* create contexts
* enrich contexts
* authenticate
* authorize
* perform dependency injection
* handle application errors

---

## 10. AsyncLocalStorage

Node.js `AsyncLocalStorage` will be used as the initial runtime implementation of `ExecutionContextScope`.

However:

> `AsyncLocalStorage` is an implementation mechanism, not an architectural abstraction.

Application code must depend on:

```text
ExecutionContextScope
```

rather than:

```text
AsyncLocalStorage
```

Only the execution-context infrastructure implementation may directly depend on Node.js `AsyncLocalStorage`.

This preserves the ability to change the propagation mechanism without changing application-level execution semantics.

---

## 11. Asynchronous Execution Semantics

The current execution context remains associated with an execution across normal asynchronous continuation.

Examples:

```text
await
Promise chains
Promise.all()
timers
microtasks
```

These remain part of the same execution unless an explicit architectural boundary creates another execution.

Concurrent executions must remain isolated.

For example:

```text
HTTP Request A → Execution A
HTTP Request B → Execution B
HTTP Request C → Execution C
```

Context from one execution must never leak into another.

---

## 12. Independent Asynchronous Work

Runtime propagation does not automatically determine business execution identity.

An asynchronous operation may technically inherit an existing `AsyncLocalStorage` context while representing independent business work.

Therefore:

> ALS propagation does not equal business execution identity.

Detached or independently processed work must explicitly establish a new execution context when it represents a new execution.

Similarly, Worker Threads are treated as explicit execution boundaries. Context must not be assumed to cross a worker boundary automatically.

Required context information must be passed explicitly and a new execution context established in the worker.

---

## 13. Security and Trust Model

Execution context values have different trust levels.

### System-generated

The following are controlled by the system:

* `executionId`
* `startedAt`
* `source`

### External metadata

The following may originate from external input and must be validated and normalized:

* `requestId`
* `correlationId`
* locale

These values are metadata and must never be treated as security identities.

### Trusted derived context

The following may only be established after appropriate validation:

* principal
* tenant context

For example, a client-provided tenant ID is only a candidate value.

It must not become trusted `TenantContext` merely because it was supplied by the client.

Authentication and authorization rules remain responsible for determining whether the actor may operate within that tenant.

### Forbidden context data

The following must never be stored in the execution context:

* credentials
* access tokens
* refresh tokens
* passwords
* secrets
* raw request bodies
* raw response objects
* dependency containers
* arbitrary business data

The context should be safe for controlled observability and logging.

---

## 14. Error Semantics

Execution-context failures must be distinguishable by semantic category.

The architecture recognizes at least:

### Missing Context

An operation requires a current context but none exists.

Concept:

```text
ExecutionContextRequiredError
```

### Invalid Enrichment

The requested context enrichment is invalid.

### Conflicting Enrichment

An enrichment attempts to replace an existing incompatible semantic identity.

Concept:

```text
ExecutionContextConflictError
```

Exact error hierarchy and implementation details may be finalized alongside the error subsystem implementation.

---

## 15. Dependency Direction

Execution Context belongs to the API's core infrastructure capabilities.

It is not owned by:

* Authentication
* Users
* Tenants
* HTTP
* Logging
* Queue processing

Conceptually:

```text
                Execution Context
                       ↑
        ┌──────────────┼──────────────┐
        │              │              │
       HTTP           Auth          Queue
        │              │              │
        └──────────────┼──────────────┘
                       │
                  Application
```

Application code depends on the execution-context contracts.

Infrastructure provides the implementations.

Node.js `AsyncLocalStorage` remains isolated inside the infrastructure implementation.

---

## 16. Architectural Invariants

The following invariants are part of this decision:

1. One independent execution has one root execution context.
2. Only execution boundaries create root contexts.
3. Internal application calls do not create executions.
4. Execution contexts are immutable.
5. `ExecutionContextFactory` creates and derives contexts.
6. `ExecutionContextScope` propagates and observes contexts.
7. `AsyncLocalStorage` is an implementation detail.
8. `executionId` is internally generated.
9. `executionId`, `requestId`, and `correlationId` have distinct semantics.
10. `Principal` represents an actor, not a User entity.
11. `TenantContext` represents execution scope, not a Tenant entity.
12. Authentication enriches an execution; it does not create one.
13. Tenant resolution enriches an execution; it does not create one.
14. Conflicting principal or tenant enrichment must fail.
15. Impersonation requires explicit semantics.
16. Execution context is not an authentication or authorization mechanism.
17. Secrets and business state must not be stored in the context.
18. Independent asynchronous work establishes a new execution explicitly.
19. ALS propagation must not be confused with business execution identity.
20. Missing context must remain distinct from anonymous execution.
21. Generic context bags are prohibited.
22. Application code must not directly depend on `AsyncLocalStorage`.

---

## 17. Alternatives Considered

### 17.1 Pass Context Through Every Function

Example:

```ts
service.execute(input, context);
repository.find(query, context);
domain.execute(command, context);
```

This makes execution information explicit but introduces significant propagation noise and forces infrastructure metadata into APIs that may not semantically require it.

It also increases the risk that context becomes part of unrelated domain contracts.

This approach is therefore not selected as the general execution-context propagation mechanism.

Explicit business dependencies should still be passed explicitly when they are part of the business operation.

---

### 17.2 Use AsyncLocalStorage Directly

Example:

```ts
const asyncLocalStorage = new AsyncLocalStorage();
```

throughout the application.

This was rejected because it couples application architecture to a Node.js-specific runtime mechanism.

It also makes execution semantics difficult to define independently from propagation mechanics.

Instead, `AsyncLocalStorage` is isolated behind `ExecutionContextScope`.

---

### 17.3 Global Mutable Context

A global variable or singleton mutable object could expose the current execution.

This is rejected because concurrent asynchronous executions would be able to overwrite one another's state, causing context leakage and incorrect execution attribution.

---

### 17.4 Put Context Inside Authentication

Authentication was considered as a possible owner of execution context because authentication commonly establishes the principal.

This is rejected.

Authentication is one consumer and enricher of execution context, while execution context is needed by unauthenticated executions and by non-HTTP boundaries such as queues and scheduled tasks.

---

### 17.5 Create a New Context for Every Layer

Creating contexts for controllers, services, repositories, or other internal operations would fragment a single execution into unrelated identities.

This is rejected.

Only independent execution boundaries create root contexts.

---

## 18. Consequences

### Positive Consequences

The decision provides:

* a consistent execution model across HTTP, queues, events, jobs, and CLI operations
* clear ownership of execution identity
* isolation between concurrent executions
* framework-independent application contracts
* a clean abstraction over asynchronous propagation
* a foundation for structured logging
* a foundation for correlation and tracing integration
* explicit security boundaries around contextual data
* testable execution semantics
* reduced coupling to Node.js runtime mechanisms

### Negative Consequences

The design introduces:

* additional core abstractions
* additional implementation and testing work
* rules that developers must understand
* the need to explicitly handle independent asynchronous work
* additional design considerations for worker threads, detached jobs, and similar boundaries

These costs are accepted because execution context is a foundational capability used across multiple future backend features.

---

## 19. Relationship With Other Architecture Capabilities

Execution Context is intentionally foundational and may later integrate with:

* logging
* authentication
* authorization
* tenant resolution
* background jobs
* event processing
* tracing
* request lifecycle management
* graceful shutdown
* cancellation

These capabilities must consume or enrich the execution context according to their own responsibilities.

They must not redefine execution identity.

---

## 20. Testing Requirements

The implementation must verify at least the following behaviors.

### Factory

* execution ID is generated
* source is preserved
* start time is established
* derived contexts are immutable
* missing → principal is allowed
* same principal → same principal is allowed
* conflicting principal fails
* same tenant → same tenant is allowed
* conflicting tenant fails

### Scope

* `run()` establishes the current context
* asynchronous continuation preserves the context
* nested scopes expose the nested context
* parent context is restored
* exceptions do not corrupt the parent scope
* concurrent executions remain isolated
* `require()` fails outside a scope

### Boundaries

* HTTP creates one root execution
* authentication retains the same execution ID
* tenant enrichment retains the same execution ID
* queue processing creates a new execution ID
* independent detached work explicitly creates a new execution

---

## 21. Decision Summary

The project will model execution state through an explicit `ExecutionContext` abstraction.

Execution boundaries create root contexts.

`ExecutionContextFactory` creates and derives immutable contexts.

`ExecutionContextScope` manages access and propagation.

Node.js `AsyncLocalStorage` provides the initial infrastructure implementation of that scope but remains hidden behind the abstraction.

This establishes a framework-independent execution model that can support the project's HTTP, authentication, authorization, logging, background processing, event-driven, and future distributed execution capabilities without making those systems responsible for defining execution identity.

## 22. Status

**Accepted**

This decision is considered a foundational Core Backend architecture decision.

Any future change to the execution identity model, execution-boundary rules, context mutability, scope contract, or propagation abstraction should be treated as an architectural change and reviewed against this ADR.
