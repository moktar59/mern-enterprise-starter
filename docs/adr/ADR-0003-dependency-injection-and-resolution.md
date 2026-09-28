# ADR-006: Dependency Injection & Dependency Resolution

**Status:** Accepted

**Date:** 2026-09-28

**Decision Owners:** Project Architecture

**Scope:** API Core / Execution Infrastructure

---

## Context

The application contains dependencies across application, domain, infrastructure, and adapter layers. These dependencies must be created, supplied, and composed without introducing hidden coupling, framework-specific behavior, or violations of module boundaries.

The architecture also needs to support:

* explicit dependency relationships
* constructor-based dependency injection
* modular composition
* concurrent request execution
* execution-scoped state
* background jobs and other execution models
* predictable runtime performance
* testability
* framework independence
* future horizontal scaling
* potential future adoption of an established DI container

Dependency injection is therefore treated as an architectural technique rather than as a requirement to use a particular DI framework or container.

---

## Decision

Dependency Injection is a core architectural principle.

Dependencies are explicitly declared and supplied externally, with constructor injection as the default mechanism.

Dependency creation and wiring are owned by the Composition Root. Business and application modules must not construct their own infrastructure dependencies or resolve dependencies from a container.

Manual composition is the default dependency-resolution strategy. This provides maximum transparency, predictable runtime behavior, straightforward testing, and framework independence while the dependency graph remains manageable.

The architecture does not prohibit the future adoption of an established DI container. A container may be introduced when dependency-graph complexity, lifecycle requirements, or organizational scale justify the additional abstraction. Such a container must remain isolated to composition infrastructure and must not require business or application modules to depend on the container.

---

## Dependency Creation

Dependencies are created outside the components that consume them.

A component declares what it needs through its constructor rather than determining how those dependencies are constructed.

Conceptually:

```text
Consumer
   ↑
Dependency Contract
   ↑
Composition Root
   ↑
Concrete Implementation
```

This keeps implementation choices outside business and application logic.

---

## Dependency Resolution

Dependency resolution belongs to composition infrastructure.

The normal application execution path must not use a container as a service locator.

Business and application code must not perform operations equivalent to:

```text
container.resolve(...)
```

to obtain dependencies dynamically.

Where practical, the dependency graph is constructed and resolved during application composition or startup.

This avoids unnecessary dependency graph traversal and object creation on performance-sensitive execution paths.

---

## Constructor Injection

Constructor injection is the default because it makes dependencies:

* explicit
* mandatory
* visible
* statically analyzable
* easy to replace during testing

Property injection, hidden global dependencies, service locators, and implicit dependency discovery are not architectural defaults.

---

## Composition Root

The Composition Root owns dependency creation and wiring.

Composition may be organized into multiple composition units for maintainability and team scalability, but those units remain part of the controlled composition boundary.

The dependency graph must not be constructed independently by business modules.

---

## Module Boundaries

Dependency injection must not bypass module boundaries.

A module may depend on another module only through its public capability or contract.

The following are prohibited:

* importing another module's internal implementation
* resolving another module's internal service through a container
* accessing another module's infrastructure directly
* using dependency injection to bypass declared module contracts

DI is therefore subordinate to module architecture rather than an alternative to it.

---

## Dependency Lifetimes

The architecture recognizes three conceptual lifetimes.

### Application Lifetime

Application lifetime is the default.

Typical examples include:

* configuration
* logging
* database connection pools
* Redis clients
* external HTTP clients
* repositories
* stateless application services

Application-lifetime dependencies must be safe for concurrent executions and must not retain execution-specific mutable state.

### Execution Lifetime

Execution lifetime represents one logical execution.

An execution may be:

* an HTTP request
* a background job
* a scheduled task
* a consumed message
* a WebSocket event
* another supported execution model

Execution-scoped resources are created only when execution isolation or resource ownership requires them.

Examples include:

* Execution Context
* transaction
* unit of work
* request/job-specific resources
* execution-local state

The existence of an Execution Scope does not imply that the complete application dependency graph is recreated for every execution.

### Transient Lifetime

Transient dependencies are created for short-lived use when their semantics require a distinct instance.

Transient lifetime is not the default merely because an object is stateless or inexpensive to construct.

---

## Lifetime Compatibility

A longer-lived dependency must not retain a dependency or mutable state whose lifetime is shorter than its own.

Conceptually:

```text
Application
    ↓
Application        valid

Execution
    ↓
Application        valid

Application
    ↓
Execution          invalid

Application
    ↓
short-lived state  invalid
```

This prevents execution-specific state from being retained by shared application-lifetime objects.

---

## Execution Context Relationship

Dependency resolution and Execution Context are separate architectural concerns.

Dependency Injection answers:

> Which dependencies does this component receive?

Execution Context answers:

> Which logical execution is currently being processed?

AsyncLocalStorage provides a mechanism for propagating execution context across asynchronous boundaries. It is not a dependency-resolution mechanism.

Conceptually:

```text
Execution Boundary
       ↓
Create / enrich Execution Context
       ↓
Establish context propagation
       ↓
Execute application
```

Dependency composition remains the responsibility of the Composition Root.

---

## AsyncLocalStorage

AsyncLocalStorage may participate in execution-context propagation, but it must not become an implicit service locator.

Execution Context remains the authoritative abstraction for execution-specific state.

DI infrastructure must not use AsyncLocalStorage to silently resolve arbitrary application dependencies.

---

## Execution-Scoped Resources

Execution-scoped resources must be owned by the execution that creates them.

For example:

```text
Execution
   ↓
Transaction
   ↓
Application work
   ↓
Commit / Rollback
   ↓
Release
```

Execution failure must not bypass required cleanup.

Application-lifetime resources are instead owned by the application lifecycle and released during controlled application shutdown.

---

## Performance and Scalability

Dependency resolution is treated as part of runtime performance design.

The preferred execution model is:

```text
Application Startup
       ↓
Build dependency graph
       ↓
Create application-lifetime dependencies
       ↓
Compose application
       ↓
Serve executions
```

rather than:

```text
Execution
       ↓
Resolve dependency graph
       ↓
Create application dependency graph
       ↓
Execute
```

This minimizes unnecessary allocations, dependency traversal, and garbage-collection pressure on high-concurrency execution paths.

Execution-scoped dependencies should therefore be introduced only where their lifetime semantics require them.

Application-lifetime infrastructure should normally reuse pooled resources rather than repeatedly creating and destroying expensive resources for individual executions.

Horizontal scaling must also be considered when sizing application-lifetime resources. Application lifetime is process-local rather than system-wide.

---

## Circular Dependencies

Circular dependencies are treated as architectural problems rather than dependency-resolution problems.

A dependency graph such as:

```text
A → B
B → A
```

should trigger examination of:

* responsibility ownership
* abstraction boundaries
* module boundaries
* orchestration responsibilities

Lazy resolution, service locators, or runtime lookup must not be used primarily to conceal structural circular dependencies.

---

## Framework and Library Independence

Business and application modules must remain independent of DI frameworks and containers.

The architecture does not require:

* decorators
* reflection-based dependency discovery
* framework-specific injection APIs
* container APIs in business code
* automatic scanning

A future DI container must be replaceable composition infrastructure.

Conceptually:

```text
                    ┌── Manual Composition
Business/Application ┤
                    └── Container-based Composition
```

The business architecture remains unchanged regardless of which composition mechanism is used.

---

## Testing

Unit tests should be able to construct application components directly without requiring a DI container.

For example:

```text
Test
 ↓
Fake dependencies
 ↓
Application component
```

Integration and end-to-end tests may exercise the complete Composition Root and, if adopted, the DI container.

Dependency injection therefore improves testability without making the container itself a testing requirement.

---

## Alternatives Considered

### Manual Composition

Manual composition provides:

* maximum transparency
* minimal runtime machinery
* predictable performance
* straightforward debugging
* strong framework independence
* simple unit testing

Its primary limitation is human and organizational complexity as the dependency graph becomes very large.

This limitation can be mitigated by organizing composition into module-level composition units while keeping ownership within the Composition Root.

### Lightweight Internal DI

A custom internal DI mechanism could provide:

* dependency graph validation
* lifecycle management
* centralized registration
* reduced manual wiring

However, it introduces the risk of gradually becoming a proprietary DI framework requiring support for increasingly complex features such as scopes, lifecycle hooks, async providers, diagnostics, and automatic discovery.

The project therefore does not introduce a custom DI framework.

### Established DI Container

An established DI container provides mature support for:

* dependency graph management
* lifecycle management
* cycle detection
* registration
* diagnostics
* large-scale composition

However, it introduces additional abstraction, runtime machinery, external dependency, and potential framework coupling.

The project therefore does not make an established DI container a mandatory dependency at this stage.

It remains a future implementation option if actual dependency-graph or lifecycle complexity justifies it.

---

## Consequences

### Positive

* Dependencies remain explicit.
* Business and application code remain framework-independent.
* Composition ownership is clear.
* Module boundaries cannot be bypassed through DI.
* Runtime behavior remains predictable.
* Request-path DI overhead can be minimized.
* Unit testing remains straightforward.
* Execution-specific state can remain isolated.
* The architecture can support HTTP, jobs, messages, and other execution models.
* A future DI container can be introduced without redesigning business modules.

### Negative

* Manual composition requires deliberate maintenance.
* Large dependency graphs may eventually require more sophisticated composition infrastructure.
* Lifetime management must be designed explicitly.
* Developers must understand dependency ownership rather than relying on automatic container behavior.
* Introducing a future DI container will require careful integration to preserve architectural constraints.

### Trade-off

The architecture intentionally favors explicitness and predictable behavior over early automation.

Automation may be introduced later when its complexity-management benefits outweigh its abstraction and runtime costs.

---

## Architectural Invariants

1. Dependencies are explicitly declared.
2. Constructor injection is the default injection mechanism.
3. Dependency creation belongs to composition infrastructure.
4. Composition occurs only through the Composition Root.
5. Business and application code must not resolve dependencies from a container.
6. DI must not bypass module boundaries.
7. Application lifetime is the default dependency lifetime.
8. Execution-scoped dependencies are introduced only when isolation or ownership requires them.
9. Longer-lived dependencies must not retain shorter-lived dependencies or execution-specific mutable state.
10. Application-lifetime dependencies must be safe for concurrent executions.
11. Execution Context and dependency resolution remain separate concerns.
12. AsyncLocalStorage is not a dependency-resolution mechanism.
13. Circular dependencies must be resolved architecturally rather than hidden through runtime lookup.
14. Business and application modules must remain independent of DI frameworks and containers.
15. Dependency resolution should occur during composition or startup whenever practical.
16. Application-lifetime resources are process-local.
17. Resource capacity must account for horizontal scaling.
18. A future DI container must remain isolated to replaceable composition infrastructure.
