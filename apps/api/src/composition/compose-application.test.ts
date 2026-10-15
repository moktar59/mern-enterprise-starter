import assert from "node:assert/strict";
import { test } from "node:test";
import { composeApplication } from "./compose-application.js";

test("composition returns an HTTP application without starting a listener", () => {
  const app = composeApplication();

  assert.equal(typeof app, "function");
  assert.equal(typeof app.listen, "function");
});
