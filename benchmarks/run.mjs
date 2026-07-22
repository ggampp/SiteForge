#!/usr/bin/env node
/**
 * Benchmark runner: extract → chunk → budget checks for sites in sites.json.
 * Usage: node benchmarks/run.mjs [--limit N] [--id example]
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  extractPage,
  chunkSource,
  checkBudget,
  summarizePerf,
  PERF_BUDGETS,
} from "../packages/core/dist/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const catalog = JSON.parse(
  await readFile(path.join(__dirname, "sites.json"), "utf8"),
);

const args = process.argv.slice(2);
let limit = catalog.sites.length;
let onlyId = null;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--limit") limit = Number(args[++i]) || limit;
  if (args[i] === "--id") onlyId = args[++i];
}

const sites = catalog.sites
  .filter((s) => !onlyId || s.id === onlyId)
  .slice(0, limit);

const outDir = path.join(root, ".siteforge-benchmarks");
await mkdir(outDir, { recursive: true });

const report = {
  startedAt: new Date().toISOString(),
  results: [],
};

for (const site of sites) {
  const started = Date.now();
  const entry = {
    id: site.id,
    url: site.url,
    ok: false,
    extractMs: 0,
    sectionsMs: 0,
    sections: 0,
    sourceId: null,
    error: null,
    budgets: null,
  };
  try {
    console.error(`[bench] extract ${site.id} …`);
    const summary = await extractPage({
      url: site.url,
      outDir,
      waitMs: 1000,
      timeoutMs: 60_000,
      lazyScroll: true,
      screenshots: true,
      captureCss: false,
    });
    entry.extractMs = Date.now() - started;
    entry.sourceId = summary.sourceId;

    const chunkStarted = Date.now();
    const chunked = await chunkSource(outDir, summary.sourceId);
    entry.sectionsMs = Date.now() - chunkStarted;
    entry.sections = chunked.summaries.length;

    const budgets = summarizePerf([
      checkBudget(
        "extractColdMs",
        entry.extractMs,
        catalog.budgets?.extractColdMs ?? PERF_BUDGETS.extractColdMs,
      ),
      checkBudget(
        "listSectionsMs",
        entry.sectionsMs,
        catalog.budgets?.listSectionsMs ?? PERF_BUDGETS.listSectionsMs,
      ),
      checkBudget(
        "minSections",
        entry.sections,
        catalog.budgets?.minSections ?? 1,
        "tokens",
      ),
    ]);
    // minSections: actual >= budget — flip ok
    const minCheck = budgets.checks.find((c) => c.name === "minSections");
    if (minCheck) minCheck.ok = entry.sections >= (catalog.budgets?.minSections ?? 1);
    budgets.ok = budgets.checks.every((c) => c.ok);

    entry.budgets = budgets;
    entry.ok = budgets.ok;
    console.error(
      `[bench] ${site.id}: extract=${entry.extractMs}ms sections=${entry.sections} ok=${entry.ok}`,
    );
  } catch (err) {
    entry.error = err instanceof Error ? err.message : String(err);
    console.error(`[bench] ${site.id} FAILED: ${entry.error}`);
  }
  report.results.push(entry);
}

report.finishedAt = new Date().toISOString();
report.ok = report.results.every((r) => r.ok);
const reportPath = path.join(outDir, "benchmark-report.json");
await writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");
console.log(JSON.stringify({ ok: report.ok, reportPath, summary: report.results }, null, 2));
process.exitCode = report.ok ? 0 : 1;
