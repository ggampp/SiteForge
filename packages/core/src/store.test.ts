import { describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  createSourceId,
  listSourceIds,
  loadExtraction,
  loadSourceMeta,
  persistExtraction,
} from "./store.js";
import type { ExtractionResult } from "./schema.js";

describe("store", () => {
  it("creates unique source ids", () => {
    const a = createSourceId();
    const b = createSourceId();
    expect(a).toMatch(/^src_/);
    expect(a).not.toBe(b);
  });

  it("roundtrips meta + extraction", async () => {
    const outDir = await mkdtemp(path.join(tmpdir(), "siteforge-store-"));
    try {
      const sourceId = createSourceId();
      const result: ExtractionResult = {
        sourceId,
        metadata: {
          url: "https://example.com/",
          title: "Example",
          viewport: { width: 1440, height: 900 },
          extractedAt: "2026-07-15T12:00:00.000Z",
        },
        root: { tag: "body", classes: [], attributes: {}, children: [] },
        stats: { totalElements: 1, maxDepth: 1 },
        screenshots: {},
      };

      const meta = await persistExtraction({
        outDir,
        url: "https://example.com/",
        title: "Example",
        viewport: { width: 1440, height: 900 },
        result,
      });

      expect(meta.sourceId).toBe(sourceId);
      const loadedMeta = await loadSourceMeta(outDir, sourceId);
      const loadedExt = await loadExtraction(outDir, sourceId);
      expect(loadedMeta.title).toBe("Example");
      expect(loadedExt.stats.totalElements).toBe(1);
      expect(await listSourceIds(outDir)).toContain(sourceId);
    } finally {
      await rm(outDir, { recursive: true, force: true });
    }
  });
});
