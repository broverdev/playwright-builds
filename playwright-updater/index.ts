import fs from "node:fs/promises";
import { generateLinks } from "./lib/generate-links.ts";
import {
  getVersionPriority,
  isVersionAtLeast,
  normalizeVersion,
} from "./lib/versions.ts";
import { renderTable } from "./lib/render-table.ts";
import type { VersionData, BrowserInfo } from "./types/browser-versions.ts";

const BROWSERS = ["chromium", "webkit", "firefox"] as const;
const MIN_PLAYWRIGHT_VERSION = "0.9.18"; // Ignore old PW versions without browser versions in README.md
const NPM_REGISTRY_URL = "https://registry.npmjs.org/playwright";
const CONCURRENCY_LIMIT = 200;

type BrowserName = (typeof BROWSERS)[number];

console.log("[1/4] Fetching NPM Registry data...");
const registry = await fetchJson<any>(NPM_REGISTRY_URL);
if (!registry) throw new Error("Failed to fetch registry");

const versions = Object.keys(registry.versions)
  .filter((v) => isVersionAtLeast(v, MIN_PLAYWRIGHT_VERSION))
  .reverse();

console.log(`[2/4] Found ${versions.length} versions. Processing...`);
const PWVersionsData: VersionData[] = [];

for (let i = 0; i < versions.length; i += CONCURRENCY_LIMIT) {
  const chunk = versions.slice(i, i + CONCURRENCY_LIMIT);
  const chunkResults = await Promise.all(
    chunk.map((v) => processVersion(v, registry.time[v])),
  );
  PWVersionsData.push(...chunkResults);
  console.log(`Progress: ${PWVersionsData.length}/${versions.length}`);
}

const jsonOutput = PWVersionsData.map(({ stabilityScore, ...rest }) => rest);

await fs.writeFile(
  "../playwright-builds.json",
  JSON.stringify(jsonOutput, null, 2),
);

const engines: Record<BrowserName, Map<string, VersionData>> = {
  chromium: new Map(),
  firefox: new Map(),
  webkit: new Map(),
};

[...PWVersionsData]
  .sort((a, b) => b.stabilityScore - a.stabilityScore)
  .forEach((r) => {
    BROWSERS.forEach((e) => {
      const key = r.browsers[e] ? normalizeVersion(r.browsers[e]) : "";
      if (key) engines[e].set(key, r);
    });
  });

const baseContent = `# Playwright Builds

Auto-updated list of Chromium, Firefox, and Safari (WebKit) binaries for all Playwright versions on Windows, Linux, and macOS.

**[playwright-builds.json](https://raw.githubusercontent.com/broverdev/playwright-builds/refs/heads/main/playwright-builds.json)**

---
`;

const tables = [
  renderTable(
    "Safari (WebKit)",
    engines.webkit,
    "webkit",
    "https://github.com/alrra/browser-logos/blob/main/src/safari/safari_24x24.png?raw=true",
  ),
  renderTable(
    "Chrome (Chromium)",
    engines.chromium,
    "chromium",
    "https://github.com/alrra/browser-logos/blob/main/src/chrome/chrome_24x24.png?raw=true",
  ),
  renderTable(
    "Firefox",
    engines.firefox,
    "firefox",
    "https://github.com/alrra/browser-logos/blob/main/src/firefox/firefox_24x24.png?raw=true",
  ),
].join("\n");

await fs.writeFile("../README.md", baseContent + tables);
console.log("Successfully finished!");

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url);
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

async function getBrowserMetadata(ver: string) {
  const raw: Record<BrowserName, BrowserInfo> = {
    chromium: { v: "", rev: "" },
    webkit: { v: "", rev: "" },
    firefox: { v: "", rev: "" },
  };

  const bData =
    (await fetchJson<any>(
      `https://cdn.jsdelivr.net/npm/playwright@${ver}/browsers.json`,
    )) ||
    (await fetchJson<any>(
      `https://cdn.jsdelivr.net/npm/playwright-core@${ver}/browsers.json`,
    ));

  if (bData?.browsers) {
    for (const b of bData.browsers) {
      const name = b.name as BrowserName;
      if (raw[name]) {
        raw[name].rev = String(b.revision || "");
        raw[name].v = b.browserVersion || "";
      }
    }
    return raw;
  }

  const pData =
    (await fetchJson<any>(
      `https://cdn.jsdelivr.net/npm/playwright-core@${ver}/package.json`,
    )) ||
    (await fetchJson<any>(
      `https://cdn.jsdelivr.net/npm/playwright@${ver}/package.json`,
    ));

  if (pData?.playwright) {
    raw.chromium.rev = String(pData.playwright.chromium_revision || "");
    raw.firefox.rev = String(pData.playwright.firefox_revision || "");
    raw.webkit.rev = String(pData.playwright.webkit_revision || "");
  }

  return raw;
}

async function extractReadmeBadgeVersion(
  ver: string,
  raw: Record<BrowserName, BrowserInfo>,
) {
  let resp = await fetch(
    `https://cdn.jsdelivr.net/npm/playwright@${ver}/README.md`,
  );
  if (!resp.ok) {
    resp = await fetch(
      `https://cdn.jsdelivr.net/npm/playwright-core@${ver}/README.md`,
    );
  }

  if (!resp.ok) return;

  const text = await resp.text();

  const badgeRegex =
    /img\.shields\.io\/badge\/(chromium|webkit|firefox)(?:-version)?-([^/-]+)[-.](?:blue|lightgrey|brightgreen|success|informational)/gi;
  for (const match of text.matchAll(badgeRegex)) {
    const name = match[1].toLowerCase() as BrowserName;
    const version = match[2].trim();
    updateVersionIfBetter(raw, name, version);
  }

  const genRegex =
    /<!-- GEN:(chromium|webkit|firefox)-version -->([^<]+)<!-- GEN:stop -->/gi;
  for (const match of text.matchAll(genRegex)) {
    const name = match[1].toLowerCase() as BrowserName;
    const version = match[2].trim();
    updateVersionIfBetter(raw, name, version);
  }

  const tableRegex =
    /\|\s*(Chromium|WebKit|Firefox)\s*\|\s*(?:<!--[^>]*-->)?\s*([^|]*?)\s*\|/gi;
  for (const match of text.matchAll(tableRegex)) {
    const name = match[1].toLowerCase() as BrowserName;
    const version = match[2].trim();
    updateVersionIfBetter(raw, name, version);
  }
}

function updateVersionIfBetter(
  raw: Record<string, BrowserInfo>,
  name: BrowserName,
  newV: string,
) {
  if (!raw[name]) return;

  const cleanV = newV
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, "")
    .replace(/[\s|]/g, "")
    .trim();

  if (!cleanV || cleanV === "ver") return;

  const isFullVersion = cleanV.includes(".");
  const isCurrentFull = raw[name].v.includes(".");

  if (
    !raw[name].v ||
    (isFullVersion && !isCurrentFull) ||
    cleanV.length > raw[name].v.length
  ) {
    raw[name].v = cleanV;
  }
}

async function processVersion(
  ver: string,
  dateStr: string,
): Promise<VersionData> {
  const date = dateStr.split("T")[0];
  const raw = await getBrowserMetadata(ver);

  await extractReadmeBadgeVersion(ver, raw);

  const formattedBrowsers: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const parts = [];
    if (v.v) parts.push(v.v);
    if (v.rev) parts.push(v.v ? `(${v.rev})` : v.rev);
    formattedBrowsers[k] = parts.join(" ").trim();
  }

  return {
    ver,
    browsers: formattedBrowsers,
    date,
    links: generateLinks(raw),
    stabilityScore: getVersionPriority(ver),
  };
}
