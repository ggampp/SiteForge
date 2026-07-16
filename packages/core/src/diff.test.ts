import { describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { PNG } from "pngjs";
import { visualDiff } from "./diff.js";

function solidPng(w: number, h: number, rgba: [number, number, number, number]) {
  const png = new PNG({ width: w, height: h });
  for (let i = 0; i < w * h; i++) {
    const o = i << 2;
    png.data[o] = rgba[0];
    png.data[o + 1] = rgba[1];
    png.data[o + 2] = rgba[2];
    png.data[o + 3] = rgba[3];
  }
  return PNG.sync.write(png);
}

describe("visualDiff", () => {
  it("scores identical images as 1", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sf-diff-"));
    try {
      const a = path.join(dir, "a.png");
      const b = path.join(dir, "b.png");
      const buf = solidPng(20, 20, [10, 20, 30, 255]);
      await writeFile(a, buf);
      await writeFile(b, buf);
      const r = await visualDiff({ a, b, outDir: dir });
      expect(r.score).toBe(1);
      expect(r.diffPixels).toBe(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("detects different images", async () => {
    const dir = await mkdtemp(path.join(tmpdir(), "sf-diff2-"));
    try {
      const a = path.join(dir, "a.png");
      const b = path.join(dir, "b.png");
      await writeFile(a, solidPng(16, 16, [0, 0, 0, 255]));
      await writeFile(b, solidPng(16, 16, [255, 255, 255, 255]));
      const r = await visualDiff({ a, b, outDir: dir });
      expect(r.score).toBeLessThan(0.5);
      expect(r.diffPixels).toBeGreaterThan(0);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
