import type { Page } from "playwright";

export interface LazyScrollOptions {
  /** Max scroll iterations (safety) */
  maxSteps?: number;
  /** Pause between steps to allow lazy content */
  stepDelayMs?: number;
  /** Scroll back to top after finishing */
  returnToTop?: boolean;
}

/**
 * Scroll the page in viewport-sized steps so lazy-loaded content mounts.
 */
export async function lazyScrollPage(
  page: Page,
  options: LazyScrollOptions = {},
): Promise<{ steps: number; scrollHeight: number }> {
  const maxSteps = options.maxSteps ?? 40;
  const stepDelayMs = options.stepDelayMs ?? 150;
  const returnToTop = options.returnToTop ?? true;

  const result = await page.evaluate(async (params) => {
    const { maxSteps: max, stepDelayMs: delay } = params;
    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    let steps = 0;
    let lastHeight = 0;

    for (let i = 0; i < max; i++) {
      const height = Math.max(
        document.body?.scrollHeight ?? 0,
        document.documentElement?.scrollHeight ?? 0,
      );
      const viewport = window.innerHeight || 800;
      const top = window.scrollY || document.documentElement.scrollTop || 0;

      if (top + viewport >= height - 2 && height === lastHeight && i > 0) {
        break;
      }

      window.scrollTo(0, Math.min(top + viewport * 0.9, height));
      steps += 1;
      lastHeight = height;
      await sleep(delay);
    }

    const scrollHeight = Math.max(
      document.body?.scrollHeight ?? 0,
      document.documentElement?.scrollHeight ?? 0,
    );
    return { steps, scrollHeight };
  }, { maxSteps, stepDelayMs });

  if (returnToTop) {
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    if (stepDelayMs > 0) {
      await page.waitForTimeout(Math.min(stepDelayMs, 200));
    }
  }

  return result;
}
