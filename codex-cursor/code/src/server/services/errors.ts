export class DomainError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}

export class ValidationError extends DomainError {
  public readonly details: unknown;

  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.details = details;
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, "CONFLICT");
    this.name = "ConflictError";
  }
}

export class ForbiddenError extends DomainError {
  constructor(message: string) {
    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class InvalidTransitionError extends DomainError {
  constructor(message: string) {
    super(message, "INVALID_TRANSITION");
    this.name = "InvalidTransitionError";
  }
}
