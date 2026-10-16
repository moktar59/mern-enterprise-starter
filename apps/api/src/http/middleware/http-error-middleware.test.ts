import assert from "node:assert/strict";
import express from "express";
import { createServer, type Server } from "node:http";
import { after, test } from "node:test";
import { ValidationFailedError } from "../../errors/application-error.js";
import { httpErrorHandler } from "./http-error-middleware.js";

const servers: Server[] = [];

after(async () => {
  await Promise.all(servers.map(async (server) => {
    if (!server.listening) return;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }));
});

async function requestFor(error: Error): Promise<Response> {
  const app = express();
  app.use((_request, response, next) => {
    response.setHeader("X-Request-Id", "test-request-id");
    next(error);
  });
  app.use(httpErrorHandler);
  const server = createServer(app);
  servers.push(server);

  const baseUrl = await new Promise<string>((resolve, reject) => {
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

  return fetch(baseUrl);
}

test("validation errors return RFC 9457 details without sensitive input", async () => {
  const response = await requestFor(new ValidationFailedError([
    { field: "email", code: "INVALID_FORMAT" }
  ], "private input must not appear"));
  assert.equal(response.status, 422);
  assert.match(response.headers.get("content-type") ?? "", /^application\/problem\+json/);
  assert.deepEqual(await response.json(), {
    type: "about:blank",
    title: "Unprocessable Content",
    status: 422,
    code: "VALIDATION_FAILED",
    requestId: "test-request-id",
    errors: [{ field: "email", code: "INVALID_FORMAT" }]
  });
});

test("unexpected errors return a sanitized internal error", async () => {
  const response = await requestFor(new Error("secret database credentials"));
  assert.equal(response.status, 500);
  const body = await response.text();
  assert.deepEqual(JSON.parse(body), {
    type: "about:blank",
    title: "Internal Server Error",
    status: 500,
    code: "INTERNAL_ERROR",
    requestId: "test-request-id"
  });
  assert.doesNotMatch(body, /secret database credentials/);
});
