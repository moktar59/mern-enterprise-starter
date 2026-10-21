import assert from "node:assert/strict";
import { after, test } from "node:test";
import mongoose from "mongoose";
import { connectDatabase } from "../database/connect-database.js";
import { ItemModel } from "./mongoose-item.model.js";
import { MongooseItemRepository } from "./mongoose-item.repository.js";

const uri = process.env.TEST_MONGODB_URI;
let connected = false;

after(async () => {
  if (!connected) return;
  await ItemModel.deleteMany({ id: /^item-test-/ });
  await mongoose.disconnect();
});

test("MongoDB repository filters, orders, paginates and counts in the database", async (t) => {
  if (!uri) {
    t.skip("Set TEST_MONGODB_URI to run database integration tests.");
    return;
  }
  const connection = await connectDatabase(uri);
  connected = true;
  await ItemModel.deleteMany({ id: /^item-test-/ });
  await ItemModel.insertMany([
    { id: "item-test-b", name: "B" },
    { id: "item-test-a", name: "A" }
  ]);
  const result = await new MongooseItemRepository().list({ page: 1, perPage: 1 });
  assert.deepEqual(result.records, [{ id: "item-test-a", name: "A" }]);
  assert.deepEqual(result.pagination, { page: 1, perPage: 1, totalItems: 2, totalPages: 2 });
  await ItemModel.deleteMany({ id: /^item-test-/ });
  await connection.disconnect();
  connected = false;
});
