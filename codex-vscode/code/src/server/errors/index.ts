export {
  ConflictDomainError,
  DomainError,
  ForbiddenDomainError,
  InternalDomainError,
  NotFoundDomainError,
  PreconditionFailedDomainError,
  RateLimitedDomainError,
  UnauthorizedDomainError,
  ValidationDomainError,
  type DomainErrorCode,
  type DomainErrorDetails,
} from "./domain-error";
export { mapErrorToTRPC } from "./map-error-to-trpc";
