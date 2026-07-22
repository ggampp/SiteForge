import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

export const ETHICS_BANNER = `
SiteForge — Legitimate use only.
Clone/rebuild only sites you own or are authorized to analyze.
Not for phishing, brand impersonation, or ToS violations.
`.trim();

function ethicsMarkerPath(): string {
  return path.join(os.homedir(), ".siteforge", "ethics-ack");
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/**
 * Print ethics note once per machine (marker in ~/.siteforge/ethics-ack).
 * Returns true if the banner was printed.
 */
export async function maybePrintEthicsBanner(
  write: (msg: string) => void = console.error,
): Promise<boolean> {
  if (process.env.SITEFORGE_SKIP_ETHICS === "1") return false;
  const marker = ethicsMarkerPath();
  if (await exists(marker)) return false;

  write(ETHICS_BANNER);
  write("");

  try {
    await mkdir(path.dirname(marker), { recursive: true });
    await writeFile(
      marker,
      `ackedAt=${new Date().toISOString()}\nversion=0.1.0\n`,
      "utf8",
    );
  } catch {
    // Non-fatal — still showed the banner
  }
  return true;
}
