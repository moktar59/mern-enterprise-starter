import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { EventEmitter } from "node:events";
import { after, test } from "node:test";
import { createApplicationLifecycle, registerShutdownSignals } from "./graceful-shutdown.js";

const servers: Server[] = [];
after(async () => {
  await Promise.all(servers.map(async (server) => {
    if (!server.listening) return;
    await new Promise<void>((resolve) => server.close(() => resolve()));
    server.closeAllConnections();
  }));
});

function listen(server: Server): Promise<void> {
  servers.push(server);
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
}

test("repeated shutdown calls share one promise and run cleanup once", async () => {
  const server = createServer((_request, response) => response.end("ok"));
  await listen(server);
  let cleanupCount = 0;
  const lifecycle = createApplicationLifecycle(server, { timeoutMs: 100 });
  lifecycle.registerCleanup(() => { cleanupCount += 1; });
  const first = lifecycle.shutdown();
  const second = lifecycle.shutdown();
  assert.equal(first, second);
  await Promise.all([first, second]);
  assert.equal(cleanupCount, 1);
  assert.equal(server.listening, false);
});

test("force-closes a request that exceeds the shutdown deadline", async () => {
  const server = createServer((_request, _response) => {});
  await listen(server);
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const request = fetch(`http://127.0.0.1:${address.port}`).catch(() => undefined);
  await new Promise((resolve) => setTimeout(resolve, 10));
  const lifecycle = createApplicationLifecycle(server, { timeoutMs: 25 });
  await lifecycle.shutdown();
  await request;
  assert.equal(server.listening, false);
});

test("cleanup continues when one cleanup task fails", async () => {
  const server = createServer((_request, response) => response.end("ok"));
  await listen(server);
  const errors: unknown[] = [];
  let secondCleanupRan = false;
  const lifecycle = createApplicationLifecycle(server, {
    timeoutMs: 100, onError: (error) => errors.push(error)
  });
  lifecycle.registerCleanup(() => { throw new Error("cleanup failure"); });
  lifecycle.registerCleanup(() => { secondCleanupRan = true; });
  await lifecycle.shutdown();
  assert.equal(errors.length, 1);
  assert.equal(secondCleanupRan, true);
});

test("cleanup cannot be registered after shutdown begins", async () => {
  const server = createServer((_request, response) => response.end("ok"));
  await listen(server);
  const lifecycle = createApplicationLifecycle(server);
  const shutdown = lifecycle.shutdown();
  assert.throws(() => lifecycle.registerCleanup(() => undefined), /after shutdown has started/);
  await shutdown;
});

test("repeated process signals invoke shutdown once and remove handlers", async () => {
  const signals = new EventEmitter();
  let shutdownCount = 0;
  registerShutdownSignals({ shutdown: async () => { shutdownCount += 1; } }, signals);
  signals.emit("SIGTERM");
  signals.emit("SIGINT");
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(shutdownCount, 1);
  assert.equal(signals.listenerCount("SIGINT"), 0);
  assert.equal(signals.listenerCount("SIGTERM"), 0);
});
