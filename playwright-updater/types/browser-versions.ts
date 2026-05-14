export interface VersionData {
  ver: string;
  browsers: Record<string, string>;
  date: string;
  links: Record<string, any>;
  stabilityScore: number;
}

export interface BrowserInfo {
  v: string;
  rev: string;
}
