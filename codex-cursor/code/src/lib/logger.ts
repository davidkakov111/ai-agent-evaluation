type LogLevel = "info" | "warn" | "error";

type LogData = Record<string, unknown>;

function write(level: LogLevel, event: string, data?: LogData): void {
  const payload = {
    ts: new Date().toISOString(),
    level,
    event,
    ...(data ?? {}),
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.log(line);
}

export const logger = {
  info(event: string, data?: LogData) {
    write("info", event, data);
  },
  warn(event: string, data?: LogData) {
    write("warn", event, data);
  },
  error(event: string, data?: LogData) {
    write("error", event, data);
  },
};
