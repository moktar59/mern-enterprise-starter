# Eventing and Reliable Delivery

## Purpose

This document defines the architectural principles and reliability requirements for event-driven communication in the MERN Enterprise Starter.

It explains how modules publish events, how event delivery is made reliable, how consumers handle duplicate or delayed messages, and how asynchronous communication preserves module boundaries.

The objective is to support reliable event-driven workflows without introducing unnecessary infrastructure or distributed-system complexity.

This document defines architectural rules and implementation guidance. It does not mandate a particular message broker, event library, database, or deployment model.

## Core Concepts

### Event

An event is an immutable record that something meaningful has happened.

Examples:

- `UserRegistered`
- `CoursePublished`
- `EnrollmentCreated`
- `PaymentCompleted`
- `FileUploadCompleted`

An event describes a fact, not a command.

For example:

- `PaymentCompleted` describes something that has already happened.
- `ProcessPayment` requests that an action be performed.

Commands and events have different responsibilities and must not be treated as interchangeable concepts.

### Event Producer

An event producer is the component responsible for publishing an event after a relevant business occurrence.

The producer must respect the ownership of the capability that generated the event.

A producer must not publish an event that falsely represents a business operation as completed.

### Event Consumer

An event consumer receives and processes events.

A consumer owns its response to an event, including its business rules, data changes, failure handling, and idempotency requirements.

Receiving an event does not transfer ownership of the producer's data or business rules to the consumer.

### Event Delivery

Event delivery describes how an event moves from its producer to its intended consumers.

Delivery may involve an in-process dispatcher, a durable queue, a message broker, or another explicitly defined transport.

The delivery mechanism is an infrastructure concern. Business capabilities must not depend directly on a particular transport implementation.

### Reliable Delivery

Reliable delivery means designing the system to handle expected failures without silently losing required business events or corrupting business state.

Reliability does not mean that every message is delivered exactly once or that every consumer succeeds on the first attempt.

It requires explicit guarantees, persistence where necessary, retry policies, duplicate handling, and operational recovery.

## Architectural Principles

Event-driven communication must follow these principles:

1. **Ownership:** Only the owning module determines which business facts it can publish.
2. **Explicit contracts:** Events have documented names, meanings, payloads, and compatibility rules.
3. **Durability where required:** Business events that must survive process failure require durable publication intent.
4. **Duplicate tolerance:** Consumers must account for repeated delivery whenever the delivery mechanism permits duplicates.
5. **Failure visibility:** Publication and consumption failures must be observable and recoverable.
6. **Boundary preservation:** Events must not expose private module implementation details or bypass capability ownership.
7. **Progressive complexity:** Introduce brokers, outboxes, inboxes, and other mechanisms according to actual reliability requirements.

## Domain Events and Integration Events

### Domain Events

A domain event represents a meaningful occurrence within a business domain.

Examples include:

- `EnrollmentApproved`
- `OrderConfirmed`
- `AccountSuspended`

Domain events help express business facts and may be used internally by the owning module.

They may contain domain-specific information that is appropriate within that module but unsuitable for external consumers.

Domain events should not automatically become public integration contracts.

### Integration Events

An integration event is a contract intended for communication between independently evolving capabilities or systems.

Examples include:

- `EnrollmentCreated`
- `OrderPlaced`
- `PaymentCompleted`

Integration events must be designed for their intended consumers rather than exposing internal domain objects directly.

They should have:

- A stable event type.
- A unique event identifier.
- An explicit schema version.
- A documented business meaning.
- A clearly defined payload.
- A defined publication policy.
- Appropriate security and data-disclosure controls.

A module may translate an internal domain event into an integration event when necessary.

This translation belongs at an explicitly defined boundary and must preserve the truth of the underlying business occurrence.

### Choosing Between Them

Use a domain event when the primary purpose is to represent a business occurrence within its owning domain.

Use an integration event when another capability or system needs a stable contract describing that occurrence.

Do not publish every internal domain event automatically. Doing so couples consumers to internal implementation details and makes future changes unnecessarily difficult.

## Event Ownership and Module Boundaries

The module that owns a business capability also owns the business meaning of events produced by that capability.

The owning module is responsible for determining:

- When an event is valid.
- What business fact the event represents.
- Which information may be exposed.
- The meaning and stability of its payload.
- When publication intent must be persisted.
- How the event contract evolves.

Consumers are responsible for interpreting the event according to its documented contract and applying their own business rules.

A consumer must not directly access the producer's repositories, database models, private collections, or transaction state to process an event.

If a consumer needs additional information, the architecture must explicitly define how that information is obtained. Options include a documented capability call, an appropriately designed event payload, or a consumer-owned projection.

Events must not become a back door into another module's persistence layer.

## Event Contract Design

An event contract is a public architectural interface. It must be designed and governed accordingly.

### Recommended Envelope

An integration event may use a common envelope such as:

```json
{
  "eventId": "evt_01",
  "eventType": "EnrollmentCreated",
  "schemaVersion": 1,
  "occurredAt": "2026-10-11T10:30:00.000Z",
  "producer": "enrollment",
  "correlationId": "cor_01",
  "causationId": "cmd_01",
  "payload": {
    "enrollmentId": "enr_123",
    "studentId": "stu_456",
    "courseId": "course_789"
  }
}
```

This is an illustrative structure, not a mandatory implementation schema.

Field meanings:

- `eventId`: A unique identifier for this event instance, stable across delivery retries.
- `eventType`: The documented event name.
- `schemaVersion`: The version of the payload contract.
- `occurredAt`: The time the business occurrence happened, represented in a documented timestamp format.
- `producer`: The capability that owns the event contract.
- `correlationId`: The identifier used to connect related work across a request or workflow.
- `causationId`: The identifier of the command, event, or action that directly caused this event, when applicable.
- `payload`: The event-specific data needed by intended consumers.

Identifiers and metadata must have consistent meanings across the application.

Do not generate a new `eventId` merely because an event is retried or redelivered. A retry of the same event must retain its identity.

### Payload Design

Event payloads should contain the information consumers need to interpret the published fact and perform their intended work.

Avoid including:

- Database documents or ORM models.
- Internal repository structures.
- Framework-specific objects.
- Authentication credentials, access tokens, or secrets.
- Unnecessary personal information.
- Large files or unrestricted binary payloads.
- Internal fields that consumers have no legitimate reason to access.

A consumer should not need to understand the producer's internal object model.

### Event Naming

Use stable, descriptive names that communicate business facts.

Examples:

- `UserRegistered`
- `CoursePublished`
- `EnrollmentCreated`
- `PaymentCompleted`

Names should describe what happened rather than which internal method, database operation, or technical component executed.

Avoid names such as `UserSaved`, `DatabaseUpdated`, or `HandlerExecuted` when the intended contract represents a business occurrence.

Event naming conventions must remain consistent throughout the project.

## Event Delivery Guarantees

Event delivery guarantees must be documented rather than assumed.

### At-Most-Once Delivery

A message is delivered zero or one time.

Duplicates are avoided, but a message may be lost when a failure occurs.

This may be acceptable for non-critical notifications or replaceable signals when losing an individual message has no unacceptable business consequence.

It is not an appropriate default for events whose loss would leave required business work incomplete.

### At-Least-Once Delivery

A message is delivered one or more times, assuming the system and recovery mechanisms eventually make progress.

Duplicates are possible.

This is a common choice for business events that must survive failures because publication or acknowledgement can fail after an earlier step has already succeeded.

At-least-once delivery requires consumers to handle duplicates safely.

### Exactly-Once Processing

Exactly-once delivery or processing must not be assumed merely because a broker, queue, or framework advertises exactly-once features.

A transport may provide guarantees within a limited boundary, but those guarantees do not automatically extend across a database transaction, an external API call, and another system.

The architectural objective is to achieve the required business outcome despite duplicate delivery and uncertain failures.

That usually requires durable intent, stable identifiers, idempotent processing, and explicit consistency boundaries.

## Transactional Outbox

### The Problem

Consider a module that updates business data and then publishes an event.

Two independent operations are involved:

1. Persist the business state.
2. Publish the event.

If the database update succeeds but publication fails, the business state changes without the required event being published.

If the event is published before the database transaction commits, a consumer may receive an event describing a change that ultimately rolls back.

A database transaction and a broker publication generally do not form one atomic transaction automatically.

### The Outbox Solution

The transactional outbox pattern stores the business change and the intent to publish its event within the same database transaction.

For example:

```text
Enrollment Module
       |
       v
Database Transaction
       |
       +--> Persist enrollment
       |
       +--> Persist outbox event
       |
       v
Transaction Commit
       |
       v
Outbox Publisher
       |
       v
Message Transport
       |
       v
Event Consumer
```

If the transaction commits, both the business change and its publication intent are persisted.

If the transaction rolls back, neither should become committed state.

An independent publisher reads pending outbox records and attempts delivery.

This separates the atomic business transaction from the eventual transport operation.

### Outbox Responsibilities

The owning module or its explicitly designed persistence mechanism is responsible for ensuring that the business change and corresponding outbox record are committed atomically.

The outbox publisher is responsible for attempting delivery and tracking the outcome according to the chosen delivery contract.

The message transport is responsible for its own delivery and retention guarantees.

The consumer is responsible for processing the event and handling duplicate delivery.

These responsibilities must remain explicit.

### Outbox Record Lifecycle

A simple outbox implementation may track states such as:

- `PENDING`
- `PROCESSING`
- `PUBLISHED`
- `FAILED` or an equivalent retryable status

These are illustrative states, not mandatory names.

An implementation must define how it handles:

- Claiming pending records.
- Concurrent publisher workers.
- Temporary publication failures.
- Worker crashes.
- Expired processing leases, if leases are used.
- Retry limits and backoff.
- Poison records and manual recovery.
- Published-record retention and cleanup.
- Monitoring of records that remain pending too long.

A record must not be marked successfully published before the transport has acknowledged the required publication according to the selected transport contract.

If publication succeeds but the publisher crashes before recording that success, the same event may be published again. This is expected under an at-least-once strategy.

The stable event identifier allows consumers to recognize that repeated delivery refers to the same event.

### What the Outbox Does Not Guarantee

The outbox guarantees durable publication intent when the business transaction commits, assuming the underlying database transaction and storage behave as required.

It does not, by itself, guarantee:

- That the publisher will always run.
- That a broker will remain available.
- That every consumer will successfully process the event.
- That consumers will receive the event exactly once.
- That events are delivered in business order.
- That an external side effect completes successfully.

Those guarantees require additional mechanisms and operational controls.

**The outbox is not the message broker, and publication is not proof of successful consumption.**

### When to Use an Outbox

Use a transactional outbox when losing the event after committing the business operation would violate a business or reliability requirement.

For example, if creating an enrollment must reliably initiate a downstream workflow, the enrollment and publication intent should be committed atomically.

A simpler in-process dispatcher may be sufficient for best-effort tasks where losing an individual notification is acceptable.

The decision must be based on the consequences of failure, not on a universal rule that every event requires an outbox.

## Consumer Reliability and Idempotency

### Why Duplicate Delivery Happens

Duplicates may occur when:

- A publisher retries after a timeout.
- A broker redelivers an unacknowledged message.
- A consumer completes a database operation but crashes before acknowledging the message.
- A consumer loses the acknowledgement after processing.
- An operator replays previously delivered events.

A duplicate is not necessarily evidence of a broken transport. It is an expected possibility in many reliable delivery designs.

### Idempotent Consumer Behavior

A consumer is idempotent when processing the same logical event repeatedly does not create additional unintended business effects.

For example, receiving `PaymentCompleted` twice must not cause the consumer to credit the same account twice.

The consumer must identify the relevant business operation and enforce the required invariant.

Possible mechanisms include:

- A durable inbox or processed-event record.
- A unique database constraint on the event or operation identifier.
- An idempotency key for an external API.
- A naturally idempotent state transition.
- A conditional update that only permits a valid transition once.

The correct mechanism depends on the business invariant and the resources being modified.

### Inbox or Processed-Event Records

An inbox pattern stores received event identifiers so that duplicate processing can be detected.

For database-owned business effects, a typical flow is:

1. Receive the event.
2. Start a database transaction.
3. Check whether the event has already been processed.
4. If it has, avoid repeating the business effect.
5. Otherwise, record the event and apply the business changes atomically.
6. Commit the transaction.
7. Acknowledge the message after successful processing.

The inbox record and the business effect must share the same transaction when they reside in the same transactional database and the guarantee requires atomicity.

Otherwise, a crash between recording the event and applying the business effect, or between applying the effect and recording the event, can create inconsistent outcomes.

An inbox does not automatically make external side effects idempotent. Those require their own explicit strategy.

### Deduplication Scope and Retention

The system must define how long processed-event identifiers are retained.

Deleting deduplication records while old events can still be replayed may permit the same business effect to occur again.

Retention must therefore account for expected redelivery windows, replay policies, business risk, and storage constraints.

Do not assume that keeping an event identifier in application memory is sufficient for reliable deduplication across process restarts or multiple workers.

## Ordering and Concurrency

### Event Ordering

Events may be delayed, duplicated, or delivered out of order, depending on the transport, partitioning, concurrency, and retry strategy.

The system must not assume global ordering unless the transport and application explicitly establish it.

When ordering matters, define the required scope:

- Per aggregate or business entity.
- Per workflow.
- Per partition or routing key.
- Across the entire system, only when a justified requirement demands it.

Global ordering can restrict concurrency and reduce throughput. Prefer the narrowest ordering guarantee that preserves business correctness.

### Concurrent Consumers

Multiple workers may process different events concurrently.

The consumer must account for concurrent updates to the same business entity, including stale events and conflicting state transitions.

Depending on the use case, protection may require:

- Optimistic concurrency control.
- Version numbers or sequence checks.
- Conditional state transitions.
- Unique constraints.
- Per-entity serialization.
- Bounded concurrency.

A consumer must not assume that event arrival order is sufficient to establish business validity.

### Stale Events

An event may describe a state that has since changed.

For example, a delayed `CoursePublished` event may arrive after the course has been unpublished.

Consumers must use the event contract and business rules to decide whether to process the occurrence, ignore it, or reconcile against an authoritative capability.

Do not blindly apply old event payloads as though they always represent current state.

## Retries, Dead Letters, and Recovery

Reliable event processing requires a defined response to failure.

### Transient Failures

Examples include temporary network failures, broker unavailability, and rate limiting.

These failures may be retried using bounded exponential backoff and jitter when appropriate.

Retries must be owned by a clearly defined component. Avoid retrying the same operation independently at every layer without an overall attempt and time budget.

### Permanent Failures

Examples include invalid event schemas, unsupported event versions, and violations of an invariant that cannot succeed through repetition.

Blind retries do not fix permanent failures.

The system should classify the failure, record sufficient diagnostic information, and route the event to an appropriate recovery path.

### Unknown Outcomes

A timeout does not prove that an operation failed.

For example, an external system may have completed a request even though the response never reached the consumer.

Before retrying an operation with an uncertain outcome, the consumer must use an appropriate idempotency key, status query, reconciliation process, or other documented mechanism.

### Dead-Letter Handling

A dead-letter mechanism may hold messages that cannot be processed successfully after the defined retry policy.

The design must specify:

- Which failures qualify for dead-letter handling.
- When retry attempts stop.
- Where failed messages and diagnostic metadata are retained.
- Who is responsible for investigating them.
- How a corrected event is replayed or reconciled.
- How duplicate side effects are prevented during recovery.
- Which alerts are raised.

A dead-letter queue is not a complete recovery strategy by itself. Failed messages require visibility, ownership, and a documented operational process.

## Event Replay and Reprocessing

Event replay may be useful for rebuilding projections, recovering from a processing defect, or applying a corrected consumer implementation.

Replay must be designed deliberately.

The system must distinguish between:

- Rebuilding derived state.
- Reprocessing business effects.
- Republishing an event.
- Redriving a failed delivery.
- Replaying historical events into a new consumer.

These operations have different risks.

A replay that is safe for rebuilding a read model may be unsafe for sending emails, issuing refunds, charging a payment method, or triggering another irreversible action.

Before enabling replay, define its scope, authorization, idempotency guarantees, and effect on existing business state.

## Event Schema Evolution

Event contracts must evolve without unnecessarily breaking existing consumers.

### Compatible Changes

Examples that may be compatible, depending on the schema and consumer contract, include:

- Adding an optional field with a documented default.
- Adding metadata that existing consumers safely ignore.
- Expanding an enum only when consumers can tolerate unknown values.

Compatibility must be evaluated against actual consumer behavior and schema-validation rules.

### Breaking Changes

Examples include:

- Removing a field that consumers require.
- Changing a field's meaning.
- Changing a data type incompatibly.
- Renaming a field without a migration strategy.
- Changing the semantics of an existing event while retaining its old identity.

Breaking changes require an explicit versioning and migration strategy.

Possible approaches include versioned schemas, parallel event versions, coordinated consumer migration, or a new event type.

### Compatibility Rules

- Event contracts must be documented.
- Producers must not silently change the meaning of published events.
- Consumers should tolerate compatible additions when the contract requires forward compatibility.
- Unknown versions or unsupported schemas must fail visibly and safely.
- Contract tests should protect important producer-consumer assumptions.
- Deprecated event versions must have an explicit migration and retirement plan.

A schema version identifies the contract version. It does not replace clear ownership or compatibility policies.

## Events and Workflow Coordination

Events can connect modules and support asynchronous workflows, but they do not replace explicit workflow design.

For example:

```text
Enrollment Created
        |
        v
Enrollment Event
        |
        v
Payment Workflow
        |
        +--> Payment Requested
        |
        +--> Payment Completed
        |
        v
Enrollment Confirmed
```

This is an illustrative business flow, not a mandatory implementation sequence.

The architecture must define which capability owns the workflow, how progress is tracked, and how failures are recovered.

An event indicating that a step has started must not be interpreted as proof that the entire workflow has completed.

Likewise, successful publication of an event does not establish successful execution of downstream business actions.

Use an explicitly owned workflow when multiple steps, state transitions, timeouts, retries, or compensation require coordination.

Use independent event reactions when consumers can act autonomously and the resulting consistency model is acceptable.

## Observability and Operational Controls

Reliable delivery must be observable.

The system should provide enough information to determine whether events are being published, delivered, processed, delayed, retried, or abandoned.

Useful metrics may include:

- Number of pending outbox records.
- Age of the oldest pending record.
- Publication success and failure rates.
- Consumer processing success and failure rates.
- Retry counts.
- Dead-letter counts.
- Processing latency.
- Event age at consumption.
- Duplicate detection counts.
- Consumer backlog or lag, when supported by the transport.
- Replay and recovery activity.

Logs and traces should carry relevant event, correlation, causation, and workflow identifiers when available.

Avoid logging secrets, credentials, full sensitive payloads, or unnecessary personal information.

Alerts should focus on actionable conditions, such as sustained backlog growth, excessive event age, repeated publication failure, or a dead-letter count that requires intervention.

Metrics and thresholds must be selected according to the application's actual reliability requirements.

## Security and Data Protection

Events are data-sharing contracts and must follow the application's security requirements.

The design must address:

- Authentication and authorization between publishers, brokers, and consumers where applicable.
- Access controls for event topics, queues, and subscriptions.
- Protection of sensitive payloads in storage and transit.
- Data minimization.
- Secret handling.
- Retention and deletion requirements.
- Safe logging and diagnostics.
- Authorization for replay and manual redrive.
- Validation of incoming event envelopes and payloads.

Consumers must validate incoming messages before applying business effects.

A message's presence on an internal queue does not automatically establish that its payload is trustworthy or authorized for every action.

Events should carry only the information required for their intended purpose. Sensitive data should not be copied into multiple event streams without an explicit reason.

## Testing Requirements

Event-driven behavior must be tested at the contract, persistence, processing, and recovery boundaries.

### Unit Tests

Test:

- Event creation and semantic correctness.
- Payload mapping and schema validation.
- Consumer business behavior.
- Duplicate handling.
- Invalid state transitions.
- Failure classification.
- Retry eligibility.
- Event version handling.

### Integration Tests

Test:

- Atomic persistence of business changes and outbox records.
- Outbox publisher behavior.
- Consumer processing and acknowledgement.
- Inbox deduplication.
- Database constraint enforcement.
- Concurrent processing where relevant.
- Broker or transport integration where applicable.

### Failure-Scenario Tests

Verify important failure windows, including:

- Business transaction rollback.
- Process failure after commit but before publication.
- Publication success followed by a publisher crash.
- Consumer failure before the business transaction commits.
- Consumer commit followed by acknowledgement failure.
- Duplicate delivery.
- Delayed or out-of-order events.
- Retry exhaustion.
- Poison messages.
- Event replay and recovery.

Tests should demonstrate the expected business outcome, not merely that a handler was invoked.

### Contract Tests

Verify that producers publish events conforming to their documented contracts and that consumers handle the supported versions.

Contract tests should protect important assumptions without unnecessarily coupling consumers to private producer implementation details.

## Anti-Patterns

Avoid the following:

### Publishing Before Commit

Publishing an event before the business transaction commits can expose an occurrence that never becomes committed business state.

### Database Commit Followed by Unprotected Publication

Committing business data and then relying on a separate best-effort publication call can lose required events if the process fails between the operations.

Use a transactional outbox when durable publication intent is required.

### Assuming Exactly-Once Delivery

A message being delivered once in normal operation does not prove it cannot be delivered again.

Design consumers for the guarantees the system actually provides.

### Non-Idempotent Consumers

A consumer that repeats financial, notification, or state-changing effects on duplicate delivery can corrupt business outcomes.

### Treating the Outbox as a Broker

An outbox persists publication intent. It does not replace transport delivery, consumer processing, or downstream recovery.

### Treating Publication as Completion

A successful publication does not prove that a consumer processed the event or completed a workflow.

### Publishing Internal Database Models

Exposing persistence structures as event payloads couples consumers to implementation details and makes schema evolution harder.

### Unbounded Retries

Unbounded or overlapping retries can amplify outages and create backlogs.

### Blind Event Replay

Replaying historical events without understanding their side effects can duplicate business actions.

### Universal Event-Driven Communication

Not every module interaction needs an event. A direct capability call may be simpler and more appropriate when the caller requires an immediate result.

### Using Events to Bypass Module Boundaries

Events must not become a mechanism for accessing private data, taking over another module's business rules, or creating implicit dependencies.

### Unobservable Background Processing

Asynchronous work without metrics, diagnostic identifiers, failure visibility, or recovery ownership is difficult to operate reliably.

## Decision Guide

Before introducing an event-driven interaction, answer these questions:

1. What business fact has occurred?
2. Which module owns that fact and its event contract?
3. Who needs to consume the event, and why?
4. Is the consumer allowed to act asynchronously?
5. What happens if the event is lost?
6. Is a transactional outbox required?
7. What delivery guarantee is appropriate?
8. Can the same event be delivered more than once?
9. How will the consumer prevent duplicate business effects?
10. Does event ordering matter, and at what scope?
11. What happens when a consumer fails permanently?
12. How will the system recover from an unknown outcome?
13. How will event schemas evolve?
14. What information is safe and necessary to expose?
15. How will operators detect and recover from delivery failures?
16. Is event-driven communication genuinely better than a direct capability call?
17. Can the required guarantee be achieved without introducing unnecessary infrastructure?

If these questions cannot be answered, the event contract or processing design is not yet sufficiently defined.

## Architectural Rules

The following rules govern eventing in the MERN Enterprise Starter:

1. The owning module defines the business meaning of its events.
2. Integration events are explicit contracts, not serialized internal implementation objects.
3. Event-driven communication must preserve module boundaries and data ownership.
4. Events represent facts; commands represent requests to perform actions.
5. Required publication intent must be persisted atomically with the corresponding business change.
6. The transactional outbox is a publication-reliability mechanism, not a message broker.
7. Delivery guarantees must be explicit and must not imply end-to-end exactly-once processing without a demonstrated mechanism.
8. Consumers must handle duplicates whenever duplicate delivery is possible.
9. Consumer deduplication and business effects must share an atomic boundary when required and technically possible.
10. Event ordering and concurrency guarantees must be explicit where business correctness depends on them.
11. Retries must be bounded, observable, and owned by a defined component.
12. Unknown outcomes must not be treated as confirmed failures without an appropriate reconciliation strategy.
13. Event schemas must evolve through documented compatibility and migration policies.
14. Replay and redrive must account for duplicate side effects and authorization.
15. Event publication and consumption failures must have explicit observability and recovery ownership.
16. Event-driven communication must be introduced only when its benefits justify its operational complexity.

## Relationship to Other Architecture Documents

This document complements the following project documents:

- `ARCHITECTURE.md` — Defines the overall architecture, module boundaries, ownership rules, and architectural invariants.
- `docs/architecture/cross-module-workflows.md` — Defines workflow ownership, coordination models, transaction boundaries, and recovery.
- `docs/architecture/execution-context.md` — Defines execution-context propagation across relevant execution boundaries.
- `docs/architecture/failure-handling-and-idempotency.md` — Defines broader failure classification, retry behavior, idempotency, and recovery rules.
- `docs/architecture/module-interaction-performance.md` — Defines performance and scalability considerations for communication between modules.
- `docs/architecture/observability-and-resilience.md` — Defines logging, metrics, tracing, and operational resilience.

Verify the filenames against the actual repository before committing cross-document links.

## Closing Principle

Reliable event-driven architecture is not achieved by introducing a message broker or adding an event handler.

It is achieved by making event ownership explicit, preserving business consistency, defining delivery guarantees, handling duplicate processing, and providing observable recovery paths.

**Persist what must not be lost, design for what may be delivered more than once, and make every failure recoverable or explicitly actionable.**
