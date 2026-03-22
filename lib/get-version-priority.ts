export function getVersionPriority(ver: string): number {
  if (!ver.includes("-")) return 0; // Stable
  if (ver.includes("-beta")) return 1;
  if (ver.includes("-alpha")) return 2;
  return 3;
}
