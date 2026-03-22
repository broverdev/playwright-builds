export function normalizeVersion(fullVersion: string): string {
  const match = fullVersion.match(/^([^(]+)/);
  return match ? match[1].trim() : fullVersion;
}
