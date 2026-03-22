import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { getVersionPriority } from "../lib/get-version-priority.ts";

test("getStabilityScore: should prioritize stable versions over pre-releases", () => {
  assert.equal(getVersionPriority("1.40.0"), 0);
  assert.equal(getVersionPriority("1.40.0-beta.1"), 1);
  assert.equal(getVersionPriority("1.40.0-alpha.1"), 2);
  assert.equal(getVersionPriority("1.40.0-next.1"), 3);

  assert.ok(
    getVersionPriority("1.40.0") < getVersionPriority("1.40.0-alpha.1"),
  );
});
