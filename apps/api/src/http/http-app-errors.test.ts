import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { after, test } from "node:test";
import { composeApplication } from "../composition/compose-application.js";
import { InMemoryItemRepository } from "../modules/items/in-memory-item.repository.test.js";
const servers: Server[] = [];
after(async () => {
  await Promise.all(
    servers.map(async (server) => {
      if (!server.listening) return;
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }),
  );
});
async function startApp(): Promise<string> {
  const server = createServer(composeApplication(new InMemoryItemRepository()));
  servers.push(server);
  return new Promise<string>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Expected a TCP server address."));
        return;
      }
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}
test("unknown routes return a request-correlated Problem Details response", async () => {
  const response = await fetch(`${await startApp()}/does-not-exist`);
  const body = (await response.json()) as Record<string, unknown>;
  assert.equal(response.status, 404);
  assert.match(response.headers.get("content-type") ?? "", /^application\/problem\+json/);
  assert.equal(body.type, "about:blank");
  assert.equal(body.title, "Not Found");
  assert.equal(body.status, response.status);
  assert.equal(body.code, "ROUTE_NOT_FOUND");
  assert.equal(body.requestId, response.headers.get("x-request-id"));
});
test("malformed JSON returns a sanitized 400 Problem Details response", async () => {
  const response = await fetch(await startApp(), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  const body = (await response.json()) as Record<string, unknown>;
  assert.equal(response.status, 400);
  assert.equal(body.status, response.status);
  assert.equal(body.code, "MALFORMED_REQUEST");
  assert.equal(body.requestId, response.headers.get("x-request-id"));
  assert.equal("errors" in body, false);
});
test("liveness endpoint confirms HTTP availability", async () => {
  const response = await fetch(`${await startApp()}/health/live`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});
