import pino, { type Logger as PinoLogger } from "pino";
import type { LogLevel, Logger } from "../../logging/logger.js";

const redactionPaths = [
  "authorization",
  "cookie",
  "set-cookie",
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "req.headers.authorization",
  "req.headers.cookie",
  "headers.authorization",
  "headers.cookie",
  "*.password",
  "*.accessToken",
  "*.refreshToken",
  "*.secret",
  "*.token",
];

/** Pino is confined to infrastructure; application modules receive only Logger. */
export function createPinoLogger(level: LogLevel, destination?: pino.DestinationStream): Logger {
  const instance: PinoLogger = pino(
    {
      level,
      redact: { paths: redactionPaths, censor: "[REDACTED]" },
      base: undefined,
      messageKey: "message",
      timestamp: pino.stdTimeFunctions.isoTime,
    },
    destination,
  );
  return {
    trace: (fields, message) => instance.trace(fields, message),
    debug: (fields, message) => instance.debug(fields, message),
    info: (fields, message) => instance.info(fields, message),
    warn: (fields, message) => instance.warn(fields, message),
    error: (fields, message) => instance.error(fields, message),
    fatal: (fields, message) => instance.fatal(fields, message),
  };
}
