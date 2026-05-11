export function getVersionPriority(ver: string): number {
  if (!ver.includes("-")) return 0;
  if (ver.includes("-beta")) return 1;
  if (ver.includes("-alpha")) return 2;
  return 3;
}

export function normalizeVersion(fullVersion: string): string {
  const match = fullVersion.match(/^([^(]+)/);
  return match ? match[1].trim() : fullVersion;
}

export function isVersionAtLeast(ver: string, minVer: string): boolean {
  const parse = (v: string) => v.split("-")[0].split(".").map(Number);
  const [v1, v2, v3] = parse(ver);
  const [m1, m2, m3] = parse(minVer);

  if (v1 !== m1) return v1 > m1;
  if (v2 !== m2) return v2 > m2;
  return (v3 || 0) >= (m3 || 0);
}
