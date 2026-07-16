import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import type { Page } from "playwright";
import { pathExists } from "./store.js";

export interface CapturedStylesheet {
  href: string | null;
  /** Absolute URL when known */
  absoluteUrl?: string;
  /** Full CSS text when readable (inline or same-origin / readable rules) */
  css: string | null;
  origin: "style-tag" | "link" | "stylesheet-api";
  error?: string;
}

export interface StylesheetBundle {
  capturedAt: string;
  baseUrl: string;
  sheets: CapturedStylesheet[];
  /** Combined offline CSS (best-effort) */
  combinedCss: string;
}

const CSS_URL_RE = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;
const IMPORT_RE = /@import\s+(?:url\()?['"]?([^'"\)]+)['"]?\)?[^;]*;/gi;
const LINK_CSS_RE =
  /<link\b[^>]*rel\s*=\s*["'][^"']*stylesheet[^"']*["'][^>]*>/gi;
const HREF_RE = /href\s*=\s*["']([^"']+)["']/i;

/**
 * Capture stylesheets from the live page (inline + readable cssRules + link hrefs).
 */
export async function captureStylesheets(
  page: Page,
  baseUrl: string,
): Promise<StylesheetBundle> {
  const sheets = await page.evaluate(() => {
    const out: Array<{
      href: string | null;
      css: string | null;
      origin: "style-tag" | "link" | "stylesheet-api";
      error?: string;
    }> = [];

    // <style> tags
    document.querySelectorAll("style").forEach((el) => {
      out.push({
        href: null,
        css: el.textContent ?? "",
        origin: "style-tag",
      });
    });

    // <link rel=stylesheet>
    document.querySelectorAll('link[rel~="stylesheet"]').forEach((el) => {
      const href = (el as HTMLLinkElement).href || el.getAttribute("href");
      out.push({
        href,
        css: null,
        origin: "link",
      });
    });

    // document.styleSheets — may get full cssText for same-origin
    for (const sheet of Array.from(document.styleSheets)) {
      const href = sheet.href;
      try {
        const rules = sheet.cssRules;
        if (!rules) continue;
        const css = Array.from(rules)
          .map((r) => r.cssText)
          .join("\n");
        // Avoid duplicate empty entries if we already have link with same href
        out.push({
          href,
          css: css || null,
          origin: "stylesheet-api",
        });
      } catch {
        out.push({
          href,
          css: null,
          origin: "stylesheet-api",
          error: "cors-or-unreadable",
        });
      }
    }

    return out;
  });

  const normalized: CapturedStylesheet[] = sheets.map((s) => {
    let absoluteUrl: string | undefined;
    if (s.href) {
      try {
        absoluteUrl = new URL(s.href, baseUrl).href;
      } catch {
        absoluteUrl = s.href;
      }
    }
    return { ...s, absoluteUrl };
  });

  // Prefer stylesheet-api CSS when available for a given href
  const byKey = new Map<string, CapturedStylesheet>();
  for (const s of normalized) {
    const key = s.absoluteUrl ?? `inline:${byKey.size}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, s);
      continue;
    }
    // Keep the one with more CSS text
    if ((s.css?.length ?? 0) > (prev.css?.length ?? 0)) {
      byKey.set(key, { ...prev, ...s, css: s.css });
    }
  }

  const merged = [...byKey.values()];
  const combinedParts: string[] = [];
  for (const s of merged) {
    if (s.css && s.css.trim()) {
      const label = s.absoluteUrl ?? s.href ?? "inline";
      combinedParts.push(`/* source: ${label} */\n${s.css}`);
    }
  }

  return {
    capturedAt: new Date().toISOString(),
    baseUrl,
    sheets: merged,
    combinedCss: combinedParts.join("\n\n"),
  };
}

export async function persistStylesheets(
  sourceDirPath: string,
  bundle: StylesheetBundle,
): Promise<{ jsonPath: string; cssPath: string }> {
  await mkdir(sourceDirPath, { recursive: true });
  const jsonPath = path.join(sourceDirPath, "stylesheets.json");
  const cssPath = path.join(sourceDirPath, "captured.css");
  await writeFile(jsonPath, JSON.stringify(bundle, null, 2), "utf8");
  await writeFile(cssPath, bundle.combinedCss, "utf8");
  return { jsonPath, cssPath };
}

export async function loadStylesheetBundle(
  sourceDirPath: string,
): Promise<StylesheetBundle | null> {
  const jsonPath = path.join(sourceDirPath, "stylesheets.json");
  if (!(await pathExists(jsonPath))) return null;
  return JSON.parse(await readFile(jsonPath, "utf8")) as StylesheetBundle;
}

/** Extract stylesheet URLs from HTML link tags. */
export function discoverStylesheetUrlsFromHtml(
  html: string,
  baseUrl: string,
): string[] {
  const urls = new Set<string>();
  let m: RegExpExecArray | null;
  LINK_CSS_RE.lastIndex = 0;
  while ((m = LINK_CSS_RE.exec(html)) !== null) {
    const tag = m[0];
    const hm = HREF_RE.exec(tag);
    if (!hm?.[1]) continue;
    try {
      urls.add(new URL(hm[1], baseUrl).href);
    } catch {
      // skip
    }
  }
  return [...urls];
}

export function extractUrlsFromCss(css: string, baseUrl: string): string[] {
  const urls = new Set<string>();
  let m: RegExpExecArray | null;

  CSS_URL_RE.lastIndex = 0;
  while ((m = CSS_URL_RE.exec(css)) !== null) {
    const raw = m[2]?.trim();
    if (!raw || raw.startsWith("data:")) continue;
    try {
      urls.add(new URL(raw, baseUrl).href);
    } catch {
      // skip
    }
  }

  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(css)) !== null) {
    const raw = m[1]?.trim();
    if (!raw || raw.startsWith("data:")) continue;
    try {
      urls.add(new URL(raw, baseUrl).href);
    } catch {
      // skip
    }
  }

  return [...urls];
}

/**
 * Rewrite url(...) and @import in CSS using a absoluteUrl → relativePath map.
 */
export function rewriteCssUrls(
  css: string,
  baseUrl: string,
  urlMap: Map<string, string>,
): string {
  let out = css;

  out = out.replace(CSS_URL_RE, (full, quote: string, raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("data:")) return full;
    try {
      const abs = new URL(trimmed, baseUrl).href;
      const rel = urlMap.get(abs);
      if (!rel) return full;
      const q = quote || '"';
      return `url(${q}${rel}${q})`;
    } catch {
      return full;
    }
  });

  out = out.replace(IMPORT_RE, (full, raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("data:")) return full;
    try {
      const abs = new URL(trimmed, baseUrl).href;
      const rel = urlMap.get(abs);
      if (!rel) return full;
      return `@import url("${rel}");`;
    } catch {
      return full;
    }
  });

  return out;
}

export async function fetchText(
  url: string,
  timeoutMs = 30_000,
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "SiteForge/0.1 (+https://github.com/ggampp/SiteForge)",
        Accept: "text/css,*/*",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}
