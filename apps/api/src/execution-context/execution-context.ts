export type ExecutionId = string;
export type RequestId = string;
export type CorrelationId = string;
export type Locale = string;

export type ExecutionSource = "HTTP" | "QUEUE" | "EVENT" | "SCHEDULE" | "CLI" | "INTERNAL";

export type PrincipalType = "human" | "service" | "system" | "anonymous";

export interface Principal {
  readonly principalId: string;
  readonly principalType: PrincipalType;
}

export interface TenantContext {
  readonly id: string;
}

/** Immutable metadata describing one independent unit of execution. */
export interface ExecutionContext {
  readonly executionId: ExecutionId;
  readonly correlationId?: CorrelationId;
  readonly requestId?: RequestId;
  readonly source: ExecutionSource;
  /** ISO-8601 timestamp established by the factory. */
  readonly startedAt: string;
  readonly principal?: Principal;
  readonly tenant?: TenantContext;
  readonly locale?: Locale;
}

/** Boundary-provided metadata; execution identity and start time are generated internally. */
export interface ExecutionContextCreationInput {
  readonly source: ExecutionSource;
  readonly correlationId?: CorrelationId;
  readonly requestId?: RequestId;
}

export class ExecutionContextEnrichmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionContextEnrichmentError";
  }
}

export class ExecutionContextConflictError extends ExecutionContextEnrichmentError {
  constructor(message: string) {
    super(message);
    this.name = "ExecutionContextConflictError";
  }
}

export class ExecutionContextRequiredError extends Error {
  constructor() {
    super("An execution context is required but no context is active.");
    this.name = "ExecutionContextRequiredError";
  }
}
