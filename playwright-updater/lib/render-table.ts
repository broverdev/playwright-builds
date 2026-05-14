import type { VersionData } from "../types/browser-versions.ts";
import { normalizeVersion } from "./versions.ts";

const PLATFORM_LABELS: Record<string, string> = {
  win: "Windows",
  mac: "Mac",
  mac_arm: "Mac ARM",
  mac_15: "Mac 15",
  mac_14: "Mac 14",
  mac_13: "Mac 13",
  mac_13_arm: "Mac 13 ARM",
  mac_12: "Mac 12",
  mac_12_arm: "Mac 12 ARM",
  mac_11: "Mac 11",
  mac_11_arm: "Mac 11 ARM",
  linux: "Linux",
  linux_arm: "Linux ARM",
  ubuntu_24: "Ubuntu 24",
  ubuntu_24_arm: "Ubuntu 24 ARM",
  ubuntu_22: "Ubuntu 22",
  ubuntu_22_arm: "Ubuntu 22 ARM",
  ubuntu_20: "Ubuntu 20",
  ubuntu_18: "Ubuntu 18",
  debian_13: "Debian 13",
  debian_13_arm: "Debian 13 ARM",
  debian_12: "Debian 12",
  debian_12_arm: "Debian 12 ARM",
  debian_11: "Debian 11",
  debian_11_arm: "Debian 11 ARM",
};

const PLATFORM_ORDER = Object.keys(PLATFORM_LABELS);

function renderNpmBadge(fullVersion: string): string {
  const parts = fullVersion.split("-");
  const isStable = parts.length === 1;
  let cleanVer = parts[0];
  if (!isStable) {
    const suffix = parts[1].split(".")[0];
    cleanVer = `${parts[0]}-${suffix}`;
  }
  const badgeText = cleanVer.replace(/-/g, "--");
  const badgeUrl = `https://img.shields.io/badge/${badgeText}-lightgrey.svg?style=flat-square`;
  const npmLink = `https://www.npmjs.com/package/playwright/v/${fullVersion}`;

  return `<a href="${npmLink}" target="_blank"><img valign="text-top" src="${badgeUrl}" title="${fullVersion}" alt="${fullVersion}"></a>`;
}

function renderDownloadLinks(engineLinks: Record<string, string>): string {
  return Object.entries(engineLinks)
    .sort(([a], [b]) => {
      const idxA = PLATFORM_ORDER.indexOf(a);
      const idxB = PLATFORM_ORDER.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return -1;
      return idxA - idxB;
    })
    .map(([key, url]) => {
      const label = PLATFORM_LABELS[key] || key;
      return `<a href="${url}"><code>${label.replace(/ /g, "&nbsp;")}</code></a>`;
    })
    .join(" ");
}

export function renderTable(
  title: string,
  data: Map<string, VersionData>,
  engineKey: string,
  icon: string,
) {
  const sortedKeys = Array.from(data.keys()).sort((a, b) =>
    b.localeCompare(a, undefined, { numeric: true }),
  );

  const rows = sortedKeys
    .filter((k) => {
      const info = data.get(k)!;
      return Object.keys(info.links[engineKey] || {}).length > 0;
    })
    .map((k) => {
      const info = data.get(k)!;
      const engineLinks = info.links[engineKey] || {};

      const engineVer = normalizeVersion(info.browsers[engineKey]);
      const build = info.browsers[engineKey]
        .replace(/.*\(/, "")
        .replace(/\)/, "");

      return `
    <tr>
      <td><code><img src="${icon}" width="12" height="12" alt="" />&nbsp;${engineVer}</code></td>
      <td>${info.date}</td>
      <td align="center">${build}</td>
      <td>${renderNpmBadge(info.ver)}</td>
      <td>${renderDownloadLinks(engineLinks)}</td>
    </tr>`;
    })
    .join("");

  return `
## ${title}

<table>
  <thead>
    <tr>
      <th width="202" align="left">Browser&nbsp;version&nbsp;</th>
      <th width="120" align="left">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th>
      <th width="85" align="center">&nbsp;&nbsp;Build&nbsp;&nbsp;</th>
      <th width="105" align="left">Playwright</th>
      <th width="540" align="left">Download&nbsp;URL&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th>
    </tr>
  </thead>
  <tbody>${rows}
  </tbody>
</table>`;
}
