import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";
import { SiteForgeException } from "./errors.js";

export interface VisualDiffOptions {
  a: string;
  b: string;
  outDir?: string;
  threshold?: number;
}

export interface VisualDiffResult {
  ok: true;
  width: number;
  height: number;
  diffPixels: number;
  totalPixels: number;
  /** 1 = identical, 0 = completely different */
  score: number;
  diffPath?: string;
}

/**
 * Compare two PNG screenshots with pixelmatch.
 */
export async function visualDiff(
  options: VisualDiffOptions,
): Promise<VisualDiffResult> {
  const threshold = options.threshold ?? 0.1;
  const imgA = PNG.sync.read(await readFile(options.a));
  const imgB = PNG.sync.read(await readFile(options.b));

  const width = Math.min(imgA.width, imgB.width);
  const height = Math.min(imgA.height, imgB.height);
  if (width === 0 || height === 0) {
    throw new SiteForgeException(
      "INTERNAL",
      "Screenshots have zero dimensions",
    );
  }

  // Crop both to common size (top-left align)
  const a = cropPng(imgA, width, height);
  const b = cropPng(imgB, width, height);
  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(a.data, b.data, diff.data, width, height, {
    threshold,
  });
  const totalPixels = width * height;
  const score = totalPixels === 0 ? 0 : 1 - diffPixels / totalPixels;

  let diffPath: string | undefined;
  if (options.outDir) {
    await mkdir(options.outDir, { recursive: true });
    diffPath = path.join(options.outDir, "diff.png");
    await writeFile(diffPath, PNG.sync.write(diff));
  }

  return {
    ok: true,
    width,
    height,
    diffPixels,
    totalPixels,
    score,
    diffPath,
  };
}

function cropPng(src: PNG, width: number, height: number): PNG {
  if (src.width === width && src.height === height) return src;
  const out = new PNG({ width, height });
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const si = (src.width * y + x) << 2;
      const di = (width * y + x) << 2;
      out.data[di] = src.data[si]!;
      out.data[di + 1] = src.data[si + 1]!;
      out.data[di + 2] = src.data[si + 2]!;
      out.data[di + 3] = src.data[si + 3]!;
    }
  }
  return out;
}
