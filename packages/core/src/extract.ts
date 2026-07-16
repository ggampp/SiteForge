import path from "node:path";
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

export interface ExtractOptions {
  url?: string;
  /** Inline HTML fixture (for tests / offline) */
  html?: string;
  outDir?: string;
  viewport?: Viewport;
  waitMs?: number;
  maxDepth?: number;
  headless?: boolean;
  /** Capture computed styles on each node (default true) */
  captureStyles?: boolean;
  /** Scroll page to trigger lazy content (default true for URLs) */
  lazyScroll?: boolean;
  lazyScrollMaxSteps?: number;
  /** Viewport + full-page PNG (default true) */
  screenshots?: boolean;
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
  };
  stats: ExtractionResult["stats"] & {
    scrollSteps?: number;
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
  const captureStyles = options.captureStyles ?? true;
  const doScreenshots = options.screenshots ?? true;
  const doLazyScroll =
    options.lazyScroll ?? (options.url !== undefined && !options.html);

  if (!options.url && !options.html) {
    throw new Error("extractPage requires url or html");
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
      await page.goto(options.url, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
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

    const sourceId = createSourceId();
    const { root, totalElements, maxDepthReached } = await walkDom(page, {
      maxDepth,
      captureStyles,
    });

    const screenshotsDir = path.join(sourceDir(outDir, sourceId), "screenshots");
    let screenshotPaths: { viewport?: string; fullPage?: string } = {};
    if (doScreenshots) {
      screenshotPaths = await captureScreenshots(page, {
        dir: screenshotsDir,
        viewport: true,
        fullPage: true,
      });
    }

    const pageUrl = options.url ?? finalUrl ?? "about:blank";

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
    });

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
      },
      stats: {
        ...result.stats,
        scrollSteps: doLazyScroll ? scrollSteps : undefined,
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
          // CSSStyleDeclaration supports camelCase via getPropertyValue needs kebab;
          // indexing by camelCase works in browsers for computed style.
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
