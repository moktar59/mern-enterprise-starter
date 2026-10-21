import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { after, test } from "node:test";
import { composeApplication } from "../../composition/compose-application.js";
import { InMemoryItemRepository } from "../../modules/items/in-memory-item.repository.js";
const servers: Server[] = [];
after(async () => {
  await Promise.all(servers.map(async (server) => {
    if (!server.listening) return;
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }));
});
async function startApp(): Promise<string> {
  const server = createServer(composeApplication(new InMemoryItemRepository()));
  servers.push(server);
  return new Promise<string>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") { reject(new Error("Expected a TCP server address.")); return; }
      resolve(`http://127.0.0.1:${address.port}`);
    });
  });
}
test("items endpoint returns the default page and accurate pagination", async () => {
  const response = await fetch(`${await startApp()}/api/v1/items`);
  const body = await response.json() as { records: { id: string; name: string }[]; pagination: { page: number; perPage: number; totalItems: number; totalPages: number } };
  assert.equal(response.status, 200); assert.equal(body.records.length, 10);
  assert.equal(body.records[0]?.id, "item-001"); assert.equal(body.records[9]?.id, "item-010");
  assert.deepEqual(body.pagination, { page: 1, perPage: 10, totalItems: 23, totalPages: 3 });
});
test("pagination returns the requested slice without skipping or duplicating records", async () => {
  const response = await fetch(`${await startApp()}/api/v1/items?page=2&perPage=5`);
  const body = await response.json() as { records: { id: string }[]; pagination: { page: number; perPage: number; totalItems: number; totalPages: number } };
  assert.equal(response.status, 200);
  assert.deepEqual(body.records.map((item) => item.id), ["item-006", "item-007", "item-008", "item-009", "item-010"]);
  assert.deepEqual(body.pagination, { page: 2, perPage: 5, totalItems: 23, totalPages: 5 });
});
test("out-of-range pages return an empty collection with dataset metadata", async () => {
  const response = await fetch(`${await startApp()}/api/v1/items?page=99&perPage=10`);
  const body = await response.json() as { records: unknown[]; pagination: { page: number; perPage: number; totalItems: number; totalPages: number } };
  assert.equal(response.status, 200); assert.deepEqual(body.records, []);
  assert.deepEqual(body.pagination, { page: 99, perPage: 10, totalItems: 23, totalPages: 3 });
});
test("perPage=500 is accepted and returns all records", async () => {
  const response = await fetch(`${await startApp()}/api/v1/items?perPage=500`);
  const body = await response.json() as { records: unknown[]; pagination: { page: number; perPage: number; totalItems: number; totalPages: number } };
  assert.equal(response.status, 200); assert.equal(body.records.length, 23);
  assert.deepEqual(body.pagination, { page: 1, perPage: 500, totalItems: 23, totalPages: 1 });
});
for (const [query, field, code] of [
  ["page=0", "page", "OUT_OF_RANGE"], ["page=-1", "page", "OUT_OF_RANGE"],
  ["page=1.5", "page", "INVALID_INTEGER"], ["page=abc", "page", "INVALID_INTEGER"],
  ["perPage=0", "perPage", "OUT_OF_RANGE"], ["perPage=501", "perPage", "OUT_OF_RANGE"],
  ["perPage=1.5", "perPage", "INVALID_INTEGER"], ["perPage=nope", "perPage", "INVALID_INTEGER"]
] as const) {
  test(`invalid pagination ${query} returns a sanitized 422 response`, async () => {
    const response = await fetch(`${await startApp()}/api/v1/items?${query}`);
    const body = await response.json() as { status: number; code: string; requestId: string; errors: { field: string; code: string }[] };
    assert.equal(response.status, 422); assert.equal(body.status, 422); assert.equal(body.code, "VALIDATION_FAILED");
    assert.equal(body.requestId, response.headers.get("x-request-id")); assert.deepEqual(body.errors, [{ field, code }]);
  });
}
test("unsupported methods return 405 with Allow and Problem Details", async () => {
  const response = await fetch(`${await startApp()}/api/v1/items`, { method: "POST" });
  const body = await response.json() as Record<string, unknown>;
  assert.equal(response.status, 405); assert.equal(response.headers.get("allow"), "GET, HEAD");
  assert.match(response.headers.get("content-type") ?? "", /^application\/problem\+json/);
  assert.equal(body.status, 405); assert.equal(body.code, "METHOD_NOT_ALLOWED");
  assert.equal(body.requestId, response.headers.get("x-request-id"));
});
test("Swagger UI and raw OpenAPI specification are exposed", async () => {
  const baseUrl = await startApp();
  const docsResponse = await fetch(`${baseUrl}/api-docs`); const docs = await docsResponse.text();
  assert.equal(docsResponse.status, 200); assert.match(docs, /SwaggerUIBundle/); assert.match(docs, /url:\s*"\/openapi\.yaml"/);
  const specResponse = await fetch(`${baseUrl}/openapi.yaml`); const spec = await specResponse.text();
  assert.equal(specResponse.status, 200); assert.match(specResponse.headers.get("content-type") ?? "", /application\/yaml/);
  assert.match(spec, /openapi: 3\.1\.0/); assert.match(spec, /\/api\/v1\/items:/);
});
