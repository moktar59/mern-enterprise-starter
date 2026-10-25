import assert from "node:assert/strict";
import { test } from "node:test";
import { Argon2PasswordHasher } from "./argon2-password-hasher.js";
test("Argon2id hash verifies only matching passwords", async () => {
  const h = new Argon2PasswordHasher(),
    v = await h.hash("correct horse battery staple");
  assert.match(v, /^\$argon2id\$/);
  assert.equal(await h.verify(v, "correct horse battery staple"), true);
  assert.equal(await h.verify(v, "wrong"), false);
});
