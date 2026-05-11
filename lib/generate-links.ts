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
          const cft = (os: string, arch: string) =>
            `${host}/builds/cft/${b.v}/${os}-${arch}/chrome-${os}-${arch}.zip`;

          urls[name] = {
            win: cft("win64", "win64"),
            linux: cft("linux64", "linux64"),
            mac: cft("mac", "x64"),
            mac_arm: cft("mac", "arm64"),
          };
        } else {
          urls[name] = {
            win: getRegUrl("chromium", "chromium-win64.zip"),
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
          win: getRegUrl("webkit", "webkit-win64.zip"),
          linux: getRegUrl("webkit", linuxArchive),
          mac: getRegUrl("webkit", `webkit-${macName}.zip`),
          mac_arm: getRegUrl("webkit", `webkit-mac-11-arm64.zip`),
        };
        break;
      }

      case "firefox": {
        const linuxArchive =
          minor >= 50 ? "firefox-ubuntu-24.04.zip" : "firefox-ubuntu-22.04.zip";

        urls[name] = {
          win: getRegUrl("firefox", "firefox-win64.zip"),
          linux: getRegUrl("firefox", linuxArchive),
          mac: getRegUrl("firefox", "firefox-mac.zip"),
          mac_arm: getRegUrl("firefox", "firefox-mac-11-arm64.zip"),
        };
        break;
      }
    }
  }

  return urls;
}
