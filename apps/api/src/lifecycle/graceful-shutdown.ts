import type { Server } from "node:http";

export const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;

export type CleanupTask = () => void | Promise<void>;

export interface ApplicationLifecycle {
  /** Register application-owned cleanup before shutdown begins. */
  registerCleanup(task: CleanupTask): void;
  /** Stop accepting requests, drain connections, then run cleanup exactly once. */
  shutdown(): Promise<void>;
}

export interface ShutdownSignalSource {
  on(signal: "SIGINT" | "SIGTERM", listener: () => void): unknown;
  removeListener(signal: "SIGINT" | "SIGTERM", listener: () => void): unknown;
}

export interface ApplicationLifecycleOptions {
  readonly timeoutMs?: number;
  readonly onError?: (error: unknown) => void;
  readonly onStart?: () => void;
  readonly onComplete?: () => void;
}

/**
 * Owns HTTP shutdown and lifecycle cleanup. Business modules should not install
 * process signal handlers or manage the HTTP server directly.
 */
export function createApplicationLifecycle(
  server: Server,
  options: ApplicationLifecycleOptions = {}
): ApplicationLifecycle {
  const timeoutMs = options.timeoutMs ?? DEFAULT_SHUTDOWN_TIMEOUT_MS;
  const onError = options.onError ?? ((error: unknown) => {
    console.error("Application shutdown encountered an error.", error);
  });
  const cleanupTasks: CleanupTask[] = [];
  let shutdownPromise: Promise<void> | undefined;

  function safelyNotify(callback: (() => void) | undefined): void {
    try { callback?.(); } catch { /* Observability must not interrupt lifecycle work. */ }
  }

  function reportError(error: unknown): void {
    try {
      onError(error);
    } catch {
      // Reporting must not prevent the remaining cleanup tasks from running.
    }
  }

  function registerCleanup(task: CleanupTask): void {
    if (shutdownPromise) {
      throw new Error("Cannot register cleanup after shutdown has started.");
    }
    cleanupTasks.push(task);
  }

  function closeServer(): Promise<void> {
    if (!server.listening) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => { server.closeAllConnections(); }, timeoutMs);
      timer.unref();
      try {
        server.close((error) => {
          clearTimeout(timer);
          if (error) reject(error);
          else resolve();
        });
      } catch (error) {
        clearTimeout(timer);
        reject(error);
      }
    });
  }

  async function performShutdown(): Promise<void> {
    safelyNotify(options.onStart);
    try {
      await closeServer();
    } catch (error) {
      reportError(error);
    }
    for (const cleanup of cleanupTasks) {
      try { await cleanup(); }
      catch (error) { reportError(error); }
    }
    safelyNotify(options.onComplete);
  }

  function shutdown(): Promise<void> {
    if (!shutdownPromise) shutdownPromise = performShutdown();
    return shutdownPromise;
  }

  return { registerCleanup, shutdown };
}

/** Install process-level signal handlers only after the HTTP listener starts. */
export function registerShutdownSignals(
  lifecycle: Pick<ApplicationLifecycle, "shutdown">,
  signalSource: ShutdownSignalSource = process,
  onError: (error: unknown) => void = (error) => {
    console.error("Graceful shutdown failed.", error);
  }
): () => void {
  let signalReceived = false;
  const removeHandlers = (): void => {
    signalSource.removeListener("SIGINT", handleSignal);
    signalSource.removeListener("SIGTERM", handleSignal);
  };
  const handleSignal = (): void => {
    if (signalReceived) return;
    signalReceived = true;
    void lifecycle.shutdown().catch((error: unknown) => {
      try { onError(error); } catch { /* Never allow logging failure to escape the signal handler. */ }
    }).finally(removeHandlers);
  };
  signalSource.on("SIGINT", handleSignal);
  signalSource.on("SIGTERM", handleSignal);
  return removeHandlers;
}
