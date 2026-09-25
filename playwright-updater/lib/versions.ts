export function getVersionPriority(ver: string): number {
  if (!ver.includes("-")) return 0;
  if (ver.includes("-beta")) return 1;
  if (ver.includes("-alpha")) return 2;
  return 3;
}

export function normalizeVersion(fullVersion: string, parts?: number): string {
  const match = fullVersion.match(/^([^(]+)/);
  const version = match ? match[1].trim() : fullVersion;
  const split = version.split(".");
  if (parts && split.length > parts) return split.slice(0, parts).join(".");
  return version;
}

export function keepLatestPatch<T>(map: Map<string, T>): Map<string, T> {
  const latest = new Map<string, string>();
  for (const key of map.keys()) {
    const build = normalizeVersion(key, 3);
    const current = latest.get(build);
    const isLatest =
      !current ||
      key.localeCompare(current, undefined, { numeric: true }) > 0;
    if (isLatest) latest.set(build, key);
  }
  return new Map(
    [...map].filter(([key]) => latest.get(normalizeVersion(key, 3)) === key),
  );
}

export function isVersionAtLeast(ver: string, minVer: string): boolean {
  const parse = (v: string) => v.split("-")[0].split(".").map(Number);
  const [v1, v2, v3] = parse(ver);
  const [m1, m2, m3] = parse(minVer);

  if (v1 !== m1) return v1 > m1;
  if (v2 !== m2) return v2 > m2;
  return (v3 || 0) >= (m3 || 0);
}
