import type { VersionData } from "../index.ts";
import { normalizeVersion } from "./versions.ts";

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
    .map((k) => {
      const info = data.get(k)!;
      const engineLinks = info.links[engineKey] || {};

      const links = Object.entries(engineLinks)
        .map(([key, url]) => `<a href="${url}" title="${key}">${key}</a>`)
        .join("&nbsp; ");

      const engineVer = normalizeVersion(info.browsers[engineKey]);
      const build = info.browsers[engineKey]
        .replace(/\)/, "")
        .replace(/.*\(/, "");

      return `
    <tr>
      <td><b>${engineVer}</b></td>
      <td>${info.date}</td>
      <td><code>${info.ver}</code></td>
      <td><code>${build}</code></td>
      <td>${links}</td>
    </tr>`;
    })
    .join("");

  return `
## <img src="${icon}" width="24" height="24" alt="" valign="middle"> ${title}

<table>
  <thead>
    <tr>
      <th width="332" align="left">${engineKey.charAt(0).toUpperCase()}${engineKey.slice(1)} version</th>
      <th width="125" align="left">Date&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th>
      <th width="284" align="left">Playwright&nbsp;&nbsp;version&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th>
      <th width="86" align="left">Build&nbsp;&nbsp;&nbsp;&nbsp;</th>
      <th width="185" align="left">Download&nbsp;URL&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</th>
    </tr>
  </thead>
  <tbody>${rows}
  </tbody>
</table>`;
}
