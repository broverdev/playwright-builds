const HOST = "https://cdn.playwright.dev";
const BROKEN_BUILD_URLS = [
  "https://cdn.playwright.dev/builds/webkit/2240/webkit-mac-15.zip",
  "https://cdn.playwright.dev/builds/cft/128.0.6613.27/win64/chrome-win64.zip",
  "https://cdn.playwright.dev/builds/cft/127.0.6533.5/mac-arm64/chrome-mac-arm64.zip",
  "https://cdn.playwright.dev/builds/cft/127.0.6533.5/mac-x64/chrome-mac-x64.zip",
  "https://cdn.playwright.dev/builds/cft/127.0.6533.5/linux64/chrome-linux64.zip",
  "https://cdn.playwright.dev/builds/cft/124.0.6367.18/linux64/chrome-linux64.zip",
  "https://cdn.playwright.dev/builds/cft/119.0.6045.33/mac-x64/chrome-mac-x64.zip",
  "https://cdn.playwright.dev/builds/cft/119.0.6045.33/mac-arm64/chrome-mac-arm64.zip",
  "https://cdn.playwright.dev/builds/cft/119.0.6045.33/win64/chrome-win64.zip",
  "https://cdn.playwright.dev/builds/cft/119.0.6045.33/linux64/chrome-linux64.zip",
  "https://cdn.playwright.dev/builds/cft/118.0.5993.11/mac-arm64/chrome-mac-arm64.zip",
  "https://cdn.playwright.dev/builds/cft/118.0.5993.11/mac-x64/chrome-mac-x64.zip",
  "https://cdn.playwright.dev/builds/cft/118.0.5993.11/linux64/chrome-linux64.zip",
  "https://cdn.playwright.dev/builds/cft/118.0.5993.11/win64/chrome-win64.zip",
  "https://cdn.playwright.dev/builds/cft/115.0.5790.40/mac-x64/chrome-mac-x64.zip",
  "https://cdn.playwright.dev/builds/cft/115.0.5790.40/mac-arm64/chrome-mac-arm64.zip",
  "https://cdn.playwright.dev/builds/cft/115.0.5790.40/win64/chrome-win64.zip",
  "https://cdn.playwright.dev/builds/cft/115.0.5790.40/linux64/chrome-linux64.zip",
  "https://cdn.playwright.dev/builds/cft/115.0.5790.32/mac-arm64/chrome-mac-arm64.zip",
  "https://cdn.playwright.dev/builds/cft/115.0.5790.32/linux64/chrome-linux64.zip",
  "https://cdn.playwright.dev/builds/cft/115.0.5790.32/win64/chrome-win64.zip",
  "https://cdn.playwright.dev/builds/cft/115.0.5790.32/mac-x64/chrome-mac-x64.zip",
];

export function generateLinks(
  browsers: Record<string, { rev?: string; v?: string }>,
) {
  const urls: Record<string, Record<string, string>> = {};

  for (const [name, { rev, v }] of Object.entries(browsers)) {
    if (!rev) continue;

    const r = parseInt(rev, 10) || 0;
    const res: Record<string, string> = {};

    const addUrl = (key: string, url: string) => {
      if (!BROKEN_BUILD_URLS.includes(url)) {
        res[key] = url;
      }
    };

    const buildUrl = (file: string) => `${HOST}/builds/${name}/${rev}/${file}`;

    if (name === "chromium") {
      const chromeMajor = v ? parseInt(v.split(".")[0], 10) : 0;

      if (chromeMajor >= 114) {
        const cft = (platform: string) =>
          `https://cdn.playwright.dev/builds/cft/${v}/${platform}/chrome-${platform}.zip`;

        addUrl("win", cft("win64"));
        addUrl("linux", cft("linux64"));
        addUrl("mac", cft("mac-x64"));
        addUrl("mac_arm", cft("mac-arm64"));
      }

      if (chromeMajor < 114 && r >= 939194) {
        addUrl("linux_arm", buildUrl("chromium-linux-arm64.zip"));
      }
      if (chromeMajor < 114 && r >= 833159) {
        addUrl("mac_arm", buildUrl("chromium-mac-arm64.zip"));
        addUrl("win", buildUrl("chromium-win64.zip"));
      }
      if (chromeMajor < 114 && r >= 799411) {
        addUrl("mac", buildUrl("chromium-mac.zip"));
        addUrl("linux", buildUrl("chromium-linux.zip"));
      }
    }

    if (name === "firefox") {
      addUrl("win", buildUrl("firefox-win64.zip"));

      if (r >= 1490) {
        addUrl("debian_13", buildUrl("firefox-debian-12.zip"));
        addUrl("debian_13_arm", buildUrl("firefox-debian-12-arm64.zip"));
      }
      if (r >= 1449) {
        addUrl("mac", buildUrl("firefox-mac.zip"));
        addUrl("mac_arm", buildUrl("firefox-mac-arm64.zip"));
        addUrl("ubuntu_24", buildUrl("firefox-ubuntu-24.04.zip"));
        addUrl("ubuntu_24_arm", buildUrl("firefox-ubuntu-24.04-arm64.zip"));
      }
      if (r >= 1427 && r <= 1449) {
        addUrl("mac_13", buildUrl("firefox-mac-13.zip"));
        addUrl("mac_13_arm", buildUrl("firefox-mac-13-arm64.zip"));
      }
      if (r >= 1419) {
        addUrl("debian_12", buildUrl("firefox-debian-12.zip"));
        addUrl("debian_12_arm", buildUrl("firefox-debian-12-arm64.zip"));
      }
      if (r >= 1369) {
        addUrl("debian_11_arm", buildUrl("firefox-debian-11-arm64.zip"));
      }
      if (r >= 1344) {
        addUrl("debian_11", buildUrl("firefox-debian-11.zip"));
      }
      if (r >= 1325) {
        addUrl("ubuntu_22", buildUrl("firefox-ubuntu-22.04.zip"));
      }
      if (r >= 1311) {
        addUrl("ubuntu_20", buildUrl("firefox-ubuntu-22.04-arm64.zip"));
      }
      if (r >= 1295 && r <= 1408) {
        addUrl("mac_11", buildUrl("firefox-mac-11.zip"));
        addUrl("mac_11_arm", buildUrl("firefox-mac-11-arm64.zip"));
      }
      if (r >= 1244) {
        addUrl("ubuntu_20", buildUrl("firefox-ubuntu-20.04.zip"));
      }
      if (r >= 1154 && r <= 1365) {
        addUrl("ubuntu_18", buildUrl("firefox-ubuntu-18.04.zip"));
      }
      if (r >= 1016 && r <= 1139) {
        addUrl("mac", buildUrl("firefox-mac.zip"));
      }
    }

    if (name === "webkit") {
      if (r >= 2228) {
        addUrl("debian_12", buildUrl("webkit-debian-12.zip"));
        addUrl("debian_13", buildUrl("webkit-debian-13.zip"));
        addUrl("debian_12_arm", buildUrl("webkit-debian-12-arm64.zip"));
        addUrl("debian_13_arm", buildUrl("webkit-debian-13-arm64.zip"));
      }
      if (r >= 2083) {
        addUrl("mac_15", buildUrl("webkit-mac-15.zip"));
        addUrl("mac_arm", buildUrl("webkit-mac-15-arm64.zip"));
      }
      if (r >= 2008) {
        addUrl("ubuntu_24", buildUrl("webkit-ubuntu-24.04.zip"));
        addUrl("ubuntu_24_arm", buildUrl("webkit-ubuntu-24.04-arm64.zip"));
      }
      if (r >= 1991 && r < 2083) {
        addUrl("mac_14", buildUrl("webkit-mac-14.zip"));
        addUrl("mac_arm", buildUrl("webkit-mac-14-arm64.zip"));
      }
      if (r >= 1860 && r <= 2140) {
        addUrl("mac_13", buildUrl("webkit-mac-13.zip"));
        addUrl("mac_13_arm", buildUrl("webkit-mac-13.zip"));
      }
      if (r >= 1659 && r < 2008) {
        addUrl("ubuntu_22", buildUrl("webkit-ubuntu-22.04.zip"));
        addUrl("ubuntu_22_arm", buildUrl("webkit-ubuntu-22.04-arm64.zip"));
      }
      if (r >= 1588 && r <= 2009) {
        addUrl("mac_12", buildUrl("webkit-mac-12.zip"));
        addUrl("mac_12_arm", buildUrl("webkit-mac-12-arm64.zip"));
      }
      if (r >= 1574 && r < 1659) {
        addUrl("ubuntu_20_arm", buildUrl("webkit-ubuntu-20.04-arm64.zip"));
      }
      if (r >= 1317) {
        addUrl("win", buildUrl("webkit-win64.zip"));
      }
      if (r >= 1317 && r < 1659) {
        addUrl("ubuntu_20", buildUrl("webkit-ubuntu-20.04.zip"));
      }
      if (r >= 1317 && r < 1588) {
        addUrl("mac", buildUrl("webkit-mac-10.15.zip"));
      }
    }

    if (Object.keys(res).length > 0) {
      urls[name] = res;
    }
  }

  return urls;
}
