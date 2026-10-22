import assert from "node:assert/strict";
import { Writable } from "node:stream";
import { test } from "node:test";
import { createPinoLogger } from "./pino-logger.js";

test("Pino logger emits structured JSON and redacts common sensitive fields", () => {
  let output = "";
  const destination = new Writable({
    write(chunk, _encoding, callback) { output += chunk.toString(); callback(); }
  });
  const logger = createPinoLogger("info", destination);
  logger.info({
    requestId: "request-123",
    password: "dont-log-this-password",
    authorization: "Bearer dont-log-this-token",
    user: { token: "nested-secret-token" }
  }, "test event");

  const event = JSON.parse(output.trim()) as Record<string, unknown>;
  assert.equal(event.level, 30);
  assert.equal(event.requestId, "request-123");
  assert.equal(event.msg, "test event");
  assert.equal(event.password, "[REDACTED]");
  assert.equal(event.authorization, "[REDACTED]");
  assert.equal((event.user as Record<string, unknown>).token, "[REDACTED]");
  assert.doesNotMatch(output, /dont-log-this/);
});

test("silent logger does not emit records", () => {
  let output = "";
  const destination = new Writable({
    write(chunk, _encoding, callback) { output += chunk.toString(); callback(); }
  });
  createPinoLogger("silent", destination).error({}, "must be suppressed");
  assert.equal(output, "");
});
