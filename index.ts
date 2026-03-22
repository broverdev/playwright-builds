import fs from "node:fs/promises";
import { generateLinks } from "./lib/generate-links.ts";
import { getVersionPriority } from "./lib/get-version-priority.ts";
import { normalizeVersion } from "./lib/normalize-version.ts";

const NPM_REGISTRY_URL = "https://registry.npmjs.org/playwright";
const CONCURRENCY_LIMIT = 200;
const MIN_VERSION = "0.0.0";

interface BrowserInfo {
  v: string;
  rev: string;
}
interface VersionData {
  ver: string;
  browsers: Record<string, string>;
  date: string;
  links: Record<string, any>;
  stabilityScore: number;
}

function isVersionAtLeast(ver: string, minVer: string): boolean {
  const parse = (v: string) => v.split("-")[0].split(".").map(Number);
  const [v1, v2, v3] = parse(ver);
  const [m1, m2, m3] = parse(minVer);

  if (v1 !== m1) return v1 > m1;
  if (v2 !== m2) return v2 > m2;
  return (v3 || 0) >= (m3 || 0);
}

async function fetchData(): Promise<void> {
  console.log("🚀 [1/4] Fetching data from NPM Registry...");
  try {
    const resp = await fetch(NPM_REGISTRY_URL);
    const data: any = await resp.json();
    const timeMetadata = data.time;

    const versionKeys = Object.keys(data.versions)
      .filter((ver) => isVersionAtLeast(ver, MIN_VERSION))
      .reverse();

    const results: VersionData[] = [];
    console.log(
      `📦 [2/4] Found ${versionKeys.length} versions (>= ${MIN_VERSION}). Processing...`,
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
                    matches.map(([, name, v]) => [
                      name.toLowerCase(),
                      v.trim(),
                    ]),
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
      console.log(`    ⚡ Progress: ${results.length}/${versionKeys.length}`);
    }

    await fs.writeFile(
      "playwright_versions.json",
      JSON.stringify(results, null, 2),
    );
    await updateReadme(results);
    console.log("✅ Successfully finished!");
  } catch (err: any) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

async function updateReadme(results: VersionData[]) {
  const ARCHIVE_MARKER = "## Browser Archives";
  let readme = "";

  try {
    readme = await fs.readFile("README.md", "utf-8");
  } catch {
    readme = "# Playwright Browser Archive\n\n" + ARCHIVE_MARKER;
  }

  const markerPos = readme.indexOf(ARCHIVE_MARKER);
  const baseContent =
    markerPos !== -1 ? readme.slice(0, markerPos).trim() : readme.trim();

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

  const renderTable = (
    title: string,
    data: Map<string, VersionData>,
    engineKey: string,
  ) => {
    let t = `\n### ${title}\n\n`;
    t += `| Browser version | Date | Playwright version | Download links |\n`;
    t += `| :--- | :--- | :--- | :--- |\n`;

    const sortedKeys = Array.from(data.keys()).sort((a, b) =>
      b.localeCompare(a, undefined, { numeric: true }),
    );

    sortedKeys.slice(0, 500).forEach((k) => {
      const info = data.get(k)!;
      const labels: Record<string, string> = {
        win64: "win",
        linux: "linux",
        mac: "mac",
        mac_arm: "arm64",
      };

      const links = info.links[engineKey]
        ? Object.entries(info.links[engineKey])
            .map(([p, u]) => `[${labels[p] || p}](${u})`)
            .join(" ")
        : "-";

      t += `| **${info.browsers[engineKey]}** | \`${info.date}\` | ${info.ver} | ${links} |\n`;
    });

    return t;
  };

  let archiveContent = `\n\n${ARCHIVE_MARKER}\n`;
  archiveContent += renderTable(
    "Chromium Builds",
    engines.chromium,
    "chromium",
  );
  archiveContent += renderTable("Firefox Builds", engines.firefox, "firefox");
  archiveContent += renderTable("WebKit Builds", engines.webkit, "webkit");

  await fs.writeFile("README.md", baseContent + "\n" + archiveContent);
}

fetchData();
