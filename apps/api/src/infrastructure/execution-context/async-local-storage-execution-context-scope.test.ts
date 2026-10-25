import assert from "node:assert/strict";
import { test } from "node:test";
import { ExecutionContextRequiredError } from "../../execution-context/execution-context.js";
import { DefaultExecutionContextFactory } from "../../execution-context/execution-context-factory.js";
import { AsyncLocalStorageExecutionContextScope } from "./async-local-storage-execution-context-scope.js";

const factory = new DefaultExecutionContextFactory();
const scope = new AsyncLocalStorageExecutionContextScope();

function context(requestId: string) {
  return factory.create({ source: "HTTP", requestId, correlationId: `correlation-${requestId}` });
}

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

test("current is undefined outside a scope and require fails clearly", () => {
  assert.equal(scope.current(), undefined);
  assert.throws(() => scope.require(), ExecutionContextRequiredError);
});

test("preserves context across asynchronous continuations", async () => {
  const expected = context("async");
  await scope.run(expected, async () => {
    await delay(1);
    assert.equal(scope.require(), expected);
  });
  assert.equal(scope.current(), undefined);
});

test("nested scopes restore their parent after success and failure", async () => {
  const parent = context("parent");
  const child = context("child");

  await scope.run(parent, async () => {
    assert.equal(scope.require(), parent);
    await scope.run(child, async () => {
      await delay(1);
      assert.equal(scope.require(), child);
    });
    assert.equal(scope.require(), parent);

    await assert.rejects(
      scope.run(child, async () => {
        await delay(1);
        throw new Error("expected test failure");
      }),
      /expected test failure/,
    );
    assert.equal(scope.require(), parent);
  });

  assert.equal(scope.current(), undefined);
});

test("isolates concurrent asynchronous executions", async () => {
  const first = context("first");
  const second = context("second");

  const [firstId, secondId] = await Promise.all([
    scope.run(first, async () => {
      await delay(15);
      return scope.require().executionId;
    }),
    scope.run(second, async () => {
      await delay(5);
      return scope.require().executionId;
    }),
  ]);

  assert.equal(firstId, first.executionId);
  assert.equal(secondId, second.executionId);
  assert.notEqual(firstId, secondId);
});
