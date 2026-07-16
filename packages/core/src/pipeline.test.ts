import { describe, expect, it } from "vitest";
import { mkdtemp, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { extractPage } from "./extract.js";
import {
  chunkSource,
  discoverSourceAssets,
  getPageMetadata,
  getSectionDetail,
  getSectionsList,
  querySource,
} from "./pipeline.js";
import { loadRawHtml } from "./store.js";

const FIXTURE = `<!DOCTYPE html>
<html lang="en">
<head>
  <title>Pipeline Fixture</title>
  <meta name="description" content="pipeline test" />
  <style>
    header { height: 120px; background: #111; color: #fff; }
    .hero { min-height: 400px; }
    .features { min-height: 400px; }
    footer { height: 100px; }
  </style>
</head>
<body>
  <header><h1>Brand</h1></header>
  <main>
    <section class="hero"><p>Hero copy</p><img src="https://via.placeholder.com/10.png" alt="x" /></section>
    <section class="features"><p>Features copy</p></section>
  </main>
  <footer>© test</footer>
</body>
</html>`;

describe("pipeline extract → chunk → query", () => {
  it(
    "end-to-end local fixture",
    async () => {
      const outDir = await mkdtemp(path.join(tmpdir(), "sf-pipe-"));
      try {
        const extracted = await extractPage({
          html: FIXTURE,
          outDir,
          waitMs: 30,
          lazyScroll: false,
          screenshots: true,
          saveRawHtml: true,
        });
        expect(extracted.ok).toBe(true);
        expect(extracted.paths.rawHtml).toBeTruthy();
        const raw = await loadRawHtml(outDir, extracted.sourceId);
        expect(raw).toContain("Pipeline Fixture");

        const meta = await getPageMetadata(outDir, extracted.sourceId);
        expect(meta.metadata.title).toBe("Pipeline Fixture");

        const chunked = await chunkSource(outDir, extracted.sourceId, {
          maxTokens: 50_000,
        });
        expect(chunked.sections.length).toBeGreaterThanOrEqual(1);
        expect(chunked.validation.mutualExclusivity).toBe(true);
        await access(chunked.indexPath);

        const list = await getSectionsList(outDir, extracted.sourceId);
        expect(list.sections.length).toBe(chunked.sections.length);

        const firstId = list.sections[0]!.sectionId;
        const detail = await getSectionDetail(
          outDir,
          extracted.sourceId,
          firstId,
        );
        expect(detail.root.tag).toBeTruthy();

        const q = await querySource(
          outDir,
          extracted.sourceId,
          "metadata.title",
        );
        expect(q.value).toBe("Pipeline Fixture");

        const assets = await discoverSourceAssets(outDir, extracted.sourceId);
        expect(assets.count).toBeGreaterThanOrEqual(1);
      } finally {
        await rm(outDir, { recursive: true, force: true });
      }
    },
    60_000,
  );
});
