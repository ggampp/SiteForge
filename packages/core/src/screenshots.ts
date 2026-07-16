import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Page } from "playwright";

export interface CaptureScreenshotsOptions {
  dir: string;
  viewport?: boolean;
  fullPage?: boolean;
}

export interface CapturedScreenshots {
  viewport?: string;
  fullPage?: string;
}

export async function captureScreenshots(
  page: Page,
  options: CaptureScreenshotsOptions,
): Promise<CapturedScreenshots> {
  const takeViewport = options.viewport ?? true;
  const takeFull = options.fullPage ?? true;
  await mkdir(options.dir, { recursive: true });

  const out: CapturedScreenshots = {};

  if (takeViewport) {
    const viewportPath = path.join(options.dir, "viewport.png");
    await page.screenshot({ path: viewportPath, fullPage: false, type: "png" });
    out.viewport = viewportPath;
  }

  if (takeFull) {
    const fullPath = path.join(options.dir, "full.png");
    await page.screenshot({ path: fullPath, fullPage: true, type: "png" });
    out.fullPage = fullPath;
  }

  return out;
}
