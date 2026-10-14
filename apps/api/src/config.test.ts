import assert from "node:assert/strict";
import { test } from "node:test";
import { ConfigurationError, loadConfig } from "./config.js";
import { startServer } from "./start-server.js";

test("uses the documented configuration defaults", () => {
  assert.deepEqual(loadConfig({}), {
    nodeEnv: "development",
    host: "127.0.0.1",
    port: 3000
  });
});

test("normalizes and accepts valid environment overrides", () => {
  assert.deepEqual(loadConfig({
    NODE_ENV: " test ",
    HOST: " 0.0.0.0 ",
    PORT: "8080"
  }), {
    nodeEnv: "test",
    host: "0.0.0.0",
    port: 8080
  });
});

test("rejects unsupported NODE_ENV values", () => {
  assert.throws(
    () => loadConfig({ NODE_ENV: "staging" }),
    ConfigurationError
  );
});

test("rejects an empty HOST", () => {
  assert.throws(
    () => loadConfig({ HOST: "   " }),
    ConfigurationError
  );
});

for (const port of ["", "abc", "1.5", "0", "65536", "-1", "  "]) {
  test(`rejects invalid PORT value ${JSON.stringify(port)}`, () => {
    assert.throws(() => loadConfig({ PORT: port }), ConfigurationError);
  });
}

test("returns configuration frozen at runtime", () => {
  const config = loadConfig({});
  assert.equal(Object.isFrozen(config), true);
  assert.equal(Reflect.set(config, "port", 4000), false);
  assert.equal(config.port, 3000);
});

test("invalid configuration prevents listener startup", () => {
  assert.throws(
    () => startServer({ PORT: "65536" }),
    ConfigurationError
  );
});
