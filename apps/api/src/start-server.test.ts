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

test("MongoDB connection failure rejects startup before an HTTP listener is created", async () => {
  await assert.rejects(
    startServer({ MONGODB_URI: "mongodb://127.0.0.1:1/mern_enterprise_starter_test" }),
    /MongoDB connection or index initialization failed/,
  );
});

test("invalid LOG_LEVEL rejects startup before connecting to MongoDB", async () => {
  await assert.rejects(startServer({ LOG_LEVEL: "verbose" }), ConfigurationError);
});
