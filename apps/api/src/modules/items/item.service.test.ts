import assert from "node:assert/strict";
import { test } from "node:test";
import { createItemService, type ItemRepository } from "./item.repository.js";

test("item service delegates pagination to its repository without persistence dependencies", async () => {
  const expected = {
    records: [{ id: "item-001", name: "Example item 1" }],
    pagination: { page: 1, perPage: 10, totalItems: 1, totalPages: 1 }
  };
  let received: unknown;
  const repository: ItemRepository = {
    async list(query) {
      received = query;
      return expected;
    }
  };
  const result = await createItemService(repository).list({ page: 1, perPage: 10 });
  assert.deepEqual(received, { page: 1, perPage: 10 });
  assert.deepEqual(result, expected);
});
