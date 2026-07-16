import { describe, expect, it } from "vitest";
import {
  ElementNodeSchema,
  ExtractionResultSchema,
  PageMetadataSchema,
  ViewportSchema,
  errResult,
  okResult,
} from "./schema.js";

describe("ViewportSchema", () => {
  it("applies defaults", () => {
    const v = ViewportSchema.parse({});
    expect(v).toEqual({ width: 1440, height: 900 });
  });
});

describe("PageMetadataSchema", () => {
  it("parses valid metadata", () => {
    const meta = PageMetadataSchema.parse({
      url: "https://example.com/",
      title: "Example",
      viewport: { width: 1280, height: 720 },
      extractedAt: new Date().toISOString(),
    });
    expect(meta.title).toBe("Example");
    expect(meta.viewport.width).toBe(1280);
  });
});

describe("ElementNodeSchema", () => {
  it("parses nested tree", () => {
    const node = ElementNodeSchema.parse({
      tag: "div",
      classes: ["hero"],
      children: [{ tag: "h1", text: "Hello", children: [] }],
    });
    expect(node.children?.[0]?.tag).toBe("h1");
  });
});

describe("ExtractionResultSchema", () => {
  it("parses a minimal extraction", () => {
    const result = ExtractionResultSchema.parse({
      sourceId: "src_test",
      metadata: {
        url: "https://example.com/",
        title: "Example",
        viewport: { width: 1440, height: 900 },
        extractedAt: "2026-07-15T12:00:00.000Z",
      },
      root: { tag: "body", children: [] },
      stats: { totalElements: 1, maxDepth: 1 },
    });
    expect(result.sourceId).toBe("src_test");
    expect(result.screenshots).toEqual({});
  });
});

describe("result helpers", () => {
  it("okResult and errResult", () => {
    expect(okResult({ sourceId: "x" })).toEqual({ ok: true, sourceId: "x" });
    expect(errResult("INVALID_URL", "bad", "use https")).toMatchObject({
      ok: false,
      code: "INVALID_URL",
    });
  });
});
