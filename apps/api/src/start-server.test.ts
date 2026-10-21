import assert from "node:assert/strict";
import { test } from "node:test";
import { ConfigurationError } from "./config.js";
import { startServer } from "./start-server.js";
test("startServer rejects invalid configuration before connecting to MongoDB", async () => {
  await assert.rejects(startServer({ NODE_ENV: "staging" }), ConfigurationError);
});
test("startServer rejects invalid port configuration before connecting to MongoDB", async () => {
  await assert.rejects(startServer({ PORT: "65536" }), ConfigurationError);
});
