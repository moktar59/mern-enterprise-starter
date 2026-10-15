import type { ExecutionContext } from "./execution-context.js";

/** Controls access to and propagation of the current execution context. */
export interface ExecutionContextScope {
  run<T>(context: ExecutionContext, operation: () => T): T;
  current(): ExecutionContext | undefined;
  require(): ExecutionContext;
}
