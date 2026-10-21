import assert from "node:assert/strict";
import { test } from "node:test";
import { composeApplication } from "./compose-application.js";
import { InMemoryItemRepository } from "../modules/items/in-memory-item.repository.js";
test("composition returns an HTTP application without starting a listener", () => {
  const app = composeApplication(new InMemoryItemRepository());
  assert.equal(typeof app, "function");
  assert.equal(typeof app.listen, "function");
});
