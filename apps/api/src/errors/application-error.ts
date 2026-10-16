export interface ApplicationFieldError {
  readonly field: string;
  readonly code: string;
}

/** Stable application-level failure, independent of any transport or framework. */
export class ApplicationError extends Error {
  readonly code: string;
  readonly errors?: readonly ApplicationFieldError[];

  constructor(
    code: string,
    message: string,
    errors?: readonly ApplicationFieldError[]
  ) {
    super(message);
    this.name = "ApplicationError";
    this.code = code;
    this.errors = errors ? Object.freeze(errors.map((item) => Object.freeze({ ...item }))) : undefined;
  }
}

/** Represents a syntactically valid input that violates an application rule. */
export class ValidationFailedError extends ApplicationError {
  constructor(errors: readonly ApplicationFieldError[], message = "Request validation failed.") {
    super("VALIDATION_FAILED", message, errors);
    this.name = "ValidationFailedError";
  }
}
