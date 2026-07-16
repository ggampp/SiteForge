#!/usr/bin/env node
/**
 * Copy SiteForge SKILL.md into common agent skill directories (best-effort).
 */
import { copyFile, mkdir, access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillSrc = path.resolve(__dirname, "../SKILL.md");
const home = os.homedir();

const targets = [
  {
    name: "claude",
    dir: path.join(home, ".claude", "skills", "siteforge"),
  },
  {
    name: "cursor",
    dir: path.join(home, ".cursor", "skills", "siteforge"),
  },
  {
    name: "codex",
    dir: path.join(home, ".codex", "skills", "siteforge"),
  },
  {
    name: "grok",
    dir: path.join(home, ".grok", "skills", "siteforge"),
  },
];

const content = await readFile(skillSrc, "utf8");
const results = [];

for (const t of targets) {
  try {
    await mkdir(t.dir, { recursive: true });
    const dest = path.join(t.dir, "SKILL.md");
    await writeFile(dest, content, "utf8");
    results.push({ host: t.name, ok: true, path: dest });
  } catch (err) {
    results.push({
      host: t.name,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

// Also ensure package-local copy is the source of truth
try {
  await access(skillSrc);
  results.push({ host: "package", ok: true, path: skillSrc });
} catch {
  results.push({ host: "package", ok: false, error: "missing SKILL.md" });
}

console.log(JSON.stringify({ ok: results.every((r) => r.ok || r.host === "grok"), results }, null, 2));
