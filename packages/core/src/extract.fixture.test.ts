import { describe, expect, it } from "vitest";
import { access } from "node:fs/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { extractPage } from "./extract.js";
import { loadExtraction } from "./store.js";
import { COMPUTED_STYLE_PROP_COUNT } from "./styles.js";

const FIXTURE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Fixture Landing</title>
  <meta name="description" content="A test landing page" />
  <style>
    body { margin: 0; font-family: system-ui, sans-serif; color: #111; }
    .site-header { background: #0f172a; color: #fff; padding: 24px; }
    .hero { min-height: 1200px; padding: 48px; background: #f8fafc; }
    h1 { font-size: 32px; font-weight: 700; }
  </style>
</head>
<body>
  <header class="site-header"><h1>Hello SiteForge</h1></header>
  <main>
    <section class="hero"><p>Extract me</p></section>
  </main>
</body>
</html>`;

describe("extractPage with local HTML fixture", () => {
  it(
    "walks DOM with styles, screenshots, and persists source",
    async () => {
      const outDir = await mkdtemp(path.join(tmpdir(), "siteforge-extract-"));
      try {
        const summary = await extractPage({
          html: FIXTURE_HTML,
          outDir,
          waitMs: 50,
          maxDepth: 10,
          lazyScroll: true,
          lazyScrollMaxSteps: 5,
          screenshots: true,
          captureStyles: true,
        });

        expect(summary.ok).toBe(true);
        expect(summary.sourceId).toMatch(/^src_/);
        expect(summary.title).toBe("Fixture Landing");
        expect(summary.stats.totalElements).toBeGreaterThan(2);
        expect(summary.paths.viewportScreenshot).toBeTruthy();
        expect(summary.paths.fullPageScreenshot).toBeTruthy();

        await access(summary.paths.viewportScreenshot!);
        await access(summary.paths.fullPageScreenshot!);

        const full = await loadExtraction(outDir, summary.sourceId);
        expect(full.root.tag).toBe("body");
        expect(full.metadata.description).toBe("A test landing page");
        expect(full.metadata.lang).toBe("en");
        expect(full.screenshots.viewport).toBeTruthy();
        expect(full.screenshots.fullPage).toBeTruthy();

        const tags = collectTags(full.root);
        expect(tags).toContain("header");
        expect(tags).toContain("main");
        expect(tags).toContain("h1");

        const h1 = findTag(full.root, "h1");
        expect(h1?.styles).toBeDefined();
        expect(h1?.styles?.fontSize).toBeTruthy();
        expect(h1?.styles?.display).toBeTruthy();
        expect(Object.keys(h1?.styles ?? {}).length).toBeGreaterThanOrEqual(10);
        // We capture the full prop set when values resolve
        expect(Object.keys(h1?.styles ?? {}).length).toBeLessThanOrEqual(
          COMPUTED_STYLE_PROP_COUNT,
        );

        const header = findTag(full.root, "header");
        expect(header?.styles?.backgroundColor).toBeTruthy();
      } finally {
        await rm(outDir, { recursive: true, force: true });
      }
    },
    60_000,
  );
});

function collectTags(node: { tag: string; children?: unknown[] }): string[] {
  const out = [node.tag];
  for (const child of node.children ?? []) {
    out.push(...collectTags(child as { tag: string; children?: unknown[] }));
  }
  return out;
}

function findTag(
  node: {
    tag: string;
    styles?: Record<string, string>;
    children?: unknown[];
  },
  tag: string,
): { tag: string; styles?: Record<string, string> } | undefined {
  if (node.tag === tag) return node;
  for (const child of node.children ?? []) {
    const found = findTag(
      child as {
        tag: string;
        styles?: Record<string, string>;
        children?: unknown[];
      },
      tag,
    );
    if (found) return found;
  }
  return undefined;
}
