type LogLevel = "debug" | "info" | "warn" | "error";

interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

const logger: Logger = {
  debug: (...args) => {
    if (import.meta.env.DEV) console.debug("[WFP]", ...args);
  },
  info: (...args) => {
    if (import.meta.env.DEV) console.info("[WFP]", ...args);
  },
  warn: (...args) => console.warn("[WFP]", ...args),
  error: (...args) => console.error("[WFP]", ...args),
};

export { logger };
export type { LogLevel, Logger };
