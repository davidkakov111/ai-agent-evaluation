/**
 * Structured logger - JSON output for production parsing.
 * Avoid logging passwords, tokens, or other sensitive data in meta.
 * Can be replaced with pino or similar for advanced features.
 */
export const logger = {
  error: (message: string, meta?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: "error", message, ...meta }));
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: "warn", message, ...meta }));
  },
  info: (message: string, meta?: Record<string, unknown>) => {
    console.info(JSON.stringify({ level: "info", message, ...meta }));
  },
};
