import { test } from "node:test";
import { normalizeVersion } from "../lib/normalize-version";
import assert from "node:assert/strict";

test("normalizeVersion: should merge identical versions with different revisions", () => {
  const v1 = "111.0.5563.33 (1050)";
  const v2 = "111.0.5563.33 (1049)";

  assert.equal(normalizeVersion(v1), "111.0.5563.33");
  assert.equal(normalizeVersion(v2), "111.0.5563.33");
  assert.equal(normalizeVersion(v1), normalizeVersion(v2));
});
