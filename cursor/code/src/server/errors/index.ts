export {
  ConflictDomainError,
  DomainError,
  type DomainErrorCode,
  type DomainErrorDetails,
  ForbiddenDomainError,
  InternalDomainError,
  NotFoundDomainError,
  PreconditionFailedDomainError,
  RateLimitedDomainError,
  UnauthorizedDomainError,
  ValidationDomainError,
} from "./domain-error";
export { mapErrorToTRPC } from "./map-error-to-trpc";
