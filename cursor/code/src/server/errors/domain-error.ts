export type DomainErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "VALIDATION"
  | "PRECONDITION_FAILED"
  | "INTERNAL";

type DomainErrorDetailValue = string | number | boolean | null;
export type DomainErrorDetails = Readonly<Record<string, DomainErrorDetailValue>>;

interface DomainErrorOptions {
  cause?: Error;
  details?: DomainErrorDetails;
}

export class DomainError extends Error {
  public readonly code: DomainErrorCode;
  public readonly details?: DomainErrorDetails;

  public constructor(code: DomainErrorCode, message: string, options?: DomainErrorOptions) {
    super(message, options);
    this.code = code;
    this.name = "DomainError";

    if (options?.details !== undefined) {
      this.details = options.details;
    }
  }
}

export class UnauthorizedDomainError extends DomainError {
  public constructor(message = "Authentication is required.", options?: DomainErrorOptions) {
    super("UNAUTHORIZED", message, options);
    this.name = "UnauthorizedDomainError";
  }
}

export class ForbiddenDomainError extends DomainError {
  public constructor(
    message = "You do not have permission for this action.",
    options?: DomainErrorOptions,
  ) {
    super("FORBIDDEN", message, options);
    this.name = "ForbiddenDomainError";
  }
}

export class NotFoundDomainError extends DomainError {
  public constructor(message = "Resource not found.", options?: DomainErrorOptions) {
    super("NOT_FOUND", message, options);
    this.name = "NotFoundDomainError";
  }
}

export class ConflictDomainError extends DomainError {
  public constructor(message = "Conflict detected.", options?: DomainErrorOptions) {
    super("CONFLICT", message, options);
    this.name = "ConflictDomainError";
  }
}

export class RateLimitedDomainError extends DomainError {
  public constructor(
    message = "Too many requests. Please try again later.",
    options?: DomainErrorOptions,
  ) {
    super("RATE_LIMITED", message, options);
    this.name = "RateLimitedDomainError";
  }
}

export class ValidationDomainError extends DomainError {
  public constructor(message = "Input validation failed.", options?: DomainErrorOptions) {
    super("VALIDATION", message, options);
    this.name = "ValidationDomainError";
  }
}

export class PreconditionFailedDomainError extends DomainError {
  public constructor(
    message = "A required precondition was not met.",
    options?: DomainErrorOptions,
  ) {
    super("PRECONDITION_FAILED", message, options);
    this.name = "PreconditionFailedDomainError";
  }
}

export class InternalDomainError extends DomainError {
  public constructor(message = "Internal server error.", options?: DomainErrorOptions) {
    super("INTERNAL", message, options);
    this.name = "InternalDomainError";
  }
}
