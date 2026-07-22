import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { extractPage } from "./extract.js";
import { designTokensFromExtraction } from "./tokens.js";
import { exportDesignTokens } from "./tokens.js";
import { writeSpecStub } from "./spec.js";
import { chunkSource } from "./pipeline.js";
import { captureInteraction } from "./interaction.js";
import { checkBudget, PERF_BUDGETS, summarizePerf } from "./perf.js";

const FIXTURE = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Token Fixture</title>
  <style>
    :root { --brand: #0a7; }
    body { margin:0; font-family: Georgia, serif; background:#fafafa; color:#222; }
    a.btn { color:#06c; padding:8px 12px; display:inline-block; }
    a.btn:hover { color:#c00; background:#eee; }
  </style>
</head>
<body>
  <header id="hero" style="padding:40px;background:#0a7;color:#fff;font-size:32px">Hello</header>
  <main><a class="btn" href="#">Click</a><p>Body text</p></main>
</body>
</html>`;

describe("design tokens + spec stub", () => {
  it("exports tokens from extraction", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sf-tok-"));
    try {
      const summary = await extractPage({
        html: FIXTURE,
        outDir: dir,
        screenshots: false,
        lazyScroll: false,
        captureCss: false,
        waitMs: 0,
      });
      const { loadExtraction } = await import("./store.js");
      const extraction = await loadExtraction(dir, summary.sourceId);
      const tokens = designTokensFromExtraction(extraction);
      expect(tokens.colors.length).toBeGreaterThan(0);
      expect(tokens.fonts.length).toBeGreaterThan(0);
      expect(tokens.snippet).toContain(":root");

      const exported = await exportDesignTokens(dir, summary.sourceId);
      expect(exported.paths.css).toContain("design-tokens.css");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);

  it("writes spec stub after chunk", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sf-spec-"));
    try {
      const summary = await extractPage({
        html: FIXTURE,
        outDir: dir,
        screenshots: false,
        lazyScroll: false,
        captureCss: false,
        waitMs: 0,
      });
      const chunked = await chunkSource(dir, summary.sourceId);
      expect(chunked.summaries.length).toBeGreaterThan(0);
      const sectionId = chunked.summaries[0]!.sectionId;
      const stubPath = path.join(dir, "research", `${sectionId}.spec.md`);
      const stub = await writeSpecStub({
        outDir: dir,
        sourceId: summary.sourceId,
        sectionId,
        targetPath: stubPath,
      });
      expect(stub.path).toBe(stubPath);
      const { readFile } = await import("node:fs/promises");
      const md = await readFile(stubPath, "utf8");
      expect(md).toContain("Specification");
      expect(md).toContain(sectionId);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);
});

describe("interaction capture", () => {
  it("captures hover style diff on fixture", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sf-ix-"));
    try {
      const result = await captureInteraction({
        html: FIXTURE,
        selector: "a.btn",
        kind: "hover",
        outDir: dir,
        waitMs: 50,
      });
      expect(result.ok).toBe(true);
      expect(result.kind).toBe("hover");
      // May or may not change depending on engine; at least structure exists
      expect(result.styleDiff.before).toBeTypeOf("object");
      expect(result.styleDiff.after).toBeTypeOf("object");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }, 60_000);
});

describe("perf budgets", () => {
  it("summarizes checks", () => {
    const r = summarizePerf([
      checkBudget("extract", 1000, PERF_BUDGETS.extractWarmMs),
      checkBudget("sections", 100, PERF_BUDGETS.listSectionsMs),
    ]);
    expect(r.ok).toBe(true);
  });
});
