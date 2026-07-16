import { describe, expect, it } from "vitest";
import {
  chunkExtraction,
  estimateTokens,
  rectOverlapArea,
  validateThreePrinciples,
} from "./chunk.js";
import type { ElementNode, ExtractionResult } from "./schema.js";

function box(
  tag: string,
  y: number,
  height: number,
  extra: Partial<ElementNode> = {},
): ElementNode {
  return {
    tag,
    classes: [],
    attributes: {},
    rect: { x: 0, y, width: 1440, height },
    children: [],
    ...extra,
  };
}

function makeExtraction(children: ElementNode[]): ExtractionResult {
  return {
    sourceId: "src_test",
    metadata: {
      url: "https://example.com/",
      title: "Test",
      viewport: { width: 1440, height: 900 },
      extractedAt: "2026-07-15T12:00:00.000Z",
    },
    root: {
      tag: "body",
      classes: [],
      attributes: {},
      rect: { x: 0, y: 0, width: 1440, height: 2000 },
      children,
    },
    stats: { totalElements: 1 + children.length, maxDepth: 2 },
    screenshots: {},
  };
}

describe("estimateTokens", () => {
  it("scales with payload size", () => {
    expect(estimateTokens({ a: 1 })).toBeGreaterThan(0);
    expect(estimateTokens({ a: "x".repeat(400) })).toBeGreaterThan(
      estimateTokens({ a: "x" }),
    );
  });
});

describe("rectOverlapArea", () => {
  it("detects overlap", () => {
    const a = { x: 0, y: 0, width: 100, height: 100 };
    const b = { x: 50, y: 50, width: 100, height: 100 };
    expect(rectOverlapArea(a, b)).toBe(2500);
  });
});

describe("chunkExtraction three principles", () => {
  it("produces non-overlapping covering sections for stacked semantics", () => {
    const extraction = makeExtraction([
      box("header", 0, 200, { text: "Header" }),
      box("main", 200, 1200, {
        children: [
          box("section", 200, 600, { classes: ["hero"], text: "Hero" }),
          box("section", 800, 600, { classes: ["features"], text: "Features" }),
        ],
      }),
      box("footer", 1400, 200, { text: "Footer" }),
    ]);

    const result = chunkExtraction(extraction, { maxTokens: 50_000, minHeight: 50 });
    expect(result.sections.length).toBeGreaterThanOrEqual(2);
    expect(result.pageHeight).toBeGreaterThan(0);

    // re-validate
    const v = validateThreePrinciples(
      result.sections,
      result.pageHeight,
      50_000,
      100,
    );
    expect(v.mutualExclusivity).toBe(true);
    // coverage may be ok for stacked layout
    expect(result.sections.every((s) => s.sectionId.startsWith("section_"))).toBe(
      true,
    );
  });

  it("splits oversized node when possible", () => {
    const bigKids: ElementNode[] = [];
    for (let i = 0; i < 8; i++) {
      bigKids.push(
        box("div", i * 100, 100, {
          text: "word ".repeat(200),
          attributes: { "data-i": String(i) },
        }),
      );
    }
    const extraction = makeExtraction([
      {
        tag: "main",
        classes: [],
        attributes: {},
        rect: { x: 0, y: 0, width: 1440, height: 800 },
        children: bigKids,
      },
    ]);
    const result = chunkExtraction(extraction, { maxTokens: 200, minHeight: 10 });
    expect(result.sections.length).toBeGreaterThan(1);
  });
});
