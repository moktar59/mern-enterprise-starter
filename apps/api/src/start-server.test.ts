import assert from "node:assert/strict";
import { test } from "node:test";
import { ConfigurationError } from "./config.js";
import { startServer } from "./start-server.js";

test("startServer rejects invalid configuration before opening a listener", () => {
  assert.throws(
    () => startServer({ NODE_ENV: "staging" }),
    ConfigurationError
  );
});
