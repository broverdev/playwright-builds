import fs from "node:fs/promises";
import { generateLinks } from "./lib/generate-links.ts";
import {
  getVersionPriority,
  isVersionAtLeast,
  normalizeVersion,
} from "./lib/versions.ts";
import { renderTable } from "./lib/render-table.ts";

const NPM_REGISTRY_URL = "https://registry.npmjs.org/playwright";
const CONCURRENCY_LIMIT = 200;
const MIN_VERSION = "0.0.0";

interface BrowserInfo {
  v: string;
  rev: string;
}

export interface VersionData {
  ver: string;
  browsers: Record<string, string>;
  date: string;
  links: Record<string, any>;
  stabilityScore: number;
}

console.log("[1/4] Fetching data from NPM Registry...");
try {
  const resp = await fetch(NPM_REGISTRY_URL);
  const data: any = await resp.json();
  const timeMetadata = data.time;

  const versionKeys = Object.keys(data.versions)
    .filter((ver) => isVersionAtLeast(ver, MIN_VERSION))
    .reverse();

  const results: VersionData[] = [];
  console.log(
    `[2/4] Found ${versionKeys.length} versions (>= ${MIN_VERSION}). Processing...`,
  );

  const processVersion = async (ver: string): Promise<VersionData> => {
    const date = timeMetadata[ver] ? timeMetadata[ver].split("T")[0] : "";
    const rawBrowsers: Record<string, BrowserInfo> = {
      chromium: { v: "", rev: "" },
      webkit: { v: "", rev: "" },
      firefox: { v: "", rev: "" },
    };

    try {
      const bResp = await fetch(
        `https://cdn.jsdelivr.net/npm/playwright-core@${ver}/browsers.json`,
      );

      const setBrowsers = async (bData: any) => {
        for (const b of bData.browsers) {
          if (rawBrowsers[b.name]) {
            rawBrowsers[b.name].v = b.browserVersion || "";
            rawBrowsers[b.name].rev = b.revision || "";

            if (!b.browserVersion) {
              const readmeResp = await fetch(
                `https://cdn.jsdelivr.net/npm/playwright@${ver}/README.md`,
              );

              if (readmeResp.ok) {
                const readme = await readmeResp.text();

                const matches = [
                  ...readme.matchAll(
                    /^\|?\s*(Chromium|WebKit|Firefox)(?:\s+|<!--.*?-->)+([\d.a-z]+)/gm,
                  ),
                ];

                const versionsFromReadme = Object.fromEntries(
                  matches.map(([, name, v]) => [name.toLowerCase(), v.trim()]),
                );

                if (versionsFromReadme[b.name]) {
                  rawBrowsers[b.name].v = versionsFromReadme[b.name];
                }
              }
            }
          }
        }
      };
      if (bResp.ok) {
        const bData = await bResp.json();
        await setBrowsers(bData);
      } else {
        const bResp = await fetch(
          `https://cdn.jsdelivr.net/npm/playwright@${ver}/browsers.json`,
        );
        const bData = await bResp.json();
        await setBrowsers(bData);
      }
    } catch (e) {
      console.log(ver, e);
    }

    const formattedBrowsers: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawBrowsers)) {
      formattedBrowsers[k] =
        v.v && v.rev ? `${v.v} (${v.rev})` : v.rev || v.v || "";
    }

    return {
      ver,
      browsers: formattedBrowsers,
      date,
      links: generateLinks(rawBrowsers, ver),
      stabilityScore: getVersionPriority(ver),
    };
  };

  for (let i = 0; i < versionKeys.length; i += CONCURRENCY_LIMIT) {
    const chunk = versionKeys.slice(i, i + CONCURRENCY_LIMIT);
    const chunkResults = await Promise.all(chunk.map(processVersion));
    results.push(...chunkResults);
    console.log(`Progress: ${results.length}/${versionKeys.length}`);
  }

  await fs.writeFile(
    "../playwright_versions.json",
    JSON.stringify(results, null, 2),
  );
  const baseContent = `# Playwright Builds
  
List of all Playwright builds for Chromium, Firefox, and WebKit on Windows, Linux, and macOS. Updated daily.

  `;

  const engines: Record<string, Map<string, VersionData>> = {
    chromium: new Map(),
    firefox: new Map(),
    webkit: new Map(),
  };

  [...results]
    .sort((a, b) => b.stabilityScore - a.stabilityScore)
    .forEach((r) => {
      ["chromium", "firefox", "webkit"].forEach((e) => {
        const key = r.browsers[e] ? normalizeVersion(r.browsers[e]) : "";
        if (key) {
          engines[e].set(key, r);
        }
      });
    });

  const webkitTable = renderTable(
    "Safari (WebKit)",
    engines.webkit,
    "webkit",
    "https://github.com/alrra/browser-logos/blob/main/src/safari/safari_48x48.png?raw=true",
  );
  const chromiumTable = renderTable(
    "Chrome (Chromium)",
    engines.chromium,
    "chromium",
    "https://github.com/alrra/browser-logos/blob/main/src/chrome/chrome_48x48.png?raw=true",
  );
  const firefoxTable = renderTable(
    "Firefox",
    engines.firefox,
    "firefox",
    "https://github.com/alrra/browser-logos/blob/main/src/firefox/firefox_48x48.png?raw=true",
  );

  const finalContent = `${baseContent}
${webkitTable}
${chromiumTable}
${firefoxTable}`;

  await fs.writeFile("../README.md", finalContent);
  console.log("Successfully finished!");
} catch (err: any) {
  console.error(err.message);
  process.exit(1);
}
