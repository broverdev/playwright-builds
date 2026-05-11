import { test } from "node:test";
import assert from "node:assert/strict";
import { getVersionPriority, normalizeVersion } from "../lib/versions.ts";

test("normalizeVersion: should merge identical versions with different revisions", () => {
  const v1 = "111.0.5563.33 (1050)";
  const v2 = "111.0.5563.33 (1049)";

  assert.equal(normalizeVersion(v1), "111.0.5563.33");
  assert.equal(normalizeVersion(v2), "111.0.5563.33");
  assert.equal(normalizeVersion(v1), normalizeVersion(v2));
});

test("getStabilityScore: should prioritize stable versions over pre-releases", () => {
  assert.equal(getVersionPriority("1.40.0"), 0);
  assert.equal(getVersionPriority("1.40.0-beta.1"), 1);
  assert.equal(getVersionPriority("1.40.0-alpha.1"), 2);
  assert.equal(getVersionPriority("1.40.0-next.1"), 3);

  assert.ok(
    getVersionPriority("1.40.0") < getVersionPriority("1.40.0-alpha.1"),
  );
});
