import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getVersionPriority,
  keepLatestPatch,
  normalizeVersion,
} from "../lib/versions.ts";

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

test("normalizeVersion: should cut the version to N parts", () => {
  assert.equal(normalizeVersion("141.0.7390.37 (1194)", 3), "141.0.7390");
  assert.equal(normalizeVersion("81.0.4044", 3), "81.0.4044");
});

test("keepLatestPatch: keeps only the latest patch per build", () => {
  const map = new Map([
    ["141.0.7390.7", "1.56.0-alpha-2025-09-11"],
    ["141.0.7390.16", "1.56.0-alpha-2025-09-26"],
    ["141.0.7390.37", "1.57.0-alpha-2025-10-31"],
    ["140.0.7339.5", "1.55.0-alpha-2025-08-14"],
    ["140.0.7339.186", "1.55.1"],
    ["81.0.4044", "0.11.0"],
  ]);

  assert.deepEqual([...keepLatestPatch(map).keys()], [
    "141.0.7390.37",
    "140.0.7339.186",
    "81.0.4044",
  ]);
});
