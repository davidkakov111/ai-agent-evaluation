import { RateLimitedDomainError } from "@/server/errors";

export type AuthRateLimitAction = "register" | "login";

export interface AuthRateLimitPayload {
  action: AuthRateLimitAction;
  identifier: string;
}

export interface AuthRateLimiter {
  consume(payload: AuthRateLimitPayload): Promise<void>;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

function resolvePositiveInteger(value: string | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

class InMemoryAuthRateLimiter implements AuthRateLimiter {
  private readonly buckets = new Map<string, RateLimitBucket>();
  private mutationCount = 0;

  public constructor(
    private readonly windowMs: number,
    private readonly loginMaxAttempts: number,
    private readonly registerMaxAttempts: number,
  ) {}

  private getLimitForAction(action: AuthRateLimitAction): number {
    return action === "login" ? this.loginMaxAttempts : this.registerMaxAttempts;
  }

  private maybePrune(now: number): void {
    this.mutationCount += 1;
    if (this.mutationCount % 100 !== 0) {
      return;
    }

    for (const [key, value] of this.buckets.entries()) {
      if (value.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }

  public consume(payload: AuthRateLimitPayload): Promise<void> {
    const now = Date.now();
    const key = `${payload.action}:${payload.identifier.trim().toLowerCase()}`;
    const limit = this.getLimitForAction(payload.action);
    const existing = this.buckets.get(key);

    if (existing === undefined || existing.resetAt <= now) {
      this.buckets.set(key, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      this.maybePrune(now);
      return Promise.resolve();
    }

    if (existing.count >= limit) {
      throw new RateLimitedDomainError("Too many authentication attempts. Please try again later.");
    }

    existing.count += 1;
    this.buckets.set(key, existing);
    this.maybePrune(now);

    return Promise.resolve();
  }
}

const authRateWindowMs = resolvePositiveInteger(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60_000);
const authRateLoginMaxAttempts = resolvePositiveInteger(process.env.AUTH_LOGIN_MAX_ATTEMPTS, 10);
const authRateRegisterMaxAttempts = resolvePositiveInteger(process.env.AUTH_REGISTER_MAX_ATTEMPTS, 5);

let authRateLimiter: AuthRateLimiter = new InMemoryAuthRateLimiter(
  authRateWindowMs,
  authRateLoginMaxAttempts,
  authRateRegisterMaxAttempts,
);

export function getAuthRateLimiter(): AuthRateLimiter {
  return authRateLimiter;
}

export function setAuthRateLimiter(rateLimiter: AuthRateLimiter): void {
  authRateLimiter = rateLimiter;
}
