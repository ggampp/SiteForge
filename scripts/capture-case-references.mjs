#!/usr/bin/env node
/**
 * Capture before/after reference screenshots for example clones.
 * - before: live original URL (best-effort; skip on failure)
 * - after: local clone index.html via file://
 * Writes examples/clones/<slug>/_reference/{before,after,diff}.png + scores.json
 */
import { mkdir, writeFile, access, copyFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { visualDiff } from "../packages/core/dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(
  path.resolve(__dirname, "../packages/core/package.json"),
);
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const clonesRoot = path.join(root, "examples", "clones");

const CLONES = [
  {
    slug: "soudobem-site",
    url: "https://soudobemsite.testecliente.com.br/",
  },
  {
    slug: "app-soudobem",
    url: "https://appsoudobem.testecliente.com.br/",
  },
  {
    slug: "tachyonix",
    url: "https://www.tachyonix.io/",
  },
  {
    slug: "tachyonix-hub",
    url: "https://www.tachyonix.io/hub/?id=inicio",
  },
];

async function exists(p) {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

const browser = await chromium.launch({ headless: true });
const report = [];

try {
  for (const clone of CLONES) {
    const cloneDir = path.join(clonesRoot, clone.slug);
    const indexHtml = path.join(cloneDir, "index.html");
    if (!(await exists(indexHtml))) {
      report.push({ slug: clone.slug, ok: false, error: "missing index.html" });
      continue;
    }
    const refDir = path.join(cloneDir, "_reference");
    await mkdir(refDir, { recursive: true });
    const page = await browser.newPage({
      viewport: { width: 1440, height: 900 },
    });

    const afterPath = path.join(refDir, "after.png");
    await page.goto(`file://${indexHtml.replace(/\\/g, "/")}`, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: afterPath, fullPage: false, type: "png" });

    let beforePath = path.join(refDir, "before.png");
    let beforeOk = false;
    try {
      await page.goto(clone.url, {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: beforePath, fullPage: false, type: "png" });
      beforeOk = true;
    } catch (err) {
      // Fallback: duplicate after as before so case study still has a pair
      beforePath = path.join(refDir, "before-unavailable.png");
      await writeFile(
        path.join(refDir, "BEFORE_NOTE.txt"),
        `Live capture failed: ${err instanceof Error ? err.message : String(err)}\nUsing after.png as placeholder pair for local QA.\n`,
      );
      const { copyFile } = await import("node:fs/promises");
      await copyFile(afterPath, path.join(refDir, "before.png"));
      beforePath = path.join(refDir, "before.png");
    }

    let diff = null;
    try {
      diff = await visualDiff({
        a: beforePath,
        b: afterPath,
        outDir: refDir,
      });
    } catch (err) {
      diff = { error: err instanceof Error ? err.message : String(err) };
    }

    const scores = {
      slug: clone.slug,
      url: clone.url,
      beforeOk,
      before: beforePath,
      after: afterPath,
      diff,
      capturedAt: new Date().toISOString(),
    };
    await writeFile(
      path.join(refDir, "scores.json"),
      JSON.stringify(scores, null, 2),
      "utf8",
    );
    report.push({ slug: clone.slug, ok: true, beforeOk, score: diff?.score });
    await page.close();
    console.error(
      `[ref] ${clone.slug}: beforeOk=${beforeOk} score=${diff?.score ?? "n/a"}`,
    );
  }
} finally {
  await browser.close();
}

const out = path.join(clonesRoot, "_reference-report.json");
await writeFile(out, JSON.stringify({ report }, null, 2), "utf8");
console.log(JSON.stringify({ ok: report.every((r) => r.ok), report }, null, 2));
