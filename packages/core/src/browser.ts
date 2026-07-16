import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { Viewport } from "./schema.js";

export interface BrowserManagerOptions {
  headless?: boolean;
  viewport?: Viewport;
}

/**
 * Thin Playwright lifecycle helper.
 * Full extract pipeline lands in Phase 1.
 */
export class BrowserManager {
  private browser: Browser | null = null;

  constructor(private readonly options: BrowserManagerOptions = {}) {}

  async launch(): Promise<Browser> {
    if (this.browser) return this.browser;
    this.browser = await chromium.launch({
      headless: this.options.headless ?? true,
    });
    return this.browser;
  }

  async newPage(): Promise<{ context: BrowserContext; page: Page }> {
    const browser = await this.launch();
    const viewport = this.options.viewport ?? { width: 1440, height: 900 };
    const context = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    return { context, page };
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

export async function gotoFixtureHtml(
  page: Page,
  html: string,
): Promise<void> {
  // setContent alone is enough for offline fixtures (no network).
  await page.setContent(html, { waitUntil: "domcontentloaded" });
}

export async function checkPlaywrightChromium(): Promise<{
  ok: boolean;
  message: string;
}> {
  try {
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    return { ok: true, message: "Chromium launches successfully" };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      message: `Chromium launch failed: ${message}`,
    };
  }
}
