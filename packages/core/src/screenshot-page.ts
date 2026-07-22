import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { BrowserManager, gotoFixtureHtml } from "./browser.js";
import { SiteForgeException, assertHttpUrl } from "./errors.js";
import { assertSafeHttpUrl } from "./ssrf.js";
import { captureScreenshots } from "./screenshots.js";
import { sourceDir, pathExists } from "./store.js";

export interface ScreenshotPageOptions {
  url?: string;
  html?: string;
  sourceId?: string;
  outDir?: string;
  viewport?: { width: number; height: number };
  fullPage?: boolean;
  waitMs?: number;
  timeoutMs?: number;
  headless?: boolean;
  allowLocalhost?: boolean;
  ssrfGuard?: boolean;
  targetDir?: string;
}

export interface ScreenshotPageResult {
  ok: true;
  paths: {
    viewport?: string;
    fullPage?: string;
    dir: string;
  };
}

/**
 * Take viewport/full-page screenshots of a URL, HTML fixture, or existing source URL.
 */
export async function screenshotPage(
  options: ScreenshotPageOptions,
): Promise<ScreenshotPageResult> {
  const outDir = options.outDir ?? ".siteforge";
  let url = options.url;
  const html = options.html;

  if (options.sourceId && !url && !html) {
    const metaPath = path.join(sourceDir(outDir, options.sourceId), "meta.json");
    if (!(await pathExists(metaPath))) {
      throw new SiteForgeException(
        "SOURCE_NOT_FOUND",
        `Source not found: ${options.sourceId}`,
      );
    }
    const meta = JSON.parse(await readFile(metaPath, "utf8")) as { url: string };
    url = meta.url;
  }

  if (!url && !html) {
    throw new SiteForgeException(
      "EXTRACT_FAILED",
      "screenshotPage requires url, html, or sourceId",
    );
  }

  if (url) {
    assertHttpUrl(url);
    assertSafeHttpUrl(url, {
      allowLocalhost: options.allowLocalhost ?? true,
      enabled: options.ssrfGuard ?? true,
    });
  }

  const dir =
    options.targetDir ??
    path.join(
      outDir,
      "screenshots",
      options.sourceId ?? `shot_${Date.now().toString(36)}`,
    );
  await mkdir(dir, { recursive: true });

  const manager = new BrowserManager({
    headless: options.headless ?? true,
    viewport: options.viewport ?? { width: 1440, height: 900 },
  });

  try {
    const { page } = await manager.newPage();
    if (html) {
      await gotoFixtureHtml(page, html);
    } else if (url) {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: options.timeoutMs ?? 60_000,
      });
    }
    if (options.waitMs) {
      await page.waitForTimeout(options.waitMs);
    }

    const shots = await captureScreenshots(page, {
      dir,
      viewport: true,
      fullPage: options.fullPage ?? true,
    });

    return {
      ok: true,
      paths: {
        viewport: shots.viewport,
        fullPage: shots.fullPage,
        dir,
      },
    };
  } finally {
    await manager.close();
  }
}
