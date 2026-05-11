export function generateLinks(browsers: any, playwrightVersion: string) {
  const host = "https://cdn.playwright.dev";
  const azurePath = "dbazure/download/playwright";
  const [major, minor] = (playwrightVersion || "0.0").split(".").map(Number);

  const baseUrlPrefix =
    major < 1 || (major === 1 && minor < 40) ? host : `${host}/${azurePath}`;

  const urls: any = {};

  for (const [name, data] of Object.entries(browsers)) {
    const b = data as any;
    if (!b.rev) continue;

    const getRegUrl = (browser: string, archive: string) =>
      `${baseUrlPrefix}/builds/${browser}/${b.rev}/${archive}`;

    switch (name) {
      case "chromium": {
        const chromeMajor = parseInt(b.v?.split(".")[0]) || 0;

        if (chromeMajor >= 115) {
          urls[name] = {
            win64: `${host}/builds/cft/${b.v}/win64/chrome-win64.zip`,
            linux: `${host}/builds/cft/${b.v}/linux64/chrome-linux64.zip`,
            mac: `${host}/builds/cft/${b.v}/mac-x64/chrome-mac-x64.zip`,
            mac_arm: `${host}/builds/cft/${b.v}/mac-arm64/chrome-mac-arm64.zip`,
          };
        } else {
          urls[name] = {
            win64: getRegUrl("chromium", "chromium-win64.zip"),
            linux: getRegUrl("chromium", "chromium-linux.zip"),
            mac: getRegUrl("chromium", "chromium-mac.zip"),
          };
        }
        break;
      }

      case "webkit": {
        const macName = minor >= 50 ? "mac" : minor >= 24 ? "mac-12" : "mac";
        const linuxArchive =
          minor >= 56 ? "webkit-ubuntu-24.04.zip" : "webkit-ubuntu-22.04.zip";

        urls[name] = {
          win64: getRegUrl("webkit", "webkit-win64.zip"),
          linux: getRegUrl("webkit", linuxArchive),
          mac: getRegUrl("webkit", `webkit-${macName}.zip`),
        };
        break;
      }

      case "firefox": {
        const linuxArchive =
          minor >= 50 ? "firefox-ubuntu-24.04.zip" : "firefox-ubuntu-22.04.zip";

        urls[name] = {
          win64: getRegUrl("firefox", "firefox-win64.zip"),
          linux: getRegUrl("firefox", linuxArchive),
          mac: getRegUrl("firefox", "firefox-mac.zip"),
        };
        break;
      }

      default:
        break;
    }
  }

  return urls;
}
