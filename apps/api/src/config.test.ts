import assert from "node:assert/strict";
import { test } from "node:test";
import { ConfigurationError, loadConfig } from "./config.js";
test("uses documented defaults including local MongoDB", () => {
  assert.deepEqual(loadConfig({}), {
    nodeEnv: "development", host: "127.0.0.1", port: 3000,
    mongoUri: "mongodb://127.0.0.1:27017/mern_enterprise_starter"
  });
});
test("normalizes and accepts valid environment overrides", () => {
  assert.deepEqual(loadConfig({ NODE_ENV: " test ", HOST: " 0.0.0.0 ", PORT: "8080", MONGODB_URI: " mongodb://localhost/test " }), {
    nodeEnv: "test", host: "0.0.0.0", port: 8080, mongoUri: "mongodb://localhost/test"
  });
});
test("rejects unsupported NODE_ENV values", () => assert.throws(() => loadConfig({ NODE_ENV: "staging" }), ConfigurationError));
test("rejects empty HOST and MONGODB_URI", () => {
  assert.throws(() => loadConfig({ HOST: "   " }), ConfigurationError);
  assert.throws(() => loadConfig({ MONGODB_URI: " " }), ConfigurationError);
});
for (const port of ["", "abc", "1.5", "0", "65536", "-1", "  "]) {
  test(`rejects invalid PORT value ${JSON.stringify(port)}`, () => assert.throws(() => loadConfig({ PORT: port }), ConfigurationError));
}
test("returns configuration frozen at runtime", () => {
  const config = loadConfig({});
  assert.equal(Object.isFrozen(config), true);
  assert.equal(Reflect.set(config, "port", 4000), false);
  assert.equal(config.port, 3000);
});
