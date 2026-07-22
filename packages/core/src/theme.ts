import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Page } from "playwright";
import { BrowserManager } from "./browser.js";
import { assertHttpUrl } from "./errors.js";
import { assertSafeHttpUrl } from "./ssrf.js";
import { captureScreenshots } from "./screenshots.js";

export interface CaptureThemeOptions {
  url: string;
  outDir?: string;
  sourceId?: string;
  viewport?: { width: number; height: number };
  waitMs?: number;
  timeoutMs?: number;
  headless?: boolean;
  allowLocalhost?: boolean;
  ssrfGuard?: boolean;
}

export interface ThemeCaptureResult {
  ok: true;
  url: string;
  supported: boolean;
  light: {
    colorScheme: string;
    screenshot?: string;
    cssVariables: Record<string, string>;
    backgroundColor?: string;
    color?: string;
  };
  dark: {
    colorScheme: string;
    screenshot?: string;
    cssVariables: Record<string, string>;
    backgroundColor?: string;
    color?: string;
  } | null;
  paths: {
    dir: string;
    report: string;
  };
}

async function readThemeSnapshot(page: Page): Promise<{
  colorScheme: string;
  cssVariables: Record<string, string>;
  backgroundColor?: string;
  color?: string;
}> {
  return page.evaluate(() => {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    const cssVariables: Record<string, string> = {};
    for (let i = 0; i < styles.length; i++) {
      const prop = styles.item(i);
      if (prop.startsWith("--")) {
        cssVariables[prop] = styles.getPropertyValue(prop).trim();
      }
    }
    // Also scan :root inline/style sheets for custom props not in computed list length quirks
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      let rules: CSSRuleList | undefined;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      if (!rules) continue;
      for (const rule of Array.from(rules)) {
        if (!(rule instanceof CSSStyleRule)) continue;
        if (!rule.selectorText.includes(":root") && rule.selectorText !== "html") {
          continue;
        }
        for (let j = 0; j < rule.style.length; j++) {
          const name = rule.style.item(j);
          if (name.startsWith("--") && !(name in cssVariables)) {
            cssVariables[name] = rule.style.getPropertyValue(name).trim();
          }
        }
      }
    }
    const body = document.body;
    const bodyStyles = body ? getComputedStyle(body) : null;
    return {
      colorScheme: styles.colorScheme || "normal",
      cssVariables,
      backgroundColor: bodyStyles?.backgroundColor,
      color: bodyStyles?.color,
    };
  });
}

async function applyScheme(page: Page, scheme: "light" | "dark"): Promise<void> {
  await page.emulateMedia({ colorScheme: scheme });
  await page.evaluate((s) => {
    document.documentElement.dataset.theme = s;
    document.documentElement.style.colorScheme = s;
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(s);
    // Common toggles
    if (s === "dark") {
      document.documentElement.classList.add("dark");
    }
  }, scheme);
}

/**
 * Capture light + dark theme snapshots (emulated color-scheme + common class toggles).
 */
export async function captureTheme(
  options: CaptureThemeOptions,
): Promise<ThemeCaptureResult> {
  assertHttpUrl(options.url);
  assertSafeHttpUrl(options.url, {
    allowLocalhost: options.allowLocalhost ?? true,
    enabled: options.ssrfGuard ?? true,
  });

  const viewport = options.viewport ?? { width: 1440, height: 900 };
  const outRoot = options.outDir ?? ".siteforge";
  const dir = path.join(
    outRoot,
    "theme-captures",
    options.sourceId ?? `theme_${Date.now().toString(36)}`,
  );
  await mkdir(dir, { recursive: true });

  const manager = new BrowserManager({
    headless: options.headless ?? true,
    viewport,
  });

  try {
    const { page } = await manager.newPage();
    await page.goto(options.url, {
      waitUntil: "domcontentloaded",
      timeout: options.timeoutMs ?? 60_000,
    });
    if (options.waitMs) {
      await page.waitForTimeout(options.waitMs);
    }

    await applyScheme(page, "light");
    const lightSnap = await readThemeSnapshot(page);
    const lightShots = await captureScreenshots(page, {
      dir: path.join(dir, "light"),
      fullPage: false,
    });

    await applyScheme(page, "dark");
    const darkSnap = await readThemeSnapshot(page);
    const darkShots = await captureScreenshots(page, {
      dir: path.join(dir, "dark"),
      fullPage: false,
    });

    const supported =
      lightSnap.colorScheme !== darkSnap.colorScheme ||
      lightSnap.backgroundColor !== darkSnap.backgroundColor ||
      lightSnap.color !== darkSnap.color ||
      JSON.stringify(lightSnap.cssVariables) !==
        JSON.stringify(darkSnap.cssVariables);

    const result: ThemeCaptureResult = {
      ok: true,
      url: options.url,
      supported,
      light: {
        ...lightSnap,
        screenshot: lightShots.viewport,
      },
      dark: {
        ...darkSnap,
        screenshot: darkShots.viewport,
      },
      paths: {
        dir,
        report: path.join(dir, "theme-report.json"),
      },
    };

    await writeFile(result.paths.report, JSON.stringify(result, null, 2), "utf8");
    return result;
  } finally {
    await manager.close();
  }
}
