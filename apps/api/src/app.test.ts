import assert from "node:assert/strict";
import { after, test } from "node:test";
import { createServer, type Server } from "node:http";
import { createApp } from "./app.js";

let server: Server | undefined;

after(async () => {
  if (!server?.listening) return;
  await new Promise<void>((resolve, reject) => {
    server?.close((error) => error ? reject(error) : resolve());
  });
});

test("GET / returns the starter API response", async () => {
  server = createServer(createApp());
  const baseUrl = await new Promise<string>((resolve, reject) => {
    server?.once("error", reject);
    server?.listen(0, "127.0.0.1", () => {
      const address = server?.address();
      if (!address || typeof address === "string") {
        reject(new Error("Expected a TCP server address."));
        return;
      }
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });

  const response = await fetch(baseUrl);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    message: "MERN Enterprise Starter API"
  });
});
