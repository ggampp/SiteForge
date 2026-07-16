import path from "node:path";
import { writeFile } from "node:fs/promises";
import type { Page } from "playwright";
import {
  type ElementNode,
  type ExtractionResult,
  type Viewport,
  ExtractionResultSchema,
} from "./schema.js";
import { BrowserManager, gotoFixtureHtml } from "./browser.js";
import { createSourceId, persistExtraction, sourceDir } from "./store.js";
import { COMPUTED_STYLE_PROPS } from "./styles.js";
import { lazyScrollPage } from "./scroll.js";
import { captureScreenshots } from "./screenshots.js";
import { SiteForgeException, assertHttpUrl } from "./errors.js";
import { captureStylesheets, persistStylesheets } from "./css.js";

export interface ExtractOptions {
  url?: string;
  /** Inline HTML fixture (for tests / offline) */
  html?: string;
  outDir?: string;
  viewport?: Viewport;
  waitMs?: number;
  /** Navigation timeout for page.goto (ms) */
  timeoutMs?: number;
  maxDepth?: number;
  headless?: boolean;
  /** Capture computed styles on each node (default true) */
  captureStyles?: boolean;
  /** Scroll page to trigger lazy content (default true for URLs) */
  lazyScroll?: boolean;
  lazyScrollMaxSteps?: number;
  /** Viewport + full-page PNG (default true) */
  screenshots?: boolean;
  /** Persist page.content() as raw.html (default true) */
  saveRawHtml?: boolean;
  /** Capture stylesheets (inline + link + readable cssRules) */
  captureCss?: boolean;
}

export interface ExtractSummary {
  ok: true;
  sourceId: string;
  url: string;
  title: string;
  paths: {
    meta: string;
    extraction: string;
    screenshotsDir?: string;
    viewportScreenshot?: string;
    fullPageScreenshot?: string;
    rawHtml?: string;
    stylesheets?: string;
    capturedCss?: string;
  };
  stats: ExtractionResult["stats"] & {
    scrollSteps?: number;
    stylesheetCount?: number;
  };
}

/**
 * Extract a page: load → optional lazy scroll → DOM walk + styles → screenshots → store.
 */
export async function extractPage(
  options: ExtractOptions,
): Promise<ExtractSummary> {
  const viewport = options.viewport ?? { width: 1440, height: 900 };
  const outDir = options.outDir ?? ".siteforge";
  const maxDepth = options.maxDepth ?? 30;
  const waitMs = options.waitMs ?? 500;
  const timeoutMs = options.timeoutMs ?? 60_000;
  const captureStyles = options.captureStyles ?? true;
  const doScreenshots = options.screenshots ?? true;
  const saveRawHtml = options.saveRawHtml ?? true;
  const captureCss = options.captureCss ?? true;
  const doLazyScroll =
    options.lazyScroll ?? (options.url !== undefined && !options.html);

  if (!options.url && !options.html) {
    throw new SiteForgeException(
      "EXTRACT_FAILED",
      "extractPage requires url or html",
    );
  }
  if (options.url) {
    assertHttpUrl(options.url);
  }

  const manager = new BrowserManager({
    headless: options.headless ?? true,
    viewport,
  });

  const started = Date.now();
  try {
    const { context, page } = await manager.newPage();

    if (options.html) {
      await gotoFixtureHtml(page, options.html);
    } else if (options.url) {
      try {
        await page.goto(options.url, {
          waitUntil: "domcontentloaded",
          timeout: timeoutMs,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (/timeout/i.test(message)) {
          throw new SiteForgeException(
            "TIMEOUT",
            `Navigation timed out after ${timeoutMs}ms: ${options.url}`,
            "Increase --timeout or check the network/target",
          );
        }
        throw new SiteForgeException(
          "EXTRACT_FAILED",
          `Failed to load ${options.url}: ${message}`,
        );
      }
    }

    if (waitMs > 0) {
      await page.waitForTimeout(waitMs);
    }

    let scrollSteps = 0;
    if (doLazyScroll) {
      const scroll = await lazyScrollPage(page, {
        maxSteps: options.lazyScrollMaxSteps ?? 40,
        stepDelayMs: 120,
        returnToTop: true,
      });
      scrollSteps = scroll.steps;
    }

    const title = await page.title();
    const finalUrl = page.url();
    const description = await page
      .locator('meta[name="description"]')
      .first()
      .getAttribute("content")
      .catch(() => null);
    const lang = await page
      .locator("html")
      .first()
      .getAttribute("lang")
      .catch(() => null);

    // Prefer networkidle settle for real URLs (CSS/fonts); skip offline fixtures
    if (options.url) {
      await page
        .waitForLoadState("networkidle", { timeout: 15_000 })
        .catch(() => undefined);
    }

    const rawHtml = saveRawHtml ? await page.content() : undefined;
    const pageUrl = options.url ?? finalUrl ?? "about:blank";

    let stylesheetCount = 0;
    let cssPaths: { jsonPath?: string; cssPath?: string } = {};
    if (captureCss) {
      const bundle = await captureStylesheets(page, pageUrl);
      stylesheetCount = bundle.sheets.length;
      // source id not yet known — temp capture after sourceId
      (page as unknown as { __sfCssBundle?: typeof bundle }).__sfCssBundle =
        bundle;
    }

    const sourceId = createSourceId();
    const { root, totalElements, maxDepthReached } = await walkDom(page, {
      maxDepth,
      captureStyles,
    });

    const screenshotsDir = path.join(
      sourceDir(outDir, sourceId),
      "screenshots",
    );
    let screenshotPaths: { viewport?: string; fullPage?: string } = {};
    if (doScreenshots) {
      screenshotPaths = await captureScreenshots(page, {
        dir: screenshotsDir,
        viewport: true,
        fullPage: true,
      });
    }

    const result: ExtractionResult = ExtractionResultSchema.parse({
      sourceId,
      metadata: {
        url: pageUrl,
        finalUrl,
        title,
        description: description ?? undefined,
        lang: lang ?? undefined,
        viewport,
        extractedAt: new Date().toISOString(),
        loadTimeMs: Date.now() - started,
      },
      root,
      stats: {
        totalElements,
        maxDepth: maxDepthReached,
        loadTimeMs: Date.now() - started,
      },
      screenshots: {
        viewport: screenshotPaths.viewport,
        fullPage: screenshotPaths.fullPage,
      },
    });

    const meta = await persistExtraction({
      outDir,
      url: pageUrl,
      title,
      viewport,
      result,
      rawHtml,
    });

    const bundle = (page as unknown as { __sfCssBundle?: Awaited<ReturnType<typeof captureStylesheets>> }).__sfCssBundle;
    if (bundle) {
      const dir = sourceDir(outDir, sourceId);
      cssPaths = await persistStylesheets(dir, bundle);
      meta.paths.stylesheets = cssPaths.jsonPath;
      meta.paths.capturedCss = cssPaths.cssPath;
      meta.updatedAt = new Date().toISOString();
      await writeFile(meta.paths.meta, JSON.stringify(meta, null, 2), "utf8");
    }

    await context.close();

    return {
      ok: true,
      sourceId,
      url: pageUrl,
      title,
      paths: {
        ...meta.paths,
        viewportScreenshot: screenshotPaths.viewport,
        fullPageScreenshot: screenshotPaths.fullPage,
        stylesheets: cssPaths.jsonPath,
        capturedCss: cssPaths.cssPath,
      },
      stats: {
        ...result.stats,
        scrollSteps: doLazyScroll ? scrollSteps : undefined,
        stylesheetCount,
      },
    };
  } finally {
    await manager.close();
  }
}

interface WalkResult {
  root: ElementNode;
  totalElements: number;
  maxDepthReached: number;
}

async function walkDom(
  page: Page,
  opts: { maxDepth: number; captureStyles: boolean },
): Promise<WalkResult> {
  const styleProps = [...COMPUTED_STYLE_PROPS];
  return page.evaluate(
    (params): WalkResult => {
      const { depthLimit, captureStyles, styleProps: props } = params;
      let totalElements = 0;
      let maxDepthReached = 0;

      function pickStyles(el: Element): Record<string, string> | undefined {
        if (!captureStyles) return undefined;
        const cs = window.getComputedStyle(el);
        const out: Record<string, string> = {};
        for (const prop of props) {
          const value = (cs as unknown as Record<string, string>)[prop] ?? "";
          if (value !== "") out[prop] = value;
        }
        return out;
      }

      function walk(el: Element, depth: number): ElementNode {
        totalElements += 1;
        if (depth > maxDepthReached) maxDepthReached = depth;

        const classes = el.classList ? Array.from(el.classList) : [];
        const attributes: Record<string, string> = {};
        for (const attr of Array.from(el.attributes)) {
          if (attr.name === "class" || attr.name === "id") continue;
          attributes[attr.name] = attr.value;
        }

        const rect = el.getBoundingClientRect();
        const textOwn =
          el.childNodes.length === 1 &&
          el.childNodes[0]?.nodeType === Node.TEXT_NODE
            ? (el.textContent ?? "").trim().slice(0, 500)
            : undefined;

        const children: ElementNode[] = [];
        if (depth < depthLimit) {
          for (const child of Array.from(el.children)) {
            children.push(walk(child, depth + 1));
          }
        }

        return {
          tag: el.tagName.toLowerCase(),
          id: el.id || undefined,
          classes,
          attributes,
          text: textOwn || undefined,
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
          },
          styles: pickStyles(el),
          children,
        };
      }

      const body = document.body ?? document.documentElement;
      const root = walk(body, 1);
      return { root, totalElements, maxDepthReached };
    },
    {
      depthLimit: opts.maxDepth,
      captureStyles: opts.captureStyles,
      styleProps,
    },
  );
}
