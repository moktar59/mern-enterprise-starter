# Failure Handling and Idempotency

## Purpose

This document defines the architectural principles for failure classification, retry behavior, idempotency, and recovery in the MERN Enterprise Starter.

It establishes how the application responds to transient failures, permanent failures, timeouts, duplicate requests, uncertain outcomes, and partial completion across module and infrastructure boundaries.

The objectives are to:

- Preserve business invariants when operations fail.
- Prevent duplicate business effects.
- Retry only when retrying is appropriate and safe.
- Make failure ownership explicit.
- Support reliable recovery of interrupted workflows.
- Prevent retry amplification and cascading failures.
- Keep failure-handling policies consistent across the application.

This document defines architectural rules rather than mandating a specific retry library, queue, database, or resilience framework.

## Core Concepts

### Failure

A failure occurs when an operation cannot complete according to its expected contract.

Failures may originate from business rules, application logic, persistence, external services, infrastructure, or execution constraints.

Not every failure is exceptional. A rejected business operation, such as an enrollment request for a full course, may be an expected outcome rather than a system failure.

The architecture must distinguish expected business outcomes from technical failures.

### Retry

A retry is another attempt to perform an operation after an earlier attempt did not produce a confirmed successful outcome.

A retry does not establish that the original attempt failed. The original operation may have succeeded even if its response was lost.

### Idempotency

An operation is idempotent when repeating the same logical operation produces the same intended business outcome as performing it once.

Idempotency does not necessarily mean that every internal action executes only once. It means repeated execution does not create additional unintended effects.

### Unknown Outcome

An unknown outcome occurs when the system cannot determine whether an operation succeeded.

For example, a payment provider may process a payment while the application times out before receiving the response.

Unknown outcomes require special handling because blindly retrying may repeat an operation that already succeeded.

### Recovery

Recovery is the process of restoring a valid business or operational state after a failure.

Recovery may involve retrying, reconciling with an authoritative system, resuming a workflow, compensating a completed action, or requiring manual intervention.

Recovery must preserve business invariants rather than simply repeating failed code.

## Failure Classification

Failures must be classified according to their cause, expected persistence, and safe recovery strategy.

The following categories provide a common architectural vocabulary.

### Business Rejection

A business rejection occurs when an operation violates a business rule or cannot proceed under the current business conditions.

Examples:

- A course has reached its enrollment limit.
- An account is suspended.
- A requested state transition is invalid.
- A user is not eligible for an operation.

**Default handling:** Return an appropriate business outcome and do not retry automatically.

A retry may be appropriate only if the business condition changes and the operation is deliberately attempted again.

Business rejections must not be disguised as transient infrastructure failures.

### Transient Failure

A transient failure is likely to resolve without changing the underlying business request.

Examples:

- Temporary database unavailability.
- A short-lived network interruption.
- An external service returning a retryable response.
- Temporary rate limiting.
- A recoverable resource contention failure.

**Default handling:** Retry may be appropriate when the operation is safe to repeat, the failure is eligible for retry, and the retry budget permits another attempt.

Transient does not mean harmless. Repeated transient failures can exhaust resources and create cascading failures.

### Permanent Failure

A permanent failure is unlikely to succeed through repetition without changing the request, configuration, or underlying condition.

Examples:

- Invalid input.
- An unsupported event schema.
- Missing required configuration.
- A violated business invariant.
- An operation that is not authorized.
- An incompatible request format.

**Default handling:** Do not retry automatically unless a specific recovery mechanism can resolve the cause.

A configuration correction or software fix may make a later attempt valid, but repeatedly executing the same failing operation is not a recovery strategy.

### Unknown Outcome

An unknown outcome occurs when an operation may have succeeded, but the caller cannot confirm the result.

Examples:

- A payment request times out after being sent.
- A remote service completes an operation but the response is lost.
- A connection drops during a commit whose result is not known to the caller.
- A worker crashes after an external side effect but before recording completion.

**Default handling:** Reconcile the outcome or retry using a mechanism that guarantees the same logical operation cannot produce an unintended duplicate effect.

Unknown outcomes must not automatically be classified as failures.

### Cancellation

Cancellation occurs when an operation is intentionally stopped because it is no longer required, its deadline has expired, or its owner has requested termination.

Cancellation does not prove that previous side effects were rolled back.

If an external operation has already succeeded, cancelling the local execution does not undo that operation.

The application must define which work can be safely cancelled, what cleanup is required, and whether reconciliation or compensation is necessary.

## Failure Ownership

Failure handling must have explicit ownership at every boundary.

| Boundary | Primary responsibility |
|---|---|
| Business module | Enforce business invariants and define valid business outcomes |
| Application use case | Coordinate operation-level failure handling |
| Persistence adapter | Translate persistence failures and preserve transaction guarantees |
| External-service adapter | Translate transport and provider failures into meaningful application outcomes |
| Retry mechanism | Enforce retry eligibility, limits, and timing |
| Workflow owner | Coordinate recovery across multiple steps and transaction boundaries |
| Event consumer | Handle duplicate delivery and processing failures |
| Composition root | Wire the configured failure-handling mechanisms |
| Operations and monitoring | Detect sustained failures and support investigation and recovery |

A component may delegate a technical operation, but delegation must not make responsibility ambiguous.

The component that owns a retry policy must understand the consequences of repeating the operation.

A lower-level adapter should not independently retry indefinitely when the application or workflow already owns the overall retry policy.

## Error Representation and Translation

### Separate Error Categories

The application should distinguish at least the following concepts:

- Business errors: the requested operation is invalid under business rules.
- Validation errors: the request does not satisfy the input contract.
- Authorization errors: the caller is not permitted to perform the operation.
- Dependency errors: a required external or infrastructure dependency failed.
- Persistence errors: a database operation failed.
- Concurrency errors: an operation conflicted with another update.
- Timeout errors: an operation exceeded its time limit.
- Cancellation: execution was intentionally stopped.
- Unknown-outcome errors: the final result cannot yet be established.
- Unexpected application errors: failures that were not anticipated by the operation's contract.

These categories are conceptual. The implementation may use structured error classes, error codes, result types, or another explicit representation.

### Translate Errors at Boundaries

Infrastructure-specific errors should be translated at the appropriate adapter or boundary into meaningful application-level failures.

For example, a database driver exception should not become part of a public business-module contract.

Likewise, a remote service's error format should not leak throughout the application.

Translation must preserve the information necessary for safe decisions, including:

- Whether the operation may have succeeded.
- Whether the failure is retryable.
- Whether the operation is safe to repeat.
- Whether reconciliation is required.
- Whether the failure should be exposed to the caller.

Do not classify every timeout, connection error, or server error as retryable without considering the operation and its outcome.

### Public Error Disclosure

Internal diagnostics and public error responses serve different purposes.

Public responses should expose only information appropriate for the caller, such as a stable error code and a safe message.

Internal diagnostics may include the dependency, failure category, correlation identifier, and relevant technical details, subject to security and privacy controls.

Never expose credentials, secrets, raw stack traces, or sensitive internal state through public error responses.

## Retry Policy

A retry policy determines whether another attempt is allowed and how that attempt is scheduled.

Every automatic retry mechanism must have a defined policy.

### Retry Eligibility

Before retrying, evaluate:

1. Is the failure eligible for retry?
2. Is the operation safe to repeat?
3. Could the original attempt have succeeded?
4. Is reconciliation required before another attempt?
5. Is the retry within the operation's deadline?
6. Is the retry budget still available?
7. Could the retry worsen an existing outage?
8. Which component owns the retry?

If these questions cannot be answered, automatic retries should not be enabled by default.

### Bounded Retries

Automatic retries must be bounded by an explicit limit, deadline, retry budget, or combination of these controls.

A retry policy must not continue indefinitely.

Limits may be based on:

- Maximum attempts.
- Maximum elapsed time.
- An overall workflow deadline.
- A shared retry budget for a dependency.
- A combination of these limits.

The implementation must define whether the initial attempt counts toward the maximum attempt count.

Retry limits should reflect the operation's latency requirements, business consequences, and dependency characteristics.

### Exponential Backoff

Exponential backoff increases the delay between consecutive attempts.

An illustrative policy is:

\[
d_n = \min(d_{\max}, d_0 \times 2^n)
\]

Where:

- \(d_0\) is the initial delay.
- \(n\) is the retry index, starting at zero.
- \(d_{\max}\) is the maximum delay.

This formula is an example, not a mandatory project configuration.

Backoff prevents rapid repeated attempts from overwhelming a failing dependency.

### Jitter

Jitter introduces controlled randomness into retry delays.

Without jitter, many clients that fail simultaneously may retry simultaneously, creating repeated load spikes.

Jitter is especially useful when many application instances or workers share a dependency.

The precise jitter strategy should be selected according to the retry mechanism and its requirements.

### Retry-After and Rate Limiting

When a dependency provides a documented retry delay, such as an HTTP `Retry-After` response, the application should respect that guidance when appropriate.

The retry policy must still enforce its overall deadline and budget.

Rate limiting must not be bypassed by immediate, repeated retries.

### Retry Amplification

Retry amplification occurs when multiple layers retry the same operation independently.

For example:

```text
HTTP Request
    |
    v
Application Retry: 3 attempts
    |
    v
Service Adapter Retry: 3 attempts
    |
    v
Database Driver Retry: 3 attempts
```

Depending on the exact implementation, this arrangement can multiply the number of downstream attempts.

The architecture should define retry ownership at each boundary and avoid overlapping policies that create uncontrolled amplification.

Low-level retries may still be appropriate for narrowly scoped technical operations, but their interaction with higher-level policies must be understood.

### Retry Budgets and Deadlines

Retries consume resources and extend execution time.

A retry budget limits the amount of additional work that failures can generate. A deadline limits how long an operation is allowed to remain active.

Both controls help prevent a degraded dependency from consuming all available application resources.

When a deadline is exhausted, the application must stop initiating additional attempts and apply the appropriate failure or reconciliation policy.

A deadline does not establish whether an operation succeeded.

## Idempotency Principles

### Why Idempotency Matters

Consider a client submitting an enrollment request.

The server creates the enrollment successfully, but the response is lost. The client retries the request.

Without idempotency, the server might create two enrollments.

With idempotency, both attempts refer to the same logical operation and produce one intended business result.

Idempotency is important for:

- HTTP requests that clients may retry.
- Payment operations.
- Order and enrollment creation.
- Background jobs.
- Event consumers.
- Workflow steps.
- External API calls.
- Recovery and replay operations.

Not every read-only operation requires an idempotency record. The mechanism should be selected according to the risk of repeated execution.

### Logical Operation Identity

Idempotency requires a stable way to identify the logical operation.

Depending on the boundary, this may be:

- An idempotency key supplied by a client.
- A stable command identifier.
- A message or event identifier.
- A workflow-step identifier.
- A business operation identifier.
- A provider-supported idempotency key.

The identifier must remain stable across retries of the same logical operation.

Generating a new key for every retry defeats deduplication.

Different logical operations must not accidentally share the same key.

### Idempotency Is Not Just Duplicate Detection

Detecting that a request was previously seen is insufficient if the original operation's result cannot be recovered.

A complete design must establish:

- How the logical operation is identified.
- How concurrent attempts are handled.
- How the operation's result is recorded.
- How the business effect and idempotency record are made consistent.
- How failures and unknown outcomes are represented.
- How long the record is retained.
- What happens when the same key is used with different input.

Idempotency is a business correctness mechanism, not merely a performance optimization.

## Idempotency Keys and Request Fingerprints

### Key Scope

An idempotency key must be scoped appropriately to prevent collisions across callers or operation types.

The scope may include:

- The authenticated principal or tenant, where applicable.
- The operation or endpoint.
- The supplied idempotency key.

The correct scope depends on the business contract.

The application must not allow one caller to retrieve another caller's operation result simply by guessing or reusing an idempotency key.

### Request Fingerprint

The system should associate an idempotency key with a fingerprint of the relevant request parameters.

The fingerprint can be calculated from a normalized representation of the input or another explicitly defined comparison mechanism.

If the same key is reused with materially different input, the system should reject the conflicting request rather than silently returning an unrelated result or executing a second operation.

Normalization rules must be documented so that equivalent inputs are handled consistently.

Do not include irrelevant transport metadata in a request fingerprint unless the operation contract explicitly requires it.

### Key Retention

Idempotency records must be retained long enough to cover the expected retry and replay window.

Retention should account for:

- Client retry behavior.
- Network and timeout characteristics.
- Background job recovery.
- Event redelivery.
- External provider guarantees.
- Business and financial risk.
- Operational replay policies.

Deleting a record too early may permit an old request to execute again.

Permanent retention is not always necessary or desirable. The retention policy must be deliberate and compatible with the operation's guarantees.

## Idempotent Request Processing

For an operation that requires durable idempotency, a conceptual processing flow is:

1. Authenticate and authorize the caller.
2. Validate the request.
3. Identify the logical operation and its idempotency key.
4. Check whether a record already exists for that key and scope.
5. If the operation has completed, return the stored or reproducible result, subject to authorization.
6. If the same key is associated with a different request, reject the conflict.
7. If the operation is already in progress, apply the documented in-progress policy.
8. Otherwise, execute the operation while enforcing the required business invariants.
9. Persist the business effect and operation result atomically when they share a transaction boundary.
10. Return the result according to the operation's contract.

This is a conceptual sequence, not a requirement to perform all checks as separate database operations.

The implementation must account for concurrent requests. A check-then-insert sequence without appropriate database constraints or concurrency control is not sufficient.

### Concurrent Requests

Two requests using the same idempotency key may arrive simultaneously.

The design must ensure that both cannot independently execute the same protected business effect.

Possible mechanisms include:

- Unique database constraints.
- Atomic record creation.
- Transactional coordination.
- Conditional state transitions.
- Explicit in-progress records.
- Durable operation ownership.

A process-local map or in-memory lock is insufficient when multiple application instances or workers can process the same operation.

### In-Progress Operations

An operation may remain in progress when a worker crashes or a dependency becomes unavailable.

The design must define how such records are recovered.

Possible strategies include:

- Leases with expiration.
- Durable workflow state.
- Reconciliation with an authoritative system.
- Safe resumption from a recorded step.
- Manual intervention for ambiguous outcomes.

A lease expiring does not prove that the original operation stopped or that an external side effect did not occur.

Recovery must preserve idempotency even when an earlier worker continues running or completed an external action.

## Database Transactions and Idempotency

When the business effect and idempotency record are stored in the same transactional database, they should normally be committed atomically.

For example:

```text
Database Transaction
        |
        +--> Enforce operation uniqueness
        |
        +--> Apply business change
        |
        +--> Store operation result
        |
        v
    Commit
```

If the transaction commits, the business effect and its operation record become durable together.

If it rolls back, neither should become committed state.

The exact implementation depends on the database and concurrency model.

When the business effect and idempotency record cannot share a transaction, the design must explicitly address partial completion and recovery. Merely writing a record before or after the side effect does not eliminate the failure window.

Idempotency must also respect module ownership. A shared idempotency mechanism may provide technical infrastructure, but it must not bypass the owning module's business rules or persistence boundaries.

## External Side Effects

External side effects require special care because the application usually cannot include them in its local database transaction.

Examples include:

- Charging a payment method.
- Sending an email.
- Calling a third-party API.
- Provisioning an external resource.
- Triggering a notification provider.

Consider this sequence:

1. The application calls an external service.
2. The external service completes the operation.
3. The response is lost.
4. The application cannot determine whether the operation succeeded.

A local database rollback cannot undo the external operation.

### Preferred Strategies

Use one or more of the following when appropriate:

- A provider-supported idempotency key.
- A stable external operation identifier.
- An authoritative status query.
- Reconciliation against the external system.
- A durable workflow state machine.
- An outbox for reliably initiating asynchronous work.
- Compensation when the business process supports a meaningful corrective action.

The chosen strategy must be supported by the external service's actual contract.

If the provider does not support idempotency or reliable status lookup, the architecture must acknowledge the remaining uncertainty and define an explicit recovery procedure.

### Notifications

Emails, SMS messages, and push notifications may be repeated when a provider succeeds but the acknowledgement is lost.

If duplicate notifications are unacceptable, use a stable notification operation identifier and any provider-supported deduplication mechanism.

Even then, delivery guarantees depend on the provider's behavior. The application should not claim that a notification was delivered merely because the request was accepted.

## Event Consumers and Background Jobs

Background workers and event consumers must be designed for interrupted execution and repeated delivery.

A worker may complete its business transaction and crash before acknowledging the message. The message may then be delivered again.

For effects contained within one database transaction, a durable inbox or processed-operation record can be committed atomically with the business change.

For external side effects, the consumer must use the external operation's idempotency mechanism, reconciliation, or another explicit recovery strategy.

Background jobs should also have:

- Stable job or operation identifiers.
- Defined retry eligibility.
- Bounded attempts or deadlines.
- Clear ownership of recovery.
- Observable failure states.
- A documented policy for permanent failures.
- Safe manual redrive or replay where supported.

The same principles apply to scheduled tasks and jobs that are restarted after a process failure.

A worker restart must not be assumed to reset the business operation safely.

## Timeouts and Unknown Outcomes

A timeout limits how long the caller waits. It does not necessarily cancel the underlying operation or reverse its effects.

The architecture must distinguish:

- A request that definitely did not begin.
- An operation that definitely failed.
- An operation that succeeded.
- An operation whose outcome is unknown.

These states require different recovery behavior.

### Before Execution

If the application can establish that an operation never began, a retry may be safe, subject to the operation contract.

### During Local Execution

If an operation fails within a local transaction and the transaction is confirmed rolled back, the application can treat its uncommitted database changes as unsuccessful.

However, any external side effects performed outside that transaction must be evaluated separately.

### After an External Request

If a request was sent but its result is unknown, the application should first use the provider's idempotency contract, status lookup, or reconciliation mechanism where available.

It must not assume that a timeout means the external service did nothing.

### During Commit

If the result of a database commit is uncertain because the connection failed, the application must determine the actual transaction outcome where possible.

Retrying the business operation blindly may duplicate an effect if the commit succeeded.

Stable operation identifiers, uniqueness constraints, and reconciliation can help establish the correct outcome.

## Cross-Module Workflows and Compensation

Cross-module workflows span multiple capabilities and may involve multiple transactions.

A workflow can fail after one module has committed its changes but before another module completes its step.

A local transaction cannot automatically roll back every completed step across the workflow.

The workflow owner must define how progress is recorded, how retries are performed, and when compensation or manual recovery is necessary.

### Compensation

Compensation is a business action that attempts to correct or offset an earlier completed action.

Examples include:

- Releasing a reserved seat.
- Refunding a completed payment.
- Cancelling a provisional booking.
- Reversing an allocation through a supported business operation.

Compensation is not equivalent to a database rollback. It may fail, be delayed, or produce a business result that differs from restoring the exact earlier state.

Compensation must therefore have its own failure-handling and idempotency rules.

### Workflow Recovery

A workflow should record enough durable state to determine:

- Which steps have completed.
- Which steps are pending.
- Which steps have uncertain outcomes.
- Which retries remain available.
- Whether compensation has started.
- Whether manual intervention is required.

The workflow owner must distinguish a failed step from a step whose result is unknown.

A workflow must not advance based solely on an assumed outcome.

## Circuit Breakers, Bulkheads, and Load Shedding

Retries are not the only mechanism for responding to failures.

### Circuit Breaker

A circuit breaker temporarily prevents calls to a dependency when failures indicate that continuing to call it is unlikely to succeed.

It may help reduce repeated load on an unhealthy dependency.

A circuit breaker does not establish the outcome of a previous request and does not replace idempotency or reconciliation.

### Bulkhead

A bulkhead isolates resource pools or workloads so that failure in one area does not exhaust all application capacity.

Examples include separate concurrency limits for critical and non-critical jobs.

### Load Shedding

Load shedding deliberately rejects or defers work when the application cannot safely accept more load.

It can protect the system from resource exhaustion during an outage or traffic spike.

### Architectural Guidance

These mechanisms should be introduced when the workload, failure behavior, and operational requirements justify them.

They must have explicit ownership, configuration, metrics, and recovery behavior.

Do not add every resilience mechanism to every module by default.

## Concurrency and Race Conditions

Idempotency and retry policies must account for concurrent operations.

Two independent requests may attempt to modify the same business entity at the same time.

Examples include:

- Two requests attempting to reserve the final available seat.
- Two workers processing the same job.
- Two consumers applying state changes to the same order.
- A retry racing with an original request that is still executing.

The system must enforce business invariants using the appropriate consistency mechanism.

Possible mechanisms include:

- Database uniqueness constraints.
- Atomic conditional updates.
- Optimistic concurrency control.
- Transaction isolation.
- Explicit operation state.
- Bounded per-entity serialization.

Application-level checks alone may be insufficient when concurrent requests can pass the same check before either writes its result.

The correct mechanism belongs to the module that owns the relevant business data and invariant.

## Observability and Diagnostics

Failure handling must be observable enough to support investigation and recovery.

The application should record structured diagnostic information where appropriate, including:

- Failure category.
- Operation or workflow identifier.
- Correlation and causation identifiers.
- Attempt number.
- Retry eligibility and decision.
- Dependency or boundary involved.
- Duration and deadline status.
- Whether the outcome is confirmed or unknown.
- Recovery or compensation status.
- Final business outcome.

Metrics may include:

- Operation failure rate.
- Retry rate.
- Retry exhaustion count.
- Idempotency-key conflicts.
- Duplicate event or request detections.
- Unknown-outcome count.
- Reconciliation backlog.
- Workflow recovery duration.
- Compensation failures.
- Dependency timeout rate.
- Dead-letter count, where applicable.

Logs and metrics must avoid unnecessary sensitive information.

Alerting should identify actionable conditions, such as sustained retry exhaustion, unresolved unknown outcomes, repeated compensation failures, or a growing recovery backlog.

A retry that eventually succeeds may still indicate a degraded dependency. Success alone should not hide persistent operational problems.

## Security Considerations

Failure-handling and idempotency mechanisms must respect the application's security boundaries.

The system must ensure that:

- Idempotency records are scoped appropriately to the caller and operation.
- Stored results are not disclosed to unauthorized callers.
- Error responses do not reveal sensitive internal details.
- Retry and recovery operations do not bypass authorization.
- Manual replay and redrive operations are access-controlled.
- Secrets and credentials are not exposed in logs.
- External error payloads are validated and safely handled.
- Retained operation records follow appropriate data-protection policies.

A previously completed operation does not exempt a repeated request from necessary authentication and authorization checks.

## Testing Requirements

Failure-handling behavior must be tested at the boundaries where failures can affect business correctness.

### Unit Tests

Test:

- Failure classification.
- Retry eligibility.
- Retry limits and deadline handling.
- Error translation.
- Idempotency decisions.
- Request fingerprint comparison.
- Valid and invalid state transitions.
- Compensation behavior.
- Handling of unknown outcomes.

### Integration Tests

Test:

- Concurrent requests using the same idempotency key.
- Unique constraints and operation ownership.
- Atomic persistence of business effects and idempotency records.
- Transaction rollback behavior.
- Worker interruption and recovery.
- External adapter error mapping.
- Durable workflow resumption where applicable.

### Failure-Injection Tests

Test important failure windows, including:

- A dependency failing before an operation begins.
- A dependency succeeding but the response being lost.
- A database transaction rolling back.
- A database commit with an uncertain outcome.
- A worker crashing after a business effect but before acknowledgement.
- Two requests arriving concurrently with the same key.
- A retry racing with an original attempt.
- Retry exhaustion.
- Compensation failure.
- A permanent failure being incorrectly retried.
- Recovery from a previously unknown outcome.

Tests should verify business state and side effects, not only return values or mocked function calls.

### Recovery Tests

Where a workflow or background operation requires durable recovery, tests should demonstrate that the operation can resume without duplicating completed effects.

Manual redrive and reconciliation procedures should also be tested when they are part of the supported operational contract.

## Anti-Patterns

Avoid the following practices.

### Blind Retries

Retrying every error without classifying the failure can repeat permanent errors and duplicate successful operations.

### Unbounded Retries

Unlimited retries can consume resources, create backlogs, and amplify dependency failures.

### Treating Timeouts as Definite Failure

A timeout only establishes that the result was not obtained within the expected time. It does not establish that the operation failed.

### Generating a New Idempotency Key for Every Retry

A new key makes a retry appear to be a different logical operation and defeats deduplication.

### Check-Then-Act Without Concurrency Protection

Checking whether an operation exists and then creating it without atomic coordination allows concurrent requests to create duplicate effects.

### Non-Atomic Idempotency Records

Recording an operation as completed separately from its database effect can leave the system claiming success when the effect did not commit, or performing the effect without recording it.

### Retrying at Every Layer

Overlapping retry policies can multiply downstream requests and worsen outages.

### Assuming Cancellation Reverses Side Effects

Stopping local execution does not undo a completed remote request or committed business change.

### Treating Compensation as Rollback

Compensation is a separate business operation with its own failure modes.

### Retrying Permanent Business Rejections

Repeatedly executing an operation that violates a business rule does not make it valid.

### Ignoring Unknown Outcomes

Assuming an uncertain operation failed can produce duplicate payments, repeated notifications, or conflicting state transitions.

### Using In-Memory Deduplication for Durable Guarantees

Process-local state does not reliably coordinate multiple application instances, worker restarts, or long-running recovery.

### Hiding Recovery Failures

A failed retry, unresolved operation, or failed compensation must not disappear silently from operational visibility.

## Decision Guide

Before introducing a retry or idempotency mechanism, answer these questions:

1. What operation is being protected?
2. Which module owns its business invariant?
3. What failure categories can occur?
4. Which failures are eligible for retry?
5. Could the original attempt already have succeeded?
6. What stable identifier represents the logical operation?
7. How are concurrent attempts coordinated?
8. Can the business effect and operation record be committed atomically?
9. Does the operation include external side effects?
10. Is provider-supported idempotency available?
11. When is reconciliation required?
12. What are the retry limit, backoff policy, and deadline?
13. Which component owns the retry policy?
14. How are permanent failures surfaced?
15. How are interrupted workflows resumed?
16. Is compensation possible, and what happens if compensation fails?
17. How long are idempotency records retained?
18. How are unresolved outcomes monitored and recovered?
19. Can recovery be tested without relying only on mocks?
20. Does the proposed mechanism preserve module boundaries?

If these questions cannot be answered, the failure-handling contract is not yet sufficiently defined.

## Architectural Rules

The following rules govern failure handling and idempotency in the MERN Enterprise Starter:

1. Business outcomes must be distinguished from technical failures.
2. Failures must be classified before retry behavior is selected.
3. Every automatic retry mechanism must have an explicit owner and bounded policy.
4. Retry policies must account for deadlines, resource consumption, and retry amplification.
5. Unknown outcomes must not be treated as confirmed failures.
6. Repeated execution must not produce unintended duplicate business effects.
7. Idempotency keys must identify the same logical operation across retries.
8. Concurrent duplicate attempts must be handled through appropriate atomic or concurrency-safe mechanisms.
9. Idempotency records and business effects must share an atomic transaction when required and technically possible.
10. External side effects require an explicit idempotency, reconciliation, or recovery strategy.
11. Cross-module recovery must respect workflow ownership and transaction boundaries.
12. Compensation is a business operation, not a substitute for rollback.
13. Cancellation and timeout must not be assumed to reverse completed side effects.
14. Failure and recovery outcomes must be observable and actionable.
15. Manual replay and recovery must preserve authorization and business invariants.
16. Failure-handling mechanisms must preserve module boundaries and data ownership.
17. Resilience mechanisms must be introduced according to demonstrated requirements rather than applied indiscriminately.

## Relationship to Other Architecture Documents

This document complements the following project documents:

- `ARCHITECTURE.md` — Defines overall architectural principles, module boundaries, and invariants.
- `docs/architecture/cross-module-workflows.md` — Defines workflow coordination, durable progress, transaction boundaries, and compensation.
- `docs/architecture/eventing-and-reliable-delivery.md` — Defines event contracts, transactional outbox, delivery guarantees, consumer reliability, and event replay.
- `docs/architecture/execution-context.md` — Defines execution-context propagation across relevant execution boundaries.
- `docs/architecture/module-interaction-performance.md` — Defines performance, concurrency, and scalability considerations for module interactions.
- `docs/architecture/observability-and-resilience.md` — Defines observability, operational diagnostics, and resilience mechanisms.

Verify these paths against the actual repository before committing the document.

## Closing Principle

Failures are unavoidable in production systems. Duplicate effects, uncontrolled retries, and unrecoverable operations are architectural risks that can be reduced through explicit design.

**Classify failures before retrying, preserve operation identity across attempts, and reconcile uncertain outcomes before repeating consequential side effects.**
