import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Page } from "playwright";
import { BrowserManager, gotoFixtureHtml } from "./browser.js";
import { SiteForgeException, assertHttpUrl } from "./errors.js";
import { assertSafeHttpUrl } from "./ssrf.js";
import { COMPUTED_STYLE_PROPS } from "./styles.js";

export type InteractionKind = "hover" | "focus" | "active";

export interface CaptureInteractionOptions {
  url?: string;
  html?: string;
  selector: string;
  kind: InteractionKind;
  outDir?: string;
  sourceId?: string;
  viewport?: { width: number; height: number };
  waitMs?: number;
  timeoutMs?: number;
  headless?: boolean;
  allowLocalhost?: boolean;
  ssrfGuard?: boolean;
  /** Style props to compare (default COMPUTED_STYLE_PROPS) */
  props?: readonly string[];
}

export interface StyleDiff {
  before: Record<string, string>;
  after: Record<string, string>;
  changed: Record<string, { before: string; after: string }>;
}

export interface InteractionCaptureResult {
  ok: true;
  selector: string;
  kind: InteractionKind;
  styleDiff: StyleDiff;
  paths: {
    dir: string;
    report: string;
  };
}

async function readStyles(
  page: Page,
  selector: string,
  props: readonly string[],
): Promise<Record<string, string>> {
  return page.evaluate(
    ({ sel, keys }) => {
      const el = document.querySelector(sel);
      if (!el) return {};
      const cs = getComputedStyle(el);
      const out: Record<string, string> = {};
      for (const k of keys) {
        out[k] = cs.getPropertyValue(
          k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`),
        )
          || (cs as unknown as Record<string, string>)[k]
          || "";
        // Prefer camelCase direct access when available
        const camel = (cs as unknown as Record<string, string>)[k];
        if (camel) out[k] = camel;
      }
      return out;
    },
    { sel: selector, keys: [...props] },
  );
}

function diffStyles(
  before: Record<string, string>,
  after: Record<string, string>,
): StyleDiff {
  const changed: StyleDiff["changed"] = {};
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    const b = before[k] ?? "";
    const a = after[k] ?? "";
    if (b !== a) changed[k] = { before: b, after: a };
  }
  return { before, after, changed };
}

async function applyInteraction(
  page: Page,
  selector: string,
  kind: InteractionKind,
): Promise<void> {
  const loc = page.locator(selector).first();
  const count = await loc.count();
  if (count === 0) {
    throw new SiteForgeException(
      "EXTRACT_FAILED",
      `Selector not found: ${selector}`,
      "Use a CSS selector that matches a visible element",
    );
  }

  if (kind === "hover") {
    await loc.hover();
  } else if (kind === "focus") {
    await loc.focus();
  } else if (kind === "active") {
    // Hold pointer down to approximate :active
    const box = await loc.boundingBox();
    if (!box) {
      throw new SiteForgeException(
        "EXTRACT_FAILED",
        `Element has no bounding box: ${selector}`,
      );
    }
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
  }
}

/**
 * Capture computed style diff before/after hover|focus|active on a selector.
 */
export async function captureInteraction(
  options: CaptureInteractionOptions,
): Promise<InteractionCaptureResult> {
  if (!options.url && !options.html) {
    throw new SiteForgeException(
      "EXTRACT_FAILED",
      "captureInteraction requires url or html",
    );
  }
  if (options.url) {
    assertHttpUrl(options.url);
    assertSafeHttpUrl(options.url, {
      allowLocalhost: options.allowLocalhost ?? true,
      enabled: options.ssrfGuard ?? true,
    });
  }

  const props = options.props ?? COMPUTED_STYLE_PROPS;
  const viewport = options.viewport ?? { width: 1440, height: 900 };
  const outRoot = options.outDir ?? ".siteforge";
  const dir = path.join(
    outRoot,
    "interaction-captures",
    options.sourceId ?? `ix_${Date.now().toString(36)}`,
  );
  await mkdir(dir, { recursive: true });

  const manager = new BrowserManager({
    headless: options.headless ?? true,
    viewport,
  });

  try {
    const { page } = await manager.newPage();
    if (options.html) {
      await gotoFixtureHtml(page, options.html);
    } else if (options.url) {
      await page.goto(options.url, {
        waitUntil: "domcontentloaded",
        timeout: options.timeoutMs ?? 60_000,
      });
    }
    if (options.waitMs) {
      await page.waitForTimeout(options.waitMs);
    }

    const before = await readStyles(page, options.selector, props);
    await applyInteraction(page, options.selector, options.kind);
    // Brief settle for transitions
    await page.waitForTimeout(150);
    const after = await readStyles(page, options.selector, props);

    if (options.kind === "active") {
      await page.mouse.up();
    }

    const styleDiff = diffStyles(before, after);
    const result: InteractionCaptureResult = {
      ok: true,
      selector: options.selector,
      kind: options.kind,
      styleDiff,
      paths: {
        dir,
        report: path.join(dir, `${options.kind}-report.json`),
      },
    };
    await writeFile(result.paths.report, JSON.stringify(result, null, 2), "utf8");
    return result;
  } finally {
    await manager.close();
  }
}
