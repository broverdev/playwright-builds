import fs from 'node:fs/promises';

const npmRegistryUrl = "https://registry.npmjs.org/playwright";

interface BrowserInfo {
  v: string;
  rev: string;
}

interface VersionData {
  ver: string;
  browsers: Record<string, string>;
  date: string;
  links: Record<string, any>;
}

async function fetchData(): Promise<void> {
  console.log("🚀 [1/4] Запрашиваю данные из NPM Registry...");
  try {
    const resp = await fetch(npmRegistryUrl);
    const data: any = await resp.json();
    const timeMetadata = data.time;

    const versionKeys = Object.keys(data.versions)
      .filter((v) => !v.includes("-"))
      .reverse();

    const results: VersionData[] = [];
    console.log(`📦 [2/4] Найдено ${versionKeys.length} версий.`);

    for (const [index, ver] of versionKeys.entries()) {
      if (index % 10 === 0 || index < 3) {
        console.log(`   🔹 Обработка v${ver} (${index + 1}/${versionKeys.length})...`);
      }

      const date = timeMetadata[ver] ? timeMetadata[ver].split("T")[0] : "";
      const rawBrowsers: Record<string, BrowserInfo> = {
        chromium: { v: "", rev: "" },
        webkit: { v: "", rev: "" },
        firefox: { v: "", rev: "" },
        ffmpeg: { v: "", rev: "" },
      };

      try {
        const bResp = await fetch(`https://cdn.jsdelivr.net/npm/playwright-core@${ver}/browsers.json`);
        if (bResp.ok) {
          const bData = await bResp.json();
          bData.browsers.forEach((b: any) => {
            if (rawBrowsers[b.name]) {
              rawBrowsers[b.name].v = b.browserVersion || "";
              rawBrowsers[b.name].rev = b.revision || "";
            }
          });
        }
      } catch (e: any) {
        console.error(`   ⚠️ Ошибка v${ver}: ${e.message}`);
      }

      const links = generateLinks(rawBrowsers, ver);

      const formattedBrowsers: Record<string, string> = {};
      for (const key in rawBrowsers) {
        const { v, rev } = rawBrowsers[key];
        formattedBrowsers[key] = v && rev ? `${v} (${rev})` : (rev || v || "");
      }

      results.push({ ver, browsers: formattedBrowsers, date, links });
    }

    console.log("💾 [3/4] Сохраняю playwright_versions.json...");
    await fs.writeFile("playwright_versions.json", JSON.stringify(results, null, 2));

    console.log("📝 [4/4] Обновляю README.md...");
    await updateReadme(results);

    console.log("✅ Готово!");
  } catch (err: any) {
    console.error("❌ Критическая ошибка:", err.message);
    process.exit(1);
  }
}

function generateLinks(browsers: Record<string, BrowserInfo>, playwrightVersion: string): Record<string, any> {
  const urls: Record<string, any> = {};
  const host = "https://cdn.playwright.dev";
  const azurePath = "dbazure/download/playwright";

  const [major, minor] = (playwrightVersion || "0.0").split(".").map(Number);
  const isLegacyPath = major < 1 || (major === 1 && minor < 40);
  const baseUrlPrefix = isLegacyPath ? host : `${host}/${azurePath}`;

  for (const [name, data] of Object.entries(browsers)) {
    if (!data.rev) continue;
    const { rev, v: bVer } = data;
    urls[name] = {};

    const getCftUrl = (path: string) => `${host}/builds/cft/${bVer}/${path}`;
    const getRegUrl = (browser: string, archive: string) => `${baseUrlPrefix}/builds/${browser}/${rev}/${archive}`;

    if (name === "chromium") {
      const chromeMajor = parseInt(bVer.split(".")[0]) || 0;
      if (chromeMajor >= 115) {
        urls[name].win64 = getCftUrl("win64/chrome-win64.zip");
        urls[name].linux = getCftUrl("linux64/chrome-linux64.zip");
        urls[name].mac = getCftUrl("mac-x64/chrome-mac-x64.zip");
        urls[name].mac_arm = getCftUrl("mac-arm64/chrome-mac-arm64.zip");
      } else {
        urls[name].win64 = getRegUrl("chromium", "chromium-win64.zip");
        urls[name].linux = getRegUrl("chromium", "chromium-linux.zip");
        urls[name].mac = getRegUrl("chromium", "chromium-mac.zip");
      }
    } else if (name === "webkit") {
      let macName = minor >= 50 ? "mac" : (minor >= 24 ? "mac-12" : "mac");
      urls[name].win64 = getRegUrl("webkit", "webkit-win64.zip");
      urls[name].linux = getRegUrl("webkit", minor >= 56 ? "webkit-ubuntu-24.04.zip" : "webkit-ubuntu-22.04.zip");
      urls[name].mac = getRegUrl("webkit", `webkit-${macName}.zip`);
    } else if (name === "firefox") {
      urls[name].win64 = getRegUrl("firefox", "firefox-win64.zip");
      urls[name].linux = getRegUrl("firefox", minor >= 50 ? "firefox-ubuntu-24.04.zip" : "firefox-ubuntu-22.04.zip");
      urls[name].mac = getRegUrl("firefox", "firefox-mac.zip");
    }
  }
  return urls;
}

async function updateReadme(results: VersionData[]): Promise<void> {
  const header = "# Playwright Versions History\n\n| PW Ver | Chromium | WebKit | Firefox | Date |\n| :--- | :--- | :--- | :--- | :--- |\n";
  const rows = results.map(r => 
    `| **${r.ver}** | ${r.browsers.chromium} | ${r.browsers.webkit} | ${r.browsers.firefox} | ${r.date} |`
  ).join("\n");
  await fs.writeFile("README.md", header + rows);
}

fetchData();
