import fs from "node:fs/promises";
import path from "node:path";

const JSON_PATH = path.join(process.cwd(), "../playwright_versions.json");
const CONCURRENCY_LIMIT = 50;
const MAX_RETRIES = 5;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function checkUrl(
  url: string,
  attempt = 1,
): Promise<{ ok: boolean; status: string }> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (res.ok) return { ok: true, status: String(res.status) };

    return { ok: false, status: String(res.status) };
  } catch (e) {
    if (attempt <= MAX_RETRIES) {
      await delay(1000 * attempt);
      return checkUrl(url, attempt + 1);
    }
    return { ok: false, status: "FETCH_ERROR" };
  }
}

try {
  const content = await fs.readFile(JSON_PATH, "utf-8");
  const data = JSON.parse(content);

  const urlSet = new Set<string>();
  for (const version of data) {
    for (const browserLinks of Object.values(version.links)) {
      for (const url of Object.values(browserLinks as Record<string, string>)) {
        urlSet.add(url);
      }
    }
  }

  const urls = Array.from(urlSet);
  console.log(`[Total] Found ${urls.length} unique links to verify.`);

  const broken: { url: string; status: string }[] = [];
  let processed = 0;

  for (let i = 0; i < urls.length; i += CONCURRENCY_LIMIT) {
    const chunk = urls.slice(i, i + CONCURRENCY_LIMIT);

    await Promise.all(
      chunk.map(async (url) => {
        const result = await checkUrl(url);
        if (!result.ok) {
          broken.push({ url, status: result.status });
        }
        processed++;
      }),
    );

    if (processed % 500 === 0 || processed >= urls.length) {
      console.log(`Progress: ${processed}/${urls.length}`);
    }
  }

  if (broken.length > 0) {
    console.error(`\nFound ${broken.length} broken links!`);
    broken.forEach((b) => console.error(`[${b.status}] ${b.url}`));
    process.exit(1);
  }

  console.log("\nAll links are valid. CI can proceed to commit.");
} catch (err) {
  console.error("Critical error during validation:", err);
  process.exit(1);
}
