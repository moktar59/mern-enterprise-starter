import assert from "node:assert/strict";
import express from "express";
import { after, test } from "node:test";
import type { Server } from "node:http";
import { DefaultExecutionContextFactory } from "../../execution-context/execution-context-factory.js";
import { AsyncLocalStorageExecutionContextScope } from "../../infrastructure/execution-context/async-local-storage-execution-context-scope.js";
import { createExecutionContextMiddleware } from "./execution-context-middleware.js";

let server: Server | undefined;

after(async () => {
  if (!server?.listening) return;
  await new Promise<void>((resolve, reject) => {
    server?.close((error) => (error ? reject(error) : resolve()));
  });
});

test("isolates concurrent HTTP requests and returns each request ID", async () => {
  const factory = new DefaultExecutionContextFactory();
  const scope = new AsyncLocalStorageExecutionContextScope();
  const app = express();

  app.use(createExecutionContextMiddleware(factory, scope));
  app.get("/", async (_request, response) => {
    const before = scope.require();
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    const after = scope.require();

    response.json({
      executionId: after.executionId,
      requestId: after.requestId,
      correlationId: after.correlationId,
      contextPreserved: before.executionId === after.executionId,
    });
  });

  const baseUrl = await new Promise<string>((resolve, reject) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server?.address();
      if (!address || typeof address === "string") {
        reject(new Error("Expected a TCP server address."));
        return;
      }
      resolve(`http://127.0.0.1:${address.port}`);
    });
    server.once("error", reject);
  });

  const [firstResponse, secondResponse] = await Promise.all([
    fetch(baseUrl, { headers: { "X-Request-Id": "client-supplied-id" } }),
    fetch(baseUrl),
  ]);
  const [first, second] = await Promise.all([
    firstResponse.json() as Promise<{
      executionId: string;
      requestId: string;
      correlationId: string;
      contextPreserved: boolean;
    }>,
    secondResponse.json() as Promise<{
      executionId: string;
      requestId: string;
      correlationId: string;
      contextPreserved: boolean;
    }>,
  ]);

  assert.equal(firstResponse.status, 200);
  assert.equal(secondResponse.status, 200);
  assert.equal(firstResponse.headers.get("x-request-id"), first.requestId);
  assert.equal(secondResponse.headers.get("x-request-id"), second.requestId);
  assert.ok(first.requestId);
  assert.ok(second.requestId);
  assert.notEqual(first.requestId, "client-supplied-id");
  assert.ok(first.correlationId);
  assert.ok(second.correlationId);
  assert.notEqual(first.requestId, second.requestId);
  assert.notEqual(first.correlationId, second.correlationId);
  assert.notEqual(first.executionId, second.executionId);
  assert.equal(first.contextPreserved, true);
  assert.equal(second.contextPreserved, true);
});
