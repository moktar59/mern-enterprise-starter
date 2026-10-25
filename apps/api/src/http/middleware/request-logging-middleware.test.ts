import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import { after, test } from "node:test";
import { DefaultExecutionContextFactory } from "../../execution-context/execution-context-factory.js";
import type { Logger, LogFields } from "../../logging/logger.js";
import { AsyncLocalStorageExecutionContextScope } from "../../infrastructure/execution-context/async-local-storage-execution-context-scope.js";
import { createExecutionContextMiddleware } from "./execution-context-middleware.js";
import { createRequestLoggingMiddleware } from "./request-logging-middleware.js";

const servers: Server[] = [];
after(async () => {
  await Promise.all(
    servers.map(async (server) => {
      if (!server.listening) return;
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }),
  );
});

function createCaptureLogger() {
  const records: { level: string; fields: LogFields; message: string }[] = [];
  const capture = (level: string) => (fields: LogFields, message: string) => {
    records.push({ level, fields, message });
  };
  const logger: Logger = {
    trace: capture("trace"),
    debug: capture("debug"),
    info: capture("info"),
    warn: capture("warn"),
    error: capture("error"),
    fatal: capture("fatal"),
  };
  return { logger, records };
}

test("logs route template, server request context, status and duration without raw URL", async () => {
  const { logger, records } = createCaptureLogger();
  const scope = new AsyncLocalStorageExecutionContextScope();
  const app = express();
  app.use(createExecutionContextMiddleware(new DefaultExecutionContextFactory(), scope));
  app.use(createRequestLoggingMiddleware(logger, scope));
  app.get("/things/:id", (_request, response) => response.status(201).json({ ok: true }));
  const server = createServer(app);
  servers.push(server);
  const baseUrl = await new Promise<string>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Expected TCP address"));
        return;
      }
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });

  const response = await fetch(`${baseUrl}/things/secret-id?token=do-not-log`, {
    headers: { "X-Request-Id": "client-request-id" },
  });
  assert.equal(response.status, 201);
  await response.arrayBuffer();
  assert.equal(records.length, 1);
  assert.equal(records[0].level, "info");
  assert.equal(records[0].fields.method, "GET");
  assert.equal(records[0].fields.route, "/things/:id");
  assert.equal(records[0].fields.statusCode, 201);
  assert.equal(typeof records[0].fields.durationMs, "number");
  assert.ok(records[0].fields.requestId);
  assert.notEqual(records[0].fields.requestId, "client-request-id");
  assert.equal(records[0].fields.requestId, response.headers.get("x-request-id"));
  assert.ok(records[0].fields.correlationId);
  assert.doesNotMatch(JSON.stringify(records[0]), /secret-id|do-not-log/);
});

test("logs liveness requests at debug level", async () => {
  const { logger, records } = createCaptureLogger();
  const scope = new AsyncLocalStorageExecutionContextScope();
  const app = express();
  app.use(createExecutionContextMiddleware(new DefaultExecutionContextFactory(), scope));
  app.use(createRequestLoggingMiddleware(logger, scope));
  app.get("/health/live", (_request, response) => response.json({ status: "ok" }));
  const server = createServer(app);
  servers.push(server);
  const baseUrl = await new Promise<string>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Expected TCP address"));
        return;
      }
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
  await (await fetch(baseUrl + "/health/live")).arrayBuffer();
  assert.equal(records.length, 1);
  assert.equal(records[0].level, "debug");
});
