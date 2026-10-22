export type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal" | "silent";
export type LogFields = Readonly<Record<string, unknown>>;

/** Application-owned structured logging contract; callers do not depend on a logging vendor. */
export interface Logger {
  trace(fields: LogFields, message: string): void;
  debug(fields: LogFields, message: string): void;
  info(fields: LogFields, message: string): void;
  warn(fields: LogFields, message: string): void;
  error(fields: LogFields, message: string): void;
  fatal(fields: LogFields, message: string): void;
}
