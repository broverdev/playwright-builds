import fs from "node:fs/promises";
import { generateLinks } from "./lib/generate-links.ts";
import { getVersionPriority } from "./lib/get-version-priority.ts";
import { normalizeVersion } from "./lib/normalize-version.ts";

const NPM_REGISTRY_URL = "https://registry.npmjs.org/playwright";
const CONCURRENCY_LIMIT = 100;

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

async function fetchData(): Promise<void> {
  console.log("🚀 [1/4] Fetching data from NPM Registry...");
  try {
    const resp = await fetch(NPM_REGISTRY_URL);
    const data: any = await resp.json();
    const timeMetadata = data.time;
    const versionKeys = Object.keys(data.versions).reverse();

    const results: VersionData[] = [];
    console.log(`📦 [2/4] Found ${versionKeys.length} versions. Processing...`);

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
        if (bResp.ok) {
          const bData = await bResp.json();
          bData.browsers.forEach((b: any) => {
            if (rawBrowsers[b.name]) {
              rawBrowsers[b.name].v = b.browserVersion || "";
              rawBrowsers[b.name].rev = b.revision || "";
            }
          });
        }
      } catch (e) {}

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
      results.push(...(await Promise.all(chunk.map(processVersion))));
      console.log(
        `   ⚡ Progress: ${Math.min(i + CONCURRENCY_LIMIT, versionKeys.length)}/${versionKeys.length}`,
      );
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
  const defaultTemplate = `# Playwright Browser Archive

|          | Linux | macOS | Windows |
|   :---   | :---: | :---: | :---:   |
| Chromium ...| :white_check_mark: | :white_check_mark: | :white_check_mark: |
| WebKit ...| :white_check_mark: | :white_check_mark: | :white_check_mark: |
| Firefox ...| :white_check_mark: | :white_check_mark: | :white_check_mark: |

`;

  let readme: string;
  try {
    readme = await fs.readFile("README.md", "utf-8");
  } catch {
    console.log("⚠️ README.md not found, creating from template...");
    readme = defaultTemplate;
  }

  const latestStable =
    results.find((r) => r.stabilityScore === 0) || results[0];

  const replaceMarker = (engine: string, version: string) => {
    const regex = new RegExp(`()(.*?)()`, "g");
    if (regex.test(readme)) {
      readme = readme.replace(regex, `$1${version}$3`);
    }
  };

  replaceMarker("chromium", latestStable.browsers.chromium);
  replaceMarker("webkit", latestStable.browsers.webkit);
  replaceMarker("firefox", latestStable.browsers.firefox);

  const engines: any = {
    chromium: new Map(),
    firefox: new Map(),
    webkit: new Map(),
  };
  [...results]
    .sort((a, b) => a.stabilityScore - b.stabilityScore)
    .forEach((r) => {
      ["chromium", "firefox", "webkit"].forEach((e) => {
        const key = r.browsers[e] ? normalizeVersion(r.browsers[e]) : "";
        if (key && !engines[e].has(key)) engines[e].set(key, r);
      });
    });

  const renderTable = (title: string, data: Map<string, any>, e: string) => {
    let t = `\n### ${title}\n| Version | Primary PW | Downloads |\n| :--- | :--- | :--- |\n`;
    Array.from(data.keys())
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
      .forEach((k) => {
        const info = data.get(k);
        const labels: any = {
          win64: "Win",
          linux: "Lin",
          mac: "Mac",
          mac_arm: "ARM",
        };
        const links = info.links[e]
          ? Object.entries(info.links[e])
              .map(([p, u]) => `[${labels[p] || p}](${u})`)
              .join(" ")
          : "-";
        t += `| **${info.browsers[e]}** | ${info.ver} | ${links} |\n`;
      });
    return t;
  };

  const separator = "";
  const parts = readme.split(separator);
  const baseContent = parts[0].trim();

  let archiveContent = `\n\n${separator}\n\n## Browser Archives\n`;
  archiveContent += renderTable(
    "Chromium Builds",
    engines.chromium,
    "chromium",
  );
  archiveContent += renderTable("Firefox Builds", engines.firefox, "firefox");
  archiveContent += renderTable("WebKit Builds", engines.webkit, "webkit");
  await fs.writeFile("README.md", baseContent + archiveContent);
}

fetchData();
