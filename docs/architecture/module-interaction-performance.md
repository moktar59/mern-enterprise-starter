# Module Interaction Performance

## Purpose

This document defines the architectural principles for performance, scalability, and resource efficiency when modules interact within the MERN Enterprise Starter.

It explains how to evaluate interaction costs, reduce unnecessary work, manage concurrency, control resource consumption, and improve throughput without compromising module ownership or public contracts.

The objectives are to:

- Keep module interactions predictable and efficient.
- Identify and eliminate unnecessary communication overhead.
- Preserve business invariants while optimizing data access.
- Support increasing workloads without premature architectural complexity.
- Prevent slow dependencies from degrading the entire application.
- Establish clear principles for synchronous and asynchronous execution.
- Make performance decisions based on measurable evidence.

This document defines architectural guidance rather than mandating a particular caching system, queue, database, profiling tool, or deployment topology.

## Core Principles

Module interaction performance must follow these principles:

1. **Measure before optimizing:** Identify the actual bottleneck before introducing an optimization.
2. **Preserve ownership:** Performance improvements must respect module and data ownership.
3. **Optimize the workload:** Consider request frequency, concurrency, payload size, latency, and resource consumption together.
4. **Make costs explicit:** Every interaction has costs in execution time, resource usage, failure exposure, and operational complexity.
5. **Bound resource consumption:** Concurrency, queues, retries, and payload sizes must not grow without control.
6. **Preserve correctness:** An optimization must not weaken business invariants or introduce unacceptable consistency behavior.
7. **Prefer simple improvements first:** Remove unnecessary work before introducing complex caching, asynchronous processing, or additional infrastructure.
8. **Scale according to evidence:** Introduce additional capacity or architectural mechanisms when measured requirements justify them.

## Interaction Performance Model

A module interaction is any communication between capabilities that contributes to a business operation.

Examples include:

- A direct call to another module's public capability.
- A workflow coordinating several modules.
- A database operation performed by the owning module.
- An asynchronous event published for another module.
- A background job triggered by an application operation.
- A request to an external service through an adapter.

Each interaction introduces some combination of execution cost, waiting time, resource consumption, and failure risk.

### Sources of Interaction Cost

Common sources include:

- Repeated database queries.
- Excessive network requests.
- Large payload serialization and deserialization.
- Unnecessary data transformation.
- Sequential calls that could safely execute concurrently.
- Unbounded concurrency.
- Repeated processing of the same information.
- Expensive authorization or validation work performed redundantly.
- Cache misses or invalidation overhead.
- Event publication and consumption delays.
- Retry amplification.
- Contention over shared resources.

The architectural goal is not to remove all interaction. It is to eliminate unnecessary work while retaining clear ownership and reliable behavior.

## Latency, Throughput, and Resource Utilization

Performance must be evaluated across multiple dimensions.

### Latency

Latency measures how long an operation takes.

For an API request, distinguish the total response time from the time spent in individual modules, database operations, external calls, and queue waits.

Useful measurements include:

- Average latency.
- Median latency, or p50.
- Tail latency, such as p95 and p99.
- Time spent waiting on dependencies.
- Time spent executing business logic.

Tail latency matters because a small number of slow operations can significantly affect user experience and overall system behavior.

An average alone can hide these slow requests.

### Throughput

Throughput measures how much work the system completes over a period.

Examples include:

- API requests completed per second.
- Enrollments processed per minute.
- Events consumed per second.
- Background jobs completed per hour.

Throughput must be measured alongside correctness and latency. Increasing the number of attempted operations is not an improvement if failures, duplicate effects, or excessive waiting also increase.

### Resource Utilization

Relevant resources include:

- CPU.
- Memory.
- Database connections.
- Database query capacity.
- Network bandwidth.
- Worker concurrency.
- Queue capacity.
- File descriptors and other operating-system resources.

A system may be CPU-bound, I/O-bound, database-bound, or constrained by a downstream service.

The correct optimization depends on the actual constraint.

## Interaction Cost and Request Paths

Consider an API request that crosses several module boundaries.

```text
Incoming Request
       |
       v
Application Use Case
       |
       +--> User Capability
       |
       +--> Enrollment Capability
       |
       +--> Course Capability
       |
       v
Response
```

This is an illustrative dependency path, not a prescribed module structure.

Each capability may perform validation, business logic, and data access. The total latency depends on whether those operations are sequential, concurrent, cached, or otherwise optimized.

### Sequential Interactions

If three independent operations take 40 ms, 60 ms, and 50 ms, executing them sequentially produces approximately 150 ms of combined operation time, excluding additional overhead.

### Concurrent Interactions

If those operations are independent and safely execute concurrently, their combined duration may approach the slowest operation, approximately 60 ms, plus coordination and scheduling overhead.

This is only an illustration. Actual performance depends on resource contention, concurrency limits, database capacity, and execution overhead.

**Parallel execution is appropriate only when the operations are independent and the concurrency is safe.**

If the second operation depends on the result of the first, sequential execution may be necessary.

## Module Boundaries and Performance

Module boundaries must not be weakened simply to reduce interaction overhead.

A module owns its business capability, rules, data, and persistence structures. Other modules must interact through its public contracts.

Avoid performance shortcuts such as:

- Direct access to another module's repositories.
- Queries against another module's private collections.
- Sharing internal database models.
- Mutating another module's data directly.
- Bypassing validation or business rules.
- Introducing hidden dependencies on internal implementation details.

These approaches may appear faster initially but create coupling, weaken correctness, and make future optimization more expensive.

### Optimize the Public Contract

When an interaction is inefficient, first investigate whether the owning module can expose a more appropriate public capability.

Possible improvements include:

- Returning the required information in one operation.
- Supporting bulk operations.
- Avoiding redundant lookups.
- Providing a purpose-built read capability.
- Supporting pagination and filtering.
- Reducing unnecessary payload fields.
- Offering asynchronous processing for work that need not finish within the request.

The public capability should represent a legitimate business or application need rather than exposing internal persistence operations for convenience.

### Logical Ownership Does Not Require Physical Isolation

Modules may share a database server, connection infrastructure, or other technical resources while retaining distinct logical ownership.

Performance optimization may involve shared infrastructure, but it must not silently transfer ownership of data or business rules.

Physical separation should be considered only when workload, isolation, operational needs, or independent scaling justify it.

## Database Interaction Efficiency

Database access is frequently a major source of application latency.

The owning module remains responsible for choosing how its data is retrieved and modified while preserving its business invariants.

### Avoid N+1 Queries

An N+1 query problem occurs when an application performs one query to retrieve a collection and then performs another query for each item.

For example, loading 100 enrollments and then querying the course separately for every enrollment may produce approximately 101 queries instead of a more efficient access pattern.

Possible improvements include:

- Appropriate joins within the owning data boundary.
- Bulk retrieval.
- Batching.
- Purpose-built read models.
- DataLoader-style request-scoped batching when appropriate.
- Caching when the consistency requirements allow it.

Batching must preserve authorization, data ownership, and the semantics of the public capability.

### Bulk Operations

When multiple items require the same operation, a bulk capability may reduce repeated validation, round trips, and scheduling overhead.

Bulk operations should define:

- Maximum batch size.
- Validation behavior.
- Transaction semantics.
- Partial-success behavior, if supported.
- Failure reporting.
- Authorization requirements.
- Resource-consumption limits.

A bulk request must not become an excuse to bypass business rules for individual items.

### Pagination

Unbounded collection retrieval can increase database load, memory usage, serialization cost, and response latency.

Collection capabilities should use appropriate pagination or other bounded retrieval mechanisms.

The design should consider whether offset-based or cursor-based pagination best fits the query pattern and consistency requirements.

Large exports or full data processing jobs should generally use a controlled background-processing strategy rather than loading an unlimited collection into a single API request.

### Indexing

Indexes should support demonstrated query patterns.

Before adding an index, evaluate:

- Query frequency.
- Selectivity.
- Sort and filter requirements.
- Write overhead.
- Storage consumption.
- Existing indexes.
- Query plans.

An index can improve reads while increasing write cost and storage usage. It is not automatically beneficial for every queried field.

### Connection Pooling

Database connections are limited resources.

Connection pools should be configured according to the application's concurrency, database capacity, number of application instances, and other clients sharing the database.

Adding more application instances can multiply total potential connections. Capacity planning must consider the aggregate, not only each process independently.

Do not increase connection pool sizes blindly to address slow queries.

## Synchronous and Asynchronous Interactions

The choice between synchronous and asynchronous communication affects latency, resource usage, consistency, and failure behavior.

### Synchronous Interaction

Synchronous communication is appropriate when the caller needs an immediate result to continue correctly.

Examples include:

- Validating a business condition before committing an operation.
- Retrieving required information for a response.
- Performing an immediate authorization check.
- Calling a capability whose result determines the next step.

Advantages include:

- Straightforward control flow.
- Immediate success or failure feedback.
- Clear request-response semantics.

Costs include:

- The caller waits for the dependency.
- Slow dependencies increase end-to-end latency.
- Dependency failure can directly affect the request.
- Long-running work can consume request and connection resources.

Synchronous calls should have appropriate deadlines and failure-handling policies.

### Asynchronous Interaction

Asynchronous communication is appropriate when work can complete after the initiating operation returns.

Examples include:

- Sending a notification.
- Processing a large file.
- Generating a report.
- Updating a derived projection.
- Performing a long-running workflow step.

Advantages include:

- The initiating request can return sooner.
- Work can be processed with bounded worker concurrency.
- Temporary failures can be retried independently.
- Workloads can be isolated from interactive requests.

Costs include:

- Additional operational complexity.
- Delayed completion.
- Eventual consistency where applicable.
- Duplicate delivery and retry concerns.
- The need for durable state and recovery.
- More complex observability and testing.

Asynchronous execution does not automatically make an operation faster. It changes where and when the work is performed.

### Hybrid Interactions

A hybrid flow combines synchronous and asynchronous steps.

For example, an API request may validate and persist an enrollment synchronously, then initiate payment processing or notifications asynchronously.

The system must define precisely which state is confirmed when the API response is returned.

A successful response indicating that an operation was accepted must not be confused with confirmation that all downstream workflow steps have completed.

## Concurrency and Parallelism

Concurrency allows multiple operations to make progress during overlapping periods. Parallelism means multiple operations execute simultaneously.

Both can improve throughput, but uncontrolled concurrency can overwhelm shared resources.

### Bounded Concurrency

Any component that starts concurrent work should consider a suitable concurrency limit.

Examples include:

- Concurrent calls to an external service.
- Background worker counts.
- Parallel processing of a batch.
- Concurrent database-intensive operations.
- Event consumer workers.

The limit should reflect downstream capacity, memory requirements, latency targets, and failure behavior.

A high concurrency setting does not necessarily improve throughput if the database or external service is already saturated.

### Avoid Unbounded Promise Creation

Creating an unbounded number of asynchronous tasks can exhaust memory, connections, sockets, or downstream capacity.

Instead, use controlled batches, worker pools, or other bounded scheduling mechanisms.

A large collection should not automatically result in one concurrent task per item.

### Concurrency and Business Invariants

Parallel operations must preserve the business rules they affect.

For example, checking course capacity and creating an enrollment cannot safely be treated as independent operations if concurrent requests could overbook the course.

The owning module must enforce the invariant using an appropriate transaction, conditional update, concurrency-control mechanism, or other valid design.

Performance optimization must not replace correctness with optimistic assumptions.

### Cancellation and Deadlines

When a request or workflow no longer needs a result, cancellation can reduce unnecessary resource consumption.

Cancellation should propagate across supported boundaries when appropriate.

However, cancellation does not guarantee that an already-started database operation or external side effect has stopped.

The implementation must distinguish work that can be safely abandoned from work that requires reconciliation or recovery.

## Caching and Read Optimization

Caching can reduce repeated computation and database access, but it introduces consistency and invalidation concerns.

### Appropriate Uses

Caching may be appropriate for:

- Frequently accessed reference data.
- Expensive computations with reusable results.
- Read-heavy capabilities.
- Derived data that can tolerate a defined degree of staleness.
- Expensive external lookups with a valid cache policy.

### Cache Ownership

A cache must have a clear owner and invalidation policy.

A module may cache its own data or use an explicitly designed shared caching mechanism.

One module must not use a cache as a hidden means of taking ownership of another module's private data.

### Cache Correctness

Before introducing caching, define:

- What is cached.
- Who owns the source of truth.
- How cache keys are scoped.
- How stale data is handled.
- How invalidation occurs.
- What happens when the cache is unavailable.
- Whether the cache is permitted to return stale data.
- How concurrent updates are handled.

Cache keys must include all relevant dimensions, such as tenant or authorization scope, when those dimensions affect the result.

### Cache Failure

A cache outage can cause a sudden increase in database traffic.

The application should consider whether the underlying dependency can absorb the resulting load.

Fallback behavior, bounded concurrency, and appropriate load protection may be necessary.

Do not assume that bypassing a failed cache is always safe for system capacity.

### Cache Only When Justified

Caching adds operational and correctness complexity.

Measure the cost of the existing access pattern first. Optimize query efficiency and eliminate redundant work before introducing additional cache infrastructure when those changes are sufficient.

## Eventing and Background Processing Performance

Asynchronous processing can separate interactive workloads from longer-running work, but queues and event consumers introduce their own capacity constraints.

### Queue Backlog

A queue backlog grows when incoming work arrives faster than workers can process it.

The system should monitor:

- Queue depth or consumer lag.
- Age of the oldest pending item.
- Incoming event rate.
- Processing rate.
- Retry rate.
- Failed or dead-lettered messages.
- Worker utilization.

Queue depth alone may not reveal the severity of a problem. A small queue of very old work can be more concerning than a large queue that is being processed quickly.

### Consumer Concurrency

Increasing consumer concurrency may improve throughput until another resource becomes the bottleneck.

Excessive concurrency can increase database contention, downstream rate limiting, memory consumption, and duplicate processing during recovery.

Consumer scaling should be based on measured processing capacity and downstream constraints.

### Backpressure

Backpressure prevents producers or intermediate components from overwhelming downstream consumers.

Possible mechanisms include:

- Bounded queues.
- Concurrency limits.
- Rate limiting.
- Batch-size limits.
- Pausing consumption.
- Rejecting or deferring non-critical work.
- Applying admission control.

The correct mechanism depends on whether the work can be delayed, rejected, or safely discarded.

Required business events must not be silently dropped as a substitute for backpressure.

### Event Delivery and Correctness

Performance optimizations must preserve the guarantees established by `eventing-and-reliable-delivery.md`.

Batching, parallel consumption, and increased worker counts must not silently break ordering requirements, idempotency, or workflow consistency.

### Outbox Publisher Performance

An outbox publisher must process pending records efficiently without creating uncontrolled database or transport load.

Potential techniques include:

- Bounded batches.
- Appropriate indexes.
- Controlled polling intervals.
- Multiple workers with safe record claiming.
- Cleanup of old published records.
- Monitoring publication latency and backlog age.

The implementation must account for concurrent publishers and avoid publishing the same record concurrently unless the delivery and consumer design safely supports it.

## Payload Size and Data Transfer

Large payloads increase serialization cost, memory pressure, network traffic, and processing latency.

Public capabilities and event contracts should return or transmit only the data needed for their intended purpose.

### Payload Optimization

Consider:

- Selecting only required fields.
- Using pagination.
- Supporting batch retrieval.
- Avoiding repeated nested data.
- Compressing large responses when appropriate.
- Moving large file contents to dedicated storage and passing authorized references.
- Avoiding unnecessary repeated serialization and transformation.

Payload reduction must not remove information required for business correctness, authorization, or auditing.

### File Processing

Large uploads, conversions, and exports can consume significant memory and CPU.

Where appropriate, use streaming, chunked processing, bounded buffers, and asynchronous jobs rather than loading entire files into memory.

File access must still respect authorization, ownership, validation, and retention requirements.

## Cross-Module Read Patterns

A caller may need information owned by multiple modules.

The architecture must choose an access pattern based on the required freshness, latency, consistency, and workload.

### Direct Capability Calls

Use direct calls when the caller needs current information from another module and the synchronous dependency is acceptable.

Prefer a purpose-built public capability over repeated low-level access to internal structures.

### Bulk Capabilities

When a caller needs information about many entities, a bulk capability can reduce repeated calls and overhead.

The owning module remains responsible for applying the appropriate authorization and data-access rules.

### Projections and Read Models

A projection or read model can combine information for read-heavy use cases without requiring every request to execute multiple expensive capability calls.

This introduces additional design requirements:

- Ownership of the projection.
- Data freshness expectations.
- Update and rebuild mechanisms.
- Handling of missed or duplicate events.
- Consistency between source data and derived state.
- Authorization and data minimization.
- Recovery from projection-processing failures.

A projection is a derived representation, not a replacement for the authoritative business data.

### Denormalization

Denormalization may improve read performance by storing information in a form that is cheaper to retrieve.

However, duplicated data introduces synchronization and staleness concerns.

Denormalization should be introduced when its read-performance benefits justify the added consistency and operational complexity.

Do not duplicate authoritative business state across modules merely to avoid a capability call.

## Workflow Performance

Cross-module workflows may involve multiple synchronous calls, asynchronous steps, retries, and compensation.

Their performance should be evaluated across the complete business process, not only the duration of individual steps.

### Critical Path

The critical path is the sequence of dependent operations that determines the earliest possible completion time.

Optimizing a step outside the critical path may not materially improve end-to-end latency.

Measure where the workflow spends time before deciding which step to optimize.

### Parallel Workflow Steps

Independent steps may execute concurrently when doing so preserves business correctness.

The workflow owner must account for:

- Dependencies between steps.
- Concurrency limits.
- Failure propagation.
- Cancellation behavior.
- Partial completion.
- Compensation and recovery.
- The effect of one slow step on overall completion.

Do not parallelize steps that depend on one another or whose concurrent execution could violate business invariants.

### Long-Running Workflows

Long-running workflows should not hold HTTP requests, database transactions, or other scarce resources open while waiting for unrelated work.

Where appropriate, persist workflow progress and continue execution asynchronously.

Durable state introduces storage and operational overhead, but it enables recovery without requiring a request to remain active.

### Timeouts and Latency Budgets

Workflows should use deadlines or latency budgets appropriate to their requirements.

A latency budget can be allocated across dependent operations so that one slow dependency does not consume all available time without leaving room for necessary processing.

Timeouts must be coordinated with retry policies. Retrying an operation beyond the useful deadline wastes resources and can increase load during a failure.

An expired deadline does not establish that an already-started operation failed.

## Execution Context and Observability

Performance investigations require visibility into the complete execution path.

The execution context should carry relevant correlation and tracing information across supported boundaries, including asynchronous work when appropriate.

Useful measurements include:

- Total request duration.
- Module capability duration.
- Database query duration.
- External dependency latency.
- Queue wait time.
- Event processing duration.
- Retry delay and attempt count.
- Workflow step duration.
- Cache hit and miss rates.
- Resource utilization and saturation.

Instrumentation should avoid excessive overhead and high-cardinality metric labels.

Correlation identifiers can help connect related operations, but they should not be used as unbounded metric dimensions.

Tracing and logging must respect the execution-context and security rules defined elsewhere in the architecture.

## Scalability

Scalability describes the system's ability to handle increased workload while maintaining acceptable behavior and cost.

It is not achieved simply by adding more application instances.

### Vertical Scaling

Vertical scaling increases the resources available to an instance or dependency.

It may be appropriate when a workload is constrained by CPU, memory, or another resource that can be increased economically.

Its limits include maximum instance capacity, cost, and the capacity of shared dependencies.

### Horizontal Scaling

Horizontal scaling adds more application instances or workers.

It may improve throughput when work can be distributed and shared dependencies have sufficient capacity.

However, horizontal scaling can also increase:

- Database connection counts.
- Concurrent downstream requests.
- Queue consumption rates.
- Cache traffic.
- Contention for shared resources.

The entire workload and its dependencies must be considered before scaling a component.

### Scale by Workload

Different workload types may require different scaling strategies.

Examples include:

- Interactive API traffic.
- CPU-intensive processing.
- Background jobs.
- Event consumption.
- File transformation.
- Scheduled maintenance.

These workloads may share one deployment initially and be separated later if their resource profiles, isolation requirements, or scaling needs justify it.

Logical module boundaries should make such evolution possible without requiring physical separation from the beginning.

### Avoid Premature Distribution

Introducing network boundaries between modules creates additional latency, failure modes, deployment requirements, and operational overhead.

A modular monolith should remain the default when it satisfies the workload and organizational requirements.

Extracting a module into a separate service should be based on a concrete reason, such as independent scaling, stronger isolation, separate deployment needs, or a justified operational boundary.

Performance pressure alone does not automatically justify microservices. First establish the actual bottleneck and evaluate simpler options.

## Load Shedding and Resource Protection

When demand exceeds available capacity, the system needs a deliberate way to protect critical operations.

Possible controls include:

- Request rate limits.
- Bounded worker concurrency.
- Queue capacity limits.
- Admission control.
- Timeouts.
- Circuit breakers.
- Bulkheads.
- Prioritization of critical workloads.
- Rejection or deferral of non-critical work.

These controls must have clear semantics.

The system must not silently discard required business operations or report success when the operation was not accepted.

For asynchronous work, the acceptance response should accurately describe whether the work was durably accepted, merely scheduled in memory, or rejected.

## Performance Testing

Performance decisions must be supported by tests and measurements representative of the expected workload.

### Load Testing

Load tests evaluate behavior under an expected level of concurrent traffic.

Measure:

- Throughput.
- Latency percentiles.
- Error rates.
- CPU and memory.
- Database utilization.
- Connection-pool usage.
- Queue backlog.
- Dependency latency.

### Stress Testing

Stress tests increase workload beyond expected capacity to identify bottlenecks and failure behavior.

The goal is to understand where performance degrades and whether the system fails in a controlled, recoverable way.

### Spike Testing

Spike tests evaluate sudden increases in demand and whether the system can respond without exhausting resources or causing persistent backlogs.

### Soak Testing

Soak tests run workloads over an extended period to identify resource leaks, growing queues, connection exhaustion, and other long-term problems.

### Workload Realism

Tests should represent realistic payload sizes, data distributions, query patterns, concurrency, and dependency behavior.

Synthetic tests that omit the actual bottleneck can produce misleading conclusions.

Performance testing must also verify correctness. Faster execution is not an improvement if it introduces duplicate effects, lost events, inconsistent state, or unauthorized data access.

## Anti-Patterns

Avoid the following practices:

### Bypassing Module Boundaries for Speed

Direct access to another module's persistence structures may reduce a call temporarily but weakens ownership and increases long-term coupling.

### Optimizing Without Measurement

Introducing caches, queues, indexes, or additional infrastructure without identifying the bottleneck can add complexity without improving the workload.

### Unbounded Concurrency

Starting work without limits can exhaust memory, connections, or downstream capacity.

### Unbounded Collection Retrieval

Loading entire datasets into memory creates unpredictable resource usage and response latency.

### Uncontrolled Retry and Queue Growth

Repeated attempts and unbounded backlogs can turn a temporary dependency failure into a system-wide outage.

### Parallelizing Dependent Operations

Parallel execution is unsafe when steps depend on each other's results or compete over the same business invariant without appropriate coordination.

### Caching Without an Ownership or Invalidation Policy

A fast response containing incorrect or unauthorized data is not a valid optimization.

### Premature Microservices

Separating modules into networked services before a demonstrated need exists introduces distributed-system costs without necessarily improving performance.

### Increasing Connection Pools Blindly

Larger connection pools may worsen database saturation rather than improve throughput.

### Measuring Only Average Latency

Average latency can hide severe tail latency that affects users and downstream workflows.

### Scaling Only the Application Tier

Adding application instances cannot solve every bottleneck and may overload shared databases or external dependencies.

### Ignoring Operational Cost

An optimization that improves request latency while dramatically increasing infrastructure cost, recovery complexity, or failure risk must be evaluated as a trade-off.

## Decision Guide

Before implementing a module-interaction optimization, answer these questions:

1. What performance problem has been observed?
2. Which workload and user-facing or business requirement does it affect?
3. What measurements establish the bottleneck?
4. Is the bottleneck CPU, I/O, database access, network latency, queueing, or contention?
5. Can unnecessary work or repeated queries be eliminated?
6. Can a public capability be improved or made more efficient?
7. Would batching or bounded parallelism preserve correctness?
8. Does the operation require fresh data, or is a projection or cache acceptable?
9. What consistency and staleness guarantees would the optimization introduce?
10. Could the change weaken module ownership or expose private implementation details?
11. How will concurrency and resource consumption be bounded?
12. What happens when the optimized dependency becomes slow or unavailable?
13. Will retries or asynchronous queues amplify the workload?
14. How will the change affect tail latency and throughput?
15. Does scaling the component increase pressure on shared dependencies?
16. Is additional infrastructure justified by measured requirements?
17. How will the optimization be tested and monitored?
18. What operational and maintenance costs does it introduce?
19. Does the optimization preserve security and business invariants?
20. How will its effectiveness be verified after implementation?

If the performance problem cannot be measured or the expected improvement cannot be validated, avoid introducing substantial architectural complexity prematurely.

## Architectural Rules

The following rules govern module-interaction performance in the MERN Enterprise Starter:

1. Performance optimization must preserve module ownership and public boundaries.
2. Performance decisions must be based on measurements or clearly justified workload requirements.
3. Module interactions must not bypass public capability contracts to access private persistence structures.
4. Public capabilities should avoid unnecessary queries, repeated work, and excessive payloads.
5. Database access, connection pools, and concurrent workloads must be bounded according to capacity.
6. Parallel execution must preserve dependencies, business invariants, and transaction semantics.
7. Caching and projections must have explicit ownership, freshness, and recovery policies.
8. Synchronous and asynchronous execution must be selected according to latency, consistency, and failure requirements.
9. Queues, retries, and background workers must have appropriate resource limits and operational visibility.
10. Performance improvements must not weaken idempotency, event delivery, or workflow recovery guarantees.
11. Scaling decisions must account for shared dependencies and aggregate resource consumption.
12. Load shedding and admission control must communicate accurately whether work was accepted.
13. Physical module separation must be justified by actual workload or operational requirements.
14. Performance testing must evaluate both efficiency and business correctness.
15. Additional infrastructure and abstractions must be justified by measurable benefits.

## Relationship to Other Architecture Documents

This document complements the following project documents:

- `ARCHITECTURE.md` — Defines the overall architecture, module boundaries, ownership rules, and architectural invariants.
- `docs/architecture/cross-module-workflows.md` — Defines workflow coordination, transaction boundaries, and recovery.
- `docs/architecture/eventing-and-reliable-delivery.md` — Defines event delivery, the transactional outbox, consumer reliability, and event replay.
- `docs/architecture/failure-handling-and-idempotency.md` — Defines failure classification, retry policies, idempotency, and recovery from unknown outcomes.
- `docs/architecture/execution-context.md` — Defines execution-context propagation across relevant execution boundaries.
- `docs/architecture/observability-and-resilience.md` — Defines logging, metrics, tracing, and operational resilience.


## Closing Principle

Performance is an architectural concern, but not every performance problem requires an architectural redesign.

The most effective improvements often come from eliminating unnecessary work, improving public capabilities, reducing database round trips, bounding concurrency, and making workload behavior observable.

**Optimize the measured bottleneck, preserve business correctness, and introduce complexity only when the workload justifies it.**
