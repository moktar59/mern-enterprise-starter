# Cross-Module Workflows

## Purpose

This document defines how business workflows coordinate capabilities across multiple modules while preserving module ownership, transaction boundaries, and architectural independence.

It establishes the responsibilities, coordination models, execution semantics, failure handling, recovery strategies, and performance considerations for cross-module workflows.

The objective is to support reliable business processes without introducing unnecessary coupling, infrastructure, or distributed-system complexity.

This document complements `ARCHITECTURE.md` and the Module Architecture ADR. It defines detailed workflow rules without replacing the architectural principles and invariants established by those documents.

---

## Core Concepts

Module ownership, transaction ownership, and workflow ownership are separate architectural concerns.

### Module

A module owns a cohesive business capability, including its business rules, data, persistence, and invariants.

A module exposes its capabilities through explicit public contracts. Other modules must not access its private implementation or persistence structures directly.

### Transaction

A transaction protects the atomic consistency boundary required by an operation.

A transaction normally remains within the ownership boundary of the module responsible for the data and invariants it protects.

Cross-module atomic transactions are exceptional and require explicit architectural justification.

### Workflow

A workflow coordinates a business process involving one or more capabilities.

It defines the required sequence of operations, coordination rules, progress, failure handling, recovery, and compensation where applicable.

A workflow does not acquire ownership of the business rules or data belonging to the modules it coordinates.

### Ownership Model

| Concern | Primary responsibility |
|---|---|
| Business capability | Owning module |
| Business rules and invariants | Owning module |
| Business data and persistence | Owning module |
| Atomic consistency | Transaction boundary |
| Process sequencing | Workflow |
| Cross-capability coordination | Workflow |
| Recovery and compensation coordination | Workflow |
| Technical execution mechanisms | Infrastructure |
| External protocol translation | Adapter |

These responsibilities may be implemented in different physical components, but their logical ownership must remain explicit.

---

## Workflow Boundaries

A cross-module workflow coordinates multiple business capabilities through their public capability contracts or intentional asynchronous contracts.

A workflow may own:

- Operation sequencing.
- Coordination between capabilities.
- Decisions about whether the next step may proceed.
- Workflow progress and execution state.
- Recovery and retry coordination.
- Compensation coordination.
- Workflow-level observability.

A workflow must not own:

- Another module's business rules.
- Another module's business data.
- Another module's persistence implementation.
- Another module's internal services or repositories.
- Another module's transaction state.
- Private implementation details of the capabilities it coordinates.

The workflow may decide *when* to invoke a capability, but the owning module decides *whether and how* that capability may execute according to its business rules.

### Example: Course Enrollment

Consider a workflow that coordinates student enrollment:

1. Validate the student's eligibility.
2. Check course availability.
3. Create a pending enrollment.
4. Request payment.
5. Confirm the enrollment after successful payment.
6. Notify the student.

The workflow coordinates the process, but each module retains its own responsibilities.

| Module | Responsibility |
|---|---|
| Student | Student eligibility and student-related rules |
| Course | Course availability and capacity |
| Enrollment | Enrollment records and enrollment invariants |
| Payment | Payment operations and payment state |
| Notification | Notification delivery |

The workflow must not query the payment database directly, modify enrollment records through private repositories, or reproduce another module's business rules.

Each operation must use the appropriate public capability or explicitly designed asynchronous contract.

The exact workflow steps and business policies depend on the application's requirements.

---

## Workflow Coordination Models

Cross-module workflows can use orchestration or choreography.

These are coordination models, not mandatory infrastructure choices.

### Orchestration

In orchestration, a workflow coordinator explicitly controls the sequence of operations.

For example:

`Enrollment Workflow → Course Capability → Enrollment Capability → Payment Capability`

The workflow evaluates outcomes and determines which operation should execute next.

The orchestrator owns process coordination, not the business rules of the participating modules.

**Advantages**

- Explicit process flow.
- Easier understanding of the overall business process.
- Centralized workflow progress and recovery decisions.
- Clearer handling of conditional branches and compensation.
- Easier workflow-level observability and troubleshooting.

**Trade-offs**

- The workflow coordinator must remain focused on coordination.
- Complex workflows can accumulate excessive responsibilities.
- The coordinator introduces an explicit dependency on the capabilities it invokes.
- Durable orchestration requires state persistence and recovery mechanisms when execution spans process restarts.

An orchestrator must not become a central business module that absorbs the responsibilities of other modules.

### Choreography

In choreography, modules react to events or other intentional asynchronous contracts without a central coordinator controlling every step.

For example:

`Enrollment Created → Payment Requested → Payment Completed → Enrollment Activated`

Each participating module responds according to its own responsibilities.

**Advantages**

- Producers do not need to know every downstream consumer.
- Independent reactions can evolve separately.
- Multiple consumers can process the same event for different purposes.
- Naturally event-driven processes can avoid unnecessary synchronous dependencies.

**Trade-offs**

- The overall workflow becomes distributed across multiple handlers.
- Process sequencing may be harder to discover.
- Failure recovery and business progress may be more difficult to observe.
- Event contracts, delivery guarantees, duplicate processing, and eventual consistency require explicit handling.
- Changes to event semantics can affect multiple consumers.

Choreography must not become an excuse for implicit workflow behavior or undocumented dependencies.

### Choosing a Coordination Model

Prefer orchestration when the process has explicit sequencing, complex conditions, significant recovery requirements, or a need for clear workflow-level visibility.

Consider choreography when consumers are genuinely independent, event-driven reactions are natural, and the process does not require centralized coordination.

A workflow may combine both models when justified.

Neither orchestration nor choreography is universally superior.

---

## Workflow Execution Models

A workflow may execute synchronously or asynchronously.

### Synchronous Workflows

A synchronous workflow completes its required operations within the initiating execution.

Use this model when the caller needs the result before it can correctly complete the request and the operation can reasonably finish within the request's time budget.

Characteristics include:

- Immediate result or failure.
- Direct capability invocation where appropriate.
- Request-scoped execution and resource usage.
- Explicit timeouts for blocking dependencies.
- A clear response contract for partial or unsuccessful outcomes.

Synchronous execution should not be used for lengthy work merely because it is easier to implement.

### Asynchronous Workflows

An asynchronous workflow continues independently of the initiating request.

Use this model when work can happen later, requires lengthy processing, benefits from buffering, or must continue beyond the initiating request's lifetime.

Characteristics include:

- Explicit acceptance and completion semantics.
- Durable state when progress must survive process restarts.
- Defined delivery, retry, and failure policies.
- Correlation and causation information across execution boundaries.
- Recovery and reconciliation mechanisms where required.

An accepted workflow is not necessarily a completed workflow.

The initiating API must communicate the distinction clearly.

For example, a request may return an accepted status and a workflow identifier while enrollment and payment processing continue asynchronously.

### Hybrid Workflows

A workflow may combine synchronous and asynchronous operations.

For example, a request may synchronously validate eligibility and create a pending enrollment, then asynchronously initiate payment processing and notify the student.

Each boundary should reflect actual consistency and latency requirements.

Asynchronous execution is not automatically faster, more reliable, or simpler than synchronous execution.

---

## Workflow State and Lifecycle

Workflows that require durable progress, recovery, or coordination across independent executions must have explicit state semantics.

Short-lived synchronous coordination does not automatically require a persisted workflow record.

### Workflow States

A long-running workflow may use states such as:

| State | Meaning |
|---|---|
| `PENDING` | The workflow has been accepted but has not started. |
| `RUNNING` | The workflow is executing an operation. |
| `WAITING` | The workflow is waiting for an external result or asynchronous event. |
| `RETRYING` | A retryable operation is scheduled or being retried. |
| `COMPENSATING` | Compensating business actions are being executed. |
| `FAILED` | The workflow cannot continue automatically and requires recovery or intervention. |
| `COMPLETED` | The required business process has completed successfully. |
| `CANCELLED` | The workflow has been cancelled according to its cancellation policy. |

These states are illustrative, not a mandatory universal enumeration. Implementations should use only the states necessary to represent their actual lifecycle.

State transitions must be explicit and validated.

For example:

- `PENDING → RUNNING`
- `RUNNING → WAITING`
- `WAITING → RUNNING`
- `RUNNING → RETRYING`
- `RUNNING → COMPENSATING`
- `COMPENSATING → FAILED`
- `RUNNING → COMPLETED`

A transition must not be allowed merely because a handler happens to execute. It must be valid under the workflow's defined state and concurrency rules.

### Durable Workflow State

When a workflow must survive process restarts, delayed responses, or independent asynchronous executions, its recovery-relevant state must be persisted.

Depending on the workflow, this may include:

- Workflow identifier.
- Workflow type and version.
- Current state.
- Business correlation identifiers.
- Current step or progress marker.
- Recorded outcomes of important operations.
- Retry count and retry scheduling information.
- Compensation progress.
- Creation and update timestamps.
- Relevant failure classification.
- Correlation and causation identifiers.

Persisted workflow state should contain only information needed for coordination, recovery, and auditability.

It must not become a duplicate database for the business entities owned by participating modules.

### State Ownership

Workflow state belongs to the component responsible for coordinating the workflow.

A module may own its business state independently of the workflow state.

For example, the Enrollment module owns the enrollment status, while an enrollment workflow may own its coordination progress.

The two states are related but are not interchangeable.

---

## Workflow and Transaction Boundaries

Workflow boundaries and transaction boundaries are independent.

A workflow may span multiple transactions. Each transaction protects the atomic consistency requirements of the operation it executes.

For example:

1. Create a pending enrollment in a transaction.
2. Commit the enrollment.
3. Initiate payment in a separate operation.
4. Record or receive the payment outcome.
5. Activate the enrollment in another transaction.

The workflow coordinates these operations without requiring one transaction to remain open for the entire business process.

### Transaction Rules

- Keep transactions as small as practical while preserving the invariants they protect.
- Do not keep database transactions open while waiting for external services, human decisions, or delayed messages.
- Do not expose database sessions or transaction objects through public module contracts.
- Do not assume that a shared physical database requires all participating modules to share one transaction.
- Treat cross-module atomic transactions as exceptions requiring explicit architectural justification.
- Repeated requirements for cross-module atomicity should trigger a review of module boundaries, data ownership, and consistency requirements.

A transaction can atomically persist local business state and a corresponding outbox record when reliable event publication is required.

That mechanism does not make the entire workflow atomic.

---

## Consistency and Intermediate States

Long-running workflows frequently involve intermediate business states.

For example, an enrollment may be `PENDING_PAYMENT` while the payment outcome is unknown.

These states must have explicit meanings and permitted transitions.

The architecture does not require every workflow to provide immediate, globally consistent results across all modules.

Consistency requirements should be defined by business invariants and the consequences of temporary inconsistency.

### Strong Consistency

Use strong consistency when an operation must preserve an invariant immediately within its defined consistency boundary.

Protect that invariant through an appropriate transaction or coordination mechanism.

### Eventual Consistency

Eventual consistency may be appropriate when participating modules can temporarily observe different states and the business process can safely tolerate the delay.

The workflow must define how progress occurs, how failures are handled, and how unresolved states are detected.

### Compensation-Based Consistency

A workflow may use compensating business actions when a previously completed operation must be counteracted after a later step fails.

Compensation does not erase the historical fact that the original operation occurred.

The chosen consistency model must be explicit. Eventual consistency and compensation must not be used to weaken a business invariant without deliberate justification.

---

## Failure Handling and Recovery

A workflow must define what happens when a step fails or its outcome is uncertain.

Failure handling must reflect the semantics of the operation rather than treating every error as an automatic retry.

### Failure Categories

**Transient failure**

A temporary condition may allow a later retry.

Examples include temporary network failures or temporary service unavailability.

**Permanent failure**

The operation cannot succeed without changing the request or business conditions.

Examples include a rejected business operation or invalid input.

**Unknown outcome**

The operation may have succeeded even though the caller did not receive confirmation.

For example, a payment provider may process a payment but the response may time out.

An unknown outcome must not automatically be treated as a failed operation.

The workflow should reconcile the outcome or retry using an appropriate idempotency mechanism.

### Recovery Strategies

Depending on the operation, recovery may involve:

- Retrying a safe operation.
- Resuming from a persisted workflow state.
- Reconciling an unknown external outcome.
- Executing a compensating action.
- Moving the workflow to a failed state for investigation.
- Requiring authorized manual intervention.

Recovery decisions must preserve business invariants and must not silently discard unresolved business outcomes.

### Retry Ownership

Each retryable operation must have a clear retry owner.

Retries must be bounded by explicit attempt or time budgets, with appropriate backoff and jitter when needed.

Multiple layers must not independently retry the same operation without a coordinated policy, as this can amplify load and cause retry storms.

A workflow retry must not blindly repeat an operation whose outcome is unknown.

### Failure Visibility

A workflow that cannot progress automatically must expose enough information to determine:

- Which operation failed.
- Whether its outcome is known.
- Whether a retry is permitted.
- Whether reconciliation is required.
- Whether compensation has started or completed.
- Whether intervention is necessary.

Sensitive data and implementation details must not be exposed in public errors or logs.

Detailed failure classification, retry policies, idempotency, and replay semantics are defined in the corresponding reliability architecture documentation.

---

## Compensation

Compensation is a business action that counteracts the effect of a previous operation when a workflow cannot continue as planned.

It is not a database rollback.

For example, if a reservation has been created and a subsequent payment operation cannot complete, the workflow might cancel the reservation according to the applicable business rules.

The reservation module remains responsible for deciding whether and how cancellation is permitted.

The workflow coordinates the compensating operation.

### Compensation Rules

- Compensation must use the owning module's public capability.
- Compensation must respect the owning module's current business rules.
- Compensation may fail and therefore needs its own recovery policy.
- Compensation must be safe under duplicate execution where duplicate attempts are possible.
- Compensation must not assume that an external effect can be perfectly reversed.
- Compensation outcomes must be recorded when needed for recovery and auditability.

Some operations cannot be fully compensated.

For example, a notification that has already been delivered cannot be recalled. The workflow may instead issue a correction or notification that explains the updated outcome.

Compensation should be defined according to actual business semantics rather than implemented as a universal rollback mechanism.

---

## Idempotency and Duplicate Execution

A workflow may execute the same step more than once because of retries, duplicate messages, process restarts, or uncertain outcomes.

Operations that may be repeated must provide idempotent business effects wherever duplicate execution is possible.

Depending on the operation, this may involve:

- A stable business identifier.
- An idempotency key with a recorded outcome.
- A unique constraint enforcing a business invariant.
- A consumer-side processing record.
- An inherently idempotent operation.

The workflow must distinguish between repeating a coordination decision and repeating a business operation.

For example, resuming a workflow must not create a second enrollment or charge a student twice.

A workflow state record alone does not guarantee idempotency. Concurrent executions and uncertain external outcomes must also be considered.

Event replay and command replay are different operations. Replaying an event must not automatically execute the original business command again.

Detailed rules belong in `failure-handling-and-idempotency.md`.

---

## Events and Asynchronous Coordination

Workflows may use asynchronous contracts when independent processing, temporal decoupling, buffering, or multiple consumers justify the additional complexity.

An event describes something that has happened. A command requests that an operation be performed.

Events must be explicit contracts with defined ownership, payload semantics, compatibility expectations, and delivery assumptions.

### Reliable Event Publication

When a business state change requires reliable event publication, the system may persist the business change and its publication intent atomically using an outbox.

The outbox persists publication intent; a dispatcher and transport deliver the event.

The workflow must not assume that writing an outbox record means every consumer has completed its work.

Consumers must tolerate duplicate delivery where at-least-once delivery is used.

Ordering guarantees should be introduced only when required by business semantics.

### Asynchronous Workflow Rules

- Define the event or command that advances each asynchronous step.
- Establish correlation and causation information across execution boundaries.
- Define what happens when a message is delayed, duplicated, or permanently fails.
- Ensure workflow state transitions remain valid under concurrent processing.
- Provide recovery and reconciliation paths for unresolved outcomes.
- Avoid using events for interactions that require an immediate result when a direct capability call is simpler.

Reliable event delivery details belong in `eventing-and-reliable-delivery.md`.

---

## Concurrency and Workflow Safety

A workflow may receive duplicate triggers or have multiple workers attempt to process the same state.

Workflow implementations must protect state transitions and business effects against concurrent execution.

Depending on the persistence and execution model, appropriate mechanisms may include:

- Conditional state transitions.
- Optimistic concurrency checks.
- Unique constraints.
- Leases or ownership records.
- Idempotency keys.
- Bounded worker concurrency.

These mechanisms must be chosen according to actual concurrency requirements.

A workflow must not rely on an in-memory lock as its only correctness guarantee when execution can occur across multiple processes or restart boundaries.

Concurrency control must preserve the ownership of business data and the invariants enforced by the owning module.

---

## Performance and Scalability

Workflow performance must be evaluated as a workload rather than by the number of steps alone.

Relevant characteristics include:

- Workflow execution frequency.
- Number of participating capabilities.
- Sequential dependency depth.
- Degree of safe parallelism.
- Payload size.
- External dependency latency.
- Transaction duration.
- Concurrent workflow count.
- Retry amplification.
- Queue depth and oldest pending work age.
- Shared database, cache, and worker capacity.

### Performance Principles

**Avoid unnecessary interactions.**

Do not invoke capabilities or start asynchronous work that does not contribute to the required business outcome.

**Prefer bulk operations when appropriate.**

If a workflow needs the same information for many entities, a public bulk capability may be more efficient than repeated individual calls.

**Parallelize only independent operations.**

Operations may execute concurrently when their ordering and business invariants permit it. Concurrency must remain bounded by available resources and downstream capacity.

**Keep the critical path explicit.**

Work required before the business operation can correctly complete should remain distinguishable from non-critical work that can happen later.

**Apply timeouts and cancellation deliberately.**

Blocking dependencies should have bounded waiting policies. A timeout does not prove that the underlying operation failed.

**Use backpressure for asynchronous pipelines.**

When producers consistently generate work faster than consumers can process it, the system needs a strategy to control or absorb the imbalance.

**Avoid uncontrolled retries.**

Retries can increase load during dependency failure. Retry policies must account for total workload and recovery capacity.

**Use specialized mechanisms only when justified.**

Caching, projections, asynchronous processing, and workflow infrastructure should address identified requirements rather than being mandatory components of every workflow.

The architecture must preserve module ownership while optimizing performance.

---

## Observability and Operational Recovery

Workflows must be observable at a level appropriate to their execution model and business impact.

For long-running workflows, operational visibility should support understanding current progress and determining why a workflow is waiting, failing, retrying, compensating, or requiring intervention.

Where applicable, record or expose:

- Workflow identifier and type.
- Current state and relevant state transitions.
- Current step or progress marker.
- Correlation and causation identifiers.
- Operation duration and failure classification.
- Retry and compensation outcomes.
- Time spent waiting for external dependencies.
- Workflow age and last progress timestamp.

Observability should support investigation and recovery without exposing secrets, credentials, or unnecessary personal data.

Avoid high-cardinality telemetry and excessive logging that would make the system more expensive or less observable at scale.

Operational ownership should be clear: the team responsible for a workflow must be able to understand its progress, failure modes, and recovery requirements.

---

## Security and Authorization

Workflow execution must preserve security boundaries across all participating capabilities.

A workflow coordinator must not assume that a prior authorization decision grants unrestricted access to every subsequent operation.

Each capability must enforce the authorization and business constraints appropriate to its contract and execution context.

For asynchronous workflows:

- Establish a trusted execution context for the new execution boundary.
- Propagate only the context information required and permitted by the contract.
- Do not treat message payload fields as trusted identity or authorization claims.
- Define how tenant and actor information are validated and preserved where relevant.
- Apply appropriate access controls to workflow state, recovery operations, and manual intervention tools.
- Avoid storing credentials or unnecessary sensitive information in workflow records.

Execution context propagation must follow the rules defined in `execution-context.md` and the Execution Context ADR.

Workflow coordination does not replace authentication, authorization, or module-level business validation.

---

## Testing Requirements

Workflow tests should verify business process semantics, module boundaries, transaction behavior, failure handling, and recovery.

### Coordination Tests

Verify that:

- Capabilities are invoked in the required order.
- Conditional branches select the correct next operation.
- Independent operations execute concurrently only when permitted.
- Invalid state transitions are rejected.
- The workflow does not access private module implementation details.

### Failure and Recovery Tests

Verify that:

- Transient failures follow the retry policy.
- Permanent failures do not cause endless retries.
- Unknown outcomes trigger reconciliation or another safe recovery strategy.
- Compensation occurs only when the defined business conditions require it.
- Compensation failure remains visible and recoverable.
- Workflow resumption does not repeat completed business effects incorrectly.

### Asynchronous Tests

Where asynchronous contracts are used, verify that:

- Duplicate delivery does not produce duplicate business effects.
- Delayed and out-of-order messages are handled according to the contract.
- Workflow state remains valid under concurrent processing.
- Restarting execution does not lose required recovery information.
- Event contract compatibility is maintained.

### Boundary Tests

Verify that:

- Each module retains ownership of its rules and data.
- Cross-module access uses public capabilities or intentional asynchronous contracts.
- Workflow state does not duplicate authoritative business data.
- Transaction infrastructure does not leak through module contracts.

Tests should target the actual failure modes and guarantees required by the workflow rather than attempting to simulate every theoretical failure.

---

## Anti-Patterns

The following patterns violate the intent of this architecture.

### God Orchestrator

A workflow coordinator implements or duplicates business rules belonging to multiple modules.

**Correction:** Keep coordination in the workflow and business decisions in the owning capabilities.

### Cross-Module Repository Access

A workflow directly queries or modifies another module's persistence structures.

**Correction:** Invoke the owning module's public capability or use an explicitly designed asynchronous contract.

### One Giant Transaction

A long-running workflow holds a database transaction open while waiting for external operations or multiple independent steps.

**Correction:** Use appropriately scoped transactions and explicit workflow progress.

### Universal Event-Driven Communication

Every interaction is converted into an event even when the caller needs an immediate result.

**Correction:** Use direct capability calls when they are the simplest correct mechanism.

### Blind Retry

Every failure causes the workflow to repeat the last operation without considering whether it is retryable or whether the outcome is known.

**Correction:** Classify failures, bound retries, and reconcile uncertain outcomes.

### Compensation as Rollback

A compensating operation is assumed to erase the effects and history of an earlier action.

**Correction:** Model compensation as a separate business operation with its own failure and recovery semantics.

### Implicit Workflow State

Progress is inferred from scattered database records or logs without a clear definition of workflow state.

**Correction:** Define explicit state and recovery semantics when the process requires durable coordination.

### Premature Workflow Infrastructure

A workflow engine, message broker, or distributed orchestration platform is introduced before the requirements justify it.

**Correction:** Begin with the simplest implementation that satisfies the required correctness, recovery, and operational guarantees.

### Distributed Monolith Through Workflow Coupling

Modules are physically separated but remain tightly coupled through synchronous dependency chains and coordinated deployment assumptions.

**Correction:** Preserve explicit contracts, evaluate dependency depth, and choose consistency and communication models deliberately.

---

## Decision Guide

When designing a cross-module workflow, answer these questions:

1. Which business outcome does the workflow coordinate?
2. Which modules own the capabilities and data involved?
3. What business invariants must remain protected?
4. Which operations require an immediate result?
5. Which operations can execute asynchronously?
6. Does the process need durable state across requests, workers, or restarts?
7. What intermediate business states are valid?
8. What happens when an operation fails or its outcome is unknown?
9. Which operations are safe to retry?
10. Is compensation required, and what happens if compensation fails?
11. How are duplicate triggers and concurrent execution handled?
12. How will the workflow be observed and recovered operationally?
13. What performance or resource limits must be enforced?
14. Is orchestration, choreography, or a combination justified?
15. Can the requirements be satisfied without introducing additional infrastructure?

The answers should determine the workflow design. The architecture should not impose a universal execution engine or coordination mechanism.

---

## Architectural Rules

The following rules summarize the workflow architecture:

1. Modules own their business capabilities, rules, data, and invariants.
2. Transactions protect the atomic consistency boundaries required by operations.
3. Workflows coordinate business processes across capabilities and transaction boundaries.
4. Cross-module interaction must preserve public module boundaries.
5. Workflow coordination must not duplicate or absorb another module's business rules.
6. Long-running workflows require explicit durable state and recovery semantics when their progress must survive independent executions or restarts.
7. Failure handling must distinguish retryable failures, permanent failures, and unknown outcomes.
8. Retried or redelivered operations must provide idempotent business effects wherever duplicate execution is possible.
9. Compensation is a business action, not a database rollback.
10. Asynchronous communication requires explicit contracts and delivery assumptions.
11. Workflow performance and concurrency must be managed according to actual workload and resource capacity.
12. Observability and recovery requirements must be defined according to business and operational impact.
13. Workflow infrastructure must be introduced only when justified by demonstrated requirements.

---

## Relationship to Other Architecture Documents

This document complements the following architecture references:

- `ARCHITECTURE.md` — Overall runtime architecture, principles, and invariants.
- `docs/architecture/decisions/ADR-0007-module-boundaries-and-architecture.md` — Module ownership, boundaries, communication, and transaction decisions; verify the actual filename and ADR identifier in the repository.
- `docs/architecture/execution-context.md` — Execution identity, context propagation, and execution-boundary semantics.
- `docs/architecture/eventing-and-reliable-delivery.md` — Event contracts, outbox, delivery guarantees, and asynchronous event processing.
- `docs/architecture/failure-handling-and-idempotency.md` — Failure classification, retries, idempotency, reconciliation, and replay safety.
- `docs/architecture/module-interaction-performance.md` — Cross-module interaction performance and scalability.
- `docs/architecture/observability-and-resilience.md` — Observability, controlled failure, resilience, and operational recovery.

The references describe complementary concerns. They should remain consistent without duplicating the entire contents of one document into another.

---

## Closing Principle

A cross-module workflow coordinates a business process without taking ownership of the capabilities it coordinates.

Modules own business rules and data. Transactions protect atomic consistency. Workflows coordinate progress, recovery, and compensation. Infrastructure provides the technical mechanisms required to execute these responsibilities.

The goal is not to eliminate complexity, but to place each responsibility at the correct architectural boundary and introduce additional mechanisms only when the application's requirements justify them.
