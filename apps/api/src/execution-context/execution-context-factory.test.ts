import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ExecutionContextConflictError,
  type ExecutionContext
} from "./execution-context.js";
import { DefaultExecutionContextFactory } from "./execution-context-factory.js";

const factory = new DefaultExecutionContextFactory();

function createContext(): ExecutionContext {
  return factory.create({ source: "HTTP", requestId: "request-1", correlationId: "correlation-1" });
}

test("generates execution identity and start time internally", () => {
  const first = createContext();
  const second = createContext();

  assert.ok(first.executionId);
  assert.notEqual(first.executionId, second.executionId);
  assert.equal(first.source, "HTTP");
  assert.equal(first.requestId, "request-1");
  assert.equal(first.correlationId, "correlation-1");
  assert.ok(Number.isFinite(Date.parse(first.startedAt)));
});

test("creates immutable contexts and immutable derived metadata", () => {
  const context = createContext();
  const derived = factory.withPrincipal(context, {
    principalId: "user-1",
    principalType: "human"
  });

  assert.equal(Object.isFrozen(context), true);
  assert.equal(Object.isFrozen(derived), true);
  assert.equal(Object.isFrozen(derived.principal), true);
  assert.equal(context.principal, undefined);
  assert.equal(derived.executionId, context.executionId);
});

test("allows the same principal and rejects conflicting principal identity", () => {
  const context = factory.withPrincipal(createContext(), {
    principalId: "user-1",
    principalType: "human"
  });

  assert.equal(factory.withPrincipal(context, {
    principalId: "user-1",
    principalType: "human"
  }), context);

  assert.throws(() => factory.withPrincipal(context, {
    principalId: "user-2",
    principalType: "human"
  }), ExecutionContextConflictError);
});

test("allows the same tenant and rejects conflicting tenant identity", () => {
  const context = factory.withTenant(createContext(), { id: "tenant-1" });

  assert.equal(factory.withTenant(context, { id: "tenant-1" }), context);
  assert.throws(() => factory.withTenant(context, { id: "tenant-2" }), ExecutionContextConflictError);
});

test("does not silently replace an established locale", () => {
  const context = factory.withLocale(createContext(), "en");

  assert.equal(factory.withLocale(context, "en"), context);
  assert.throws(() => factory.withLocale(context, "ja"), ExecutionContextConflictError);
});
