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

test("startServer does not leave a listener running when the port is occupied", async () => {
  const { createServer } = await import("node:http");
  const blocker = createServer();
  await new Promise<void>((resolve, reject) => {
    blocker.once("error", reject);
    blocker.listen(0, "127.0.0.1", resolve);
  });

  const address = blocker.address();
  assert.ok(address && typeof address !== "string");

  const originalExitCode = process.exitCode;
  const originalConsoleError = console.error;
  console.error = () => undefined;

  try {
    const server = startServer({
      NODE_ENV: "test",
      HOST: "127.0.0.1",
      PORT: String(address.port)
    });

    const startupError = await new Promise<NodeJS.ErrnoException>((resolve) => {
      server.once("error", resolve);
    });

    assert.equal(startupError.code, "EADDRINUSE");
    assert.equal(server.listening, false);
    assert.equal(process.exitCode, 1);
  } finally {
    console.error = originalConsoleError;
    process.exitCode = originalExitCode;
    await new Promise<void>((resolve, reject) => {
      blocker.close((error) => error ? reject(error) : resolve());
    });
  }
});
