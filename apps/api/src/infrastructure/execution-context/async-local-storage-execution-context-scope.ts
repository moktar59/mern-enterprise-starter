import { AsyncLocalStorage } from "node:async_hooks";
import {
  ExecutionContextRequiredError,
  type ExecutionContext
} from "../../execution-context/execution-context.js";
import type { ExecutionContextScope } from "../../execution-context/execution-context-scope.js";

/** Node.js propagation implementation; application code should depend on the scope contract. */
export class AsyncLocalStorageExecutionContextScope implements ExecutionContextScope {
  private readonly storage = new AsyncLocalStorage<ExecutionContext>();

  run<T>(context: ExecutionContext, operation: () => T): T {
    return this.storage.run(context, operation);
  }

  current(): ExecutionContext | undefined {
    return this.storage.getStore();
  }

  require(): ExecutionContext {
    const context = this.current();
    if (!context) throw new ExecutionContextRequiredError();
    return context;
  }
}
