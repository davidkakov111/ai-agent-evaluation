type LogLevel = "debug" | "info" | "warn" | "error";

type LogMeta = Readonly<Record<string, string | number | boolean | null | undefined>>;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  scope?: string;
  meta?: LogMeta;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

function toSerializableError(error: unknown): LogEntry["error"] | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }

  const result: NonNullable<LogEntry["error"]> = {
    name: error.name,
    message: error.message,
  };

  if (process.env.NODE_ENV !== "production" && error.stack !== undefined) {
    return {
      ...result,
      stack: error.stack,
    };
  }

  return result;
}

function write(entry: LogEntry): void {
  const payload = JSON.stringify(entry);

  if (entry.level === "error") {
    console.error(payload);
    return;
  }

  if (entry.level === "warn") {
    console.warn(payload);
    return;
  }

  console.log(payload);
}

function base(level: LogLevel, message: string, options?: { scope?: string; meta?: LogMeta; error?: unknown }): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (options?.scope !== undefined) {
    entry.scope = options.scope;
  }

  if (options?.meta !== undefined) {
    entry.meta = options.meta;
  }

  const serializedError = toSerializableError(options?.error);

  if (serializedError !== undefined) {
    entry.error = serializedError;
  }

  write(entry);
}

export const logger = {
  debug(message: string, options?: { scope?: string; meta?: LogMeta }) {
    base("debug", message, options);
  },
  info(message: string, options?: { scope?: string; meta?: LogMeta }) {
    base("info", message, options);
  },
  warn(message: string, options?: { scope?: string; meta?: LogMeta; error?: unknown }) {
    base("warn", message, options);
  },
  error(message: string, options?: { scope?: string; meta?: LogMeta; error?: unknown }) {
    base("error", message, options);
  },
};
