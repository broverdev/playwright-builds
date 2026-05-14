import { isVersionAtLeast } from "./versions.ts";

export function generateLinks(
  browsers: Record<string, { rev?: string; v?: string }>,
  version: string,
) {
  const base = isVersionAtLeast(version, "1.40")
    ? "https://cdn.playwright.dev/dbazure/download/playwright"
    : "https://cdn.playwright.dev";

  const urls: Record<string, Record<string, string>> = {};

  for (const [name, { rev, v }] of Object.entries(browsers)) {
    if (!rev) {
      continue;
    }

    const r = parseInt(rev, 10) || 0;
    const buildUrl = (file: string) => `${base}/builds/${name}/${rev}/${file}`;
    const res: Record<string, string> = {};

    if (name === "chromium") {
      const chromeMajor = v ? parseInt(v?.split(".")[0]) : 0;
      if (chromeMajor >= 115) {
        const cft = (platform: string) =>
          `https://cdn.playwright.dev/builds/cft/${v}/${platform}/chrome-${platform}.zip`;

        res.win = cft("win64");
        res.linux = cft("linux64");
        res.mac = cft("mac-x64");
        res.mac_arm = cft("mac-arm64");
      } else {
        res.win = buildUrl("chromium-win64.zip");
        res.mac = buildUrl("chromium-mac.zip");
        res.linux = buildUrl("chromium-linux.zip");

        if (r >= 833159) {
          res.mac_arm = buildUrl("chromium-mac-arm64.zip");
        }
        if (r >= 939194) {
          res.linux_arm = buildUrl("chromium-linux-arm64.zip");
        }
      }
    }

    if (name === "firefox") {
      res.win = buildUrl("firefox-win64.zip");
      res.mac = buildUrl("firefox-mac.zip");

      if (r >= 1449) {
        res.mac_arm = buildUrl("firefox-mac-arm64.zip");
        res.ubuntu_24 = buildUrl("firefox-ubuntu-24.04.zip");
        res.ubuntu_24_arm = buildUrl("firefox-ubuntu-24.04-arm64.zip");
      }
      if (r >= 1325) {
        res.ubuntu_22 = buildUrl("firefox-ubuntu-22.04.zip");
      }
      if (r >= 1244) {
        res.ubuntu_20 = buildUrl("firefox-ubuntu-20.04.zip");
      } else {
        res.ubuntu_18 = buildUrl("firefox-ubuntu-18.04.zip");
      }
      if (r >= 1500) {
        res.debian_11 = buildUrl("firefox-debian-11.zip");
        res.debian_12 = buildUrl("firefox-debian-12.zip");
      }
      if (r >= 1412) {
        res.mac_13 = buildUrl("firefox-mac-13.zip");
      }
    }

    if (name === "webkit") {
      res.win = buildUrl("webkit-win64.zip");

      if (r >= 2008) {
        res.ubuntu_24 = buildUrl("webkit-ubuntu-24.04.zip");
        res.linux_arm = buildUrl("webkit-ubuntu-24.04-arm64.zip");
      } else if (r >= 1659) {
        res.ubuntu_22 = buildUrl("webkit-ubuntu-22.04.zip");
        res.linux_arm = buildUrl("webkit-ubuntu-22.04-arm64.zip");
      } else if (r >= 1317) {
        res.ubuntu_20 = buildUrl("webkit-ubuntu-20.04.zip");
        if (r >= 1574) {
          res.linux_arm = buildUrl("webkit-ubuntu-20.04-arm64.zip");
        }
      } else {
        res.ubuntu_18 = buildUrl("webkit-ubuntu-18.04.zip");
      }

      if (r >= 2228) {
        res.debian_12 = buildUrl("webkit-debian-12.zip");
        res.debian_13 = buildUrl("webkit-debian-13.zip");
        res.debian_12_arm = buildUrl("webkit-debian-12-arm64.zip");
        res.debian_13_arm = buildUrl("webkit-debian-13-arm64.zip");
      }

      if (r >= 2083) {
        res.mac_15 = buildUrl("webkit-mac-15.zip");
        res.mac_arm = buildUrl("webkit-mac-15-arm64.zip");
      } else if (r >= 1991) {
        res.mac_14 = buildUrl("webkit-mac-14.zip");
        res.mac_arm = buildUrl("webkit-mac-14-arm64.zip");
      } else if (r >= 1860) {
        res.mac_13 = buildUrl("webkit-mac-13.zip");
      } else if (r >= 1588) {
        res.mac_12 = buildUrl("webkit-mac-12.zip");
        res.mac_arm = buildUrl("webkit-mac-12-arm64.zip");
      } else {
        res.mac = buildUrl("webkit-mac-10.15.zip");
      }
    }

    urls[name] = res;
  }

  return urls;
}
