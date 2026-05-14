import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateLinks } from "../lib/generate-links.ts";

describe("Playwright Crawler Logic", () => {
  describe("generateLinks", () => {
    test("should generate Chrome for Testing (CfT) links for Chromium >= 115", () => {
      const mockBrowsers = {
        chromium: { v: "115.0.5790.24", rev: "1067" },
      };
      const links = generateLinks(mockBrowsers);

      assert.ok(
        links.chromium.win64.includes(
          "googlechromelabs.github.io/chrome-for-testing",
        ) || links.chromium.win64.includes("builds/cft"),
        "Should use CfT path",
      );
      assert.ok(
        links.chromium.mac_arm,
        "Should include Apple Silicon build for modern Chrome",
      );
    });

    test("should use legacy paths for older Playwright versions", () => {
      const mockBrowsers = {
        webkit: { v: "15.4", rev: "1000" },
      };

      const links = generateLinks(mockBrowsers);

      assert.ok(
        !links.webkit.win64.includes("dbazure"),
        "Should not use azure path for legacy PW",
      );
      assert.ok(
        links.webkit.win64.includes("cdn.playwright.dev/builds/webkit/1000"),
        "Standard CDN path",
      );
    });

    test("should handle missing revisions gracefully", () => {
      const emptyBrowsers = { chromium: { v: "", rev: "" } };
      const links = generateLinks(emptyBrowsers);
      assert.deepEqual(
        links,
        {},
        "Should return empty object if no revisions found",
      );
    });
  });
});
