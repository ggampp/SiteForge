import { mkdir, writeFile, copyFile, access } from "node:fs/promises";
import path from "node:path";
import type { ElementNode, ExtractionResult } from "./schema.js";
import { loadExtraction, loadRawHtml, sourceDir } from "./store.js";
import { chunkSource } from "./pipeline.js";
import {
  downloadAssets,
  discoverAssetsFromExtraction,
  type DiscoveredAsset,
} from "./assets.js";
import {
  discoverStylesheetUrlsFromHtml,
  extractUrlsFromCss,
  fetchText,
  loadStylesheetBundle,
  rewriteCssUrls,
} from "./css.js";

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function stylesToInline(styles?: Record<string, string>): string {
  if (!styles) return "";
  return Object.entries(styles)
    .map(([k, v]) => {
      const cssKey = k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `${cssKey}:${v}`;
    })
    .join(";");
}

function rewriteUrl(
  url: string | undefined,
  urlMap: Map<string, string>,
  baseUrl: string,
): string | undefined {
  if (!url) return url;
  if (url.startsWith("data:")) return url;
  try {
    const abs = new URL(url, baseUrl).href;
    return urlMap.get(abs) ?? urlMap.get(url) ?? url;
  } catch {
    return url;
  }
}

export function elementToHtml(
  node: ElementNode,
  urlMap: Map<string, string>,
  baseUrl: string,
): string {
  const tag = node.tag || "div";
  if (tag === "script" || tag === "noscript") return "";

  const attrs: string[] = [];
  if (node.id) attrs.push(`id="${escapeHtml(node.id)}"`);
  if (node.classes?.length)
    attrs.push(`class="${escapeHtml(node.classes.join(" "))}"`);

  const attributes = { ...(node.attributes ?? {}) };
  for (const key of ["src", "href", "poster"]) {
    if (attributes[key]) {
      const rewritten = rewriteUrl(attributes[key], urlMap, baseUrl);
      if (rewritten) attributes[key] = rewritten;
    }
  }
  if (attributes.srcset) {
    attributes.srcset = attributes.srcset
      .split(",")
      .map((part) => {
        const [u, d] = part.trim().split(/\s+/);
        const rw = rewriteUrl(u, urlMap, baseUrl) ?? u;
        return d ? `${rw} ${d}` : rw;
      })
      .join(", ");
  }

  for (const [k, v] of Object.entries(attributes)) {
    if (k.startsWith("on")) continue;
    attrs.push(`${k}="${escapeHtml(v)}"`);
  }

  const style = stylesToInline(node.styles);
  if (style) attrs.push(`style="${escapeHtml(style)}"`);

  const attrStr = attrs.length ? " " + attrs.join(" ") : "";

  if (VOID_TAGS.has(tag)) {
    return `<${tag}${attrStr} />`;
  }

  const kids = (node.children ?? [])
    .map((c) => elementToHtml(c, urlMap, baseUrl))
    .join("");
  const text = node.text ? escapeHtml(node.text) : "";
  return `<${tag}${attrStr}>${text}${kids}</${tag}>`;
}

export function extractionToHtmlDocument(
  extraction: ExtractionResult,
  urlMap: Map<string, string>,
  opts: { title?: string; extraCss?: string } = {},
): string {
  const baseUrl = extraction.metadata.finalUrl ?? extraction.metadata.url;
  const body = elementToHtml(extraction.root, urlMap, baseUrl);
  const title = opts.title ?? extraction.metadata.title ?? "SiteForge rebuild";
  const lang = extraction.metadata.lang ?? "en";

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="generator" content="SiteForge" />
  <link rel="stylesheet" href="assets/siteforge-offline.css" />
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    img, video { max-width: 100%; height: auto; }
    ${opts.extraCss ?? ""}
  </style>
</head>
${body.startsWith("<body") ? body : `<body>${body}</body>`}
</html>
`;
}

export interface RebuildOptions {
  outDir: string;
  sourceId: string;
  targetDir: string;
  preferRawHtml?: boolean;
  downloadAssets?: boolean;
  siteSlug: string;
}

export interface RebuildResult {
  ok: true;
  sourceId: string;
  siteSlug: string;
  targetDir: string;
  indexHtml: string;
  assetsDir: string;
  mode: "tree" | "raw";
  assetCount: number;
  cssBytes: number;
  sectionCount: number;
}

/**
 * Rebuild a source into a static site with offline CSS + assets.
 */
export async function rebuildSource(
  options: RebuildOptions,
): Promise<RebuildResult> {
  const extraction = await loadExtraction(options.outDir, options.sourceId);
  const baseUrl = extraction.metadata.finalUrl ?? extraction.metadata.url;
  const targetDir = path.resolve(options.targetDir);
  const assetsDir = path.join(targetDir, "assets");
  await mkdir(assetsDir, { recursive: true });

  const urlMap = new Map<string, string>();
  let assetCount = 0;

  const raw =
    (options.preferRawHtml ?? true)
      ? await loadRawHtml(options.outDir, options.sourceId)
      : null;

  // --- Collect stylesheet URLs (HTML + capture + tree) ---
  const cssUrlSet = new Set<string>();
  if (raw) {
    for (const u of discoverStylesheetUrlsFromHtml(raw, baseUrl)) cssUrlSet.add(u);
  }
  const bundle = await loadStylesheetBundle(
    sourceDir(options.outDir, options.sourceId),
  );
  if (bundle) {
    for (const s of bundle.sheets) {
      if (s.absoluteUrl) cssUrlSet.add(s.absoluteUrl);
    }
  }
  for (const a of discoverAssetsFromExtraction(extraction)) {
    if (a.kind === "stylesheet") cssUrlSet.add(a.url);
  }

  // --- Download / assemble CSS offline ---
  const cssChunks: string[] = [];
  const nestedAssetUrls = new Set<string>();

  // Prefer fully captured combined CSS first
  if (bundle?.combinedCss?.trim()) {
    cssChunks.push(`/* captured readable stylesheets */\n${bundle.combinedCss}`);
    for (const u of extractUrlsFromCss(bundle.combinedCss, baseUrl)) {
      nestedAssetUrls.add(u);
    }
  }

  // Fetch any linked stylesheets (CORS-safe via HTTP from Node)
  let cssIndex = 0;
  for (const cssUrl of cssUrlSet) {
    // Skip if we already have substantial captured text for this exact href
    const captured = bundle?.sheets.find(
      (s) => s.absoluteUrl === cssUrl && (s.css?.length ?? 0) > 200,
    );
    if (captured?.css) {
      // already in combinedCss ideally; still extract nested urls
      for (const u of extractUrlsFromCss(captured.css, cssUrl)) {
        nestedAssetUrls.add(u);
      }
      continue;
    }
    try {
      const text = await fetchText(cssUrl);
      cssChunks.push(`/* fetched: ${cssUrl} */\n${text}`);
      for (const u of extractUrlsFromCss(text, cssUrl)) {
        nestedAssetUrls.add(u);
      }
      // map original css url to offline file (we'll also inject combined)
      const localName = `css_${String(cssIndex++).padStart(3, "0")}.css`;
      const localPath = path.join(assetsDir, localName);
      await writeFile(localPath, text, "utf8");
      urlMap.set(cssUrl, `assets/${localName}`);
    } catch {
      // leave remote reference; injection may still cover from capture
    }
  }

  // --- Image/video/font assets from tree + nested CSS urls ---
  const media: DiscoveredAsset[] = [];
  if (options.downloadAssets !== false) {
    media.push(...discoverAssetsFromExtraction(extraction));
    for (const u of nestedAssetUrls) {
      const kind = /\.(woff2?|ttf|otf|eot)(\?|$)/i.test(u)
        ? ("font" as const)
        : /\.(css)(\?|$)/i.test(u)
          ? ("stylesheet" as const)
          : ("image" as const);
      if (kind === "stylesheet") {
        // nested @import CSS — fetch and append
        try {
          const text = await fetchText(u);
          cssChunks.push(`/* @import nested: ${u} */\n${text}`);
          for (const nu of extractUrlsFromCss(text, u)) nestedAssetUrls.add(nu);
        } catch {
          // ignore
        }
        continue;
      }
      media.push({ url: u, kind, source: "css-url()" });
    }

    // dedupe
    const seen = new Set<string>();
    const unique = media.filter((a) => {
      if (seen.has(a.url)) return false;
      seen.add(a.url);
      return a.kind !== "stylesheet";
    });

    if (unique.length > 0) {
      const dl = await downloadAssets({
        sourceId: options.sourceId,
        assets: unique,
        targetDir: assetsDir,
        concurrency: 6,
      });
      for (const item of dl.downloaded) {
        const rel = path.posix.join("assets", path.basename(item.path));
        urlMap.set(item.url, rel);
      }
      assetCount += dl.downloaded.length;
    }
  }

  // Rewrite offline CSS with local asset paths (use page base for relative resolution)
  let offlineCss = cssChunks.join("\n\n");
  offlineCss = rewriteCssUrls(offlineCss, baseUrl, urlMap);
  // Also try rewriting against each css origin
  for (const cssUrl of cssUrlSet) {
    offlineCss = rewriteCssUrls(offlineCss, cssUrl, urlMap);
  }

  const offlineCssRel = "assets/siteforge-offline.css";
  await writeFile(path.join(assetsDir, "siteforge-offline.css"), offlineCss, "utf8");
  const cssBytes = Buffer.byteLength(offlineCss);

  // Copy reference screenshots
  const shotDir = path.join(sourceDir(options.outDir, options.sourceId), "screenshots");
  const refDir = path.join(targetDir, "_reference");
  await mkdir(refDir, { recursive: true });
  for (const name of ["viewport.png", "full.png"]) {
    const src = path.join(shotDir, name);
    try {
      await access(src);
      await copyFile(src, path.join(refDir, name));
    } catch {
      // optional
    }
  }

  let chunkCount = 0;
  try {
    const chunked = await chunkSource(options.outDir, options.sourceId);
    chunkCount = chunked.sections.length;
    await writeFile(
      path.join(targetDir, "sections.json"),
      JSON.stringify(
        {
          sourceId: options.sourceId,
          pageHeight: chunked.pageHeight,
          validation: chunked.validation,
          sections: chunked.summaries,
        },
        null,
        2,
      ),
      "utf8",
    );
  } catch {
    // optional
  }

  let html: string;
  let mode: "tree" | "raw" = "tree";

  if (raw) {
    mode = "raw";
    html = rewriteRawHtml(raw, urlMap, baseUrl, offlineCssRel);
  } else {
    html = extractionToHtmlDocument(extraction, urlMap, {
      title: extraction.metadata.title,
    });
  }

  const indexHtml = path.join(targetDir, "index.html");
  await writeFile(indexHtml, html, "utf8");

  await writeFile(
    path.join(targetDir, "siteforge.json"),
    JSON.stringify(
      {
        sourceId: options.sourceId,
        siteSlug: options.siteSlug,
        url: extraction.metadata.url,
        title: extraction.metadata.title,
        rebuiltAt: new Date().toISOString(),
        mode,
        assetCount,
        cssBytes,
        sectionCount: chunkCount,
        offlineCss: offlineCssRel,
      },
      null,
      2,
    ),
    "utf8",
  );

  await writeFile(
    path.join(targetDir, "README.md"),
    `# ${options.siteSlug}

SiteForge rebuild of \`${extraction.metadata.url}\`.

- **sourceId:** \`${options.sourceId}\`
- **mode:** ${mode}
- **assets:** ${assetCount}
- **offline CSS:** ${cssBytes} bytes → \`${offlineCssRel}\`
- **sections:** ${chunkCount}

## Serve locally

\`\`\`bash
npx --yes serve .
\`\`\`

CSS is inlined via \`assets/siteforge-offline.css\` so the clone works offline.
`,
    "utf8",
  );

  return {
    ok: true,
    sourceId: options.sourceId,
    siteSlug: options.siteSlug,
    targetDir,
    indexHtml,
    assetsDir,
    mode,
    assetCount,
    cssBytes,
    sectionCount: chunkCount,
  };
}

function rewriteRawHtml(
  html: string,
  urlMap: Map<string, string>,
  baseUrl: string,
  offlineCssHref: string,
): string {
  let out = html;

  // Map absolute + path-only + root-relative URLs
  const entries = [...urlMap.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [abs, rel] of entries) {
    out = out.split(abs).join(rel);
    try {
      const u = new URL(abs);
      const pathOnly = u.pathname + u.search;
      const pathNoQuery = u.pathname;
      if (pathOnly.length > 1) {
        out = out.split(`"${pathOnly}"`).join(`"${rel}"`);
        out = out.split(`'${pathOnly}'`).join(`'${rel}'`);
        out = out.split(`"${pathNoQuery}"`).join(`"${rel}"`);
        out = out.split(`'${pathNoQuery}'`).join(`'${rel}'`);
      }
    } catch {
      // ignore
    }
  }

  // Root-relative assets that match origin paths already handled via pathOnly.
  // Neutralize external stylesheet links (we inject offline CSS instead).
  out = out.replace(
    /<link\b[^>]*rel\s*=\s*["'][^"']*stylesheet[^"']*["'][^>]*>/gi,
    (tag) => `<!-- original stylesheet disabled: ${tag.replace(/<!--|-->/g, "")} -->`,
  );

  // Strip modulepreload / script that break offline clone and hide content
  // Keep optional: comment out module scripts that may error without network
  out = out.replace(
    /<script\b[^>]*type\s*=\s*["']module["'][^>]*>[\s\S]*?<\/script>/gi,
    (tag) => `<!-- ${tag.slice(0, 80)}… disabled for static clone -->`,
  );
  out = out.replace(
    /<link\b[^>]*rel\s*=\s*["']modulepreload["'][^>]*>/gi,
    (tag) => `<!-- ${tag} -->`,
  );

  const inject = `
  <base href="./" />
  <meta name="generator" content="SiteForge rebuild" />
  <!-- original: ${baseUrl} -->
  <link rel="stylesheet" href="${offlineCssHref}" data-siteforge="offline-css" />
  <style data-siteforge="baseline">
    html, body { margin: 0; padding: 0; }
    img, video { max-width: 100%; height: auto; }
  </style>
`;

  if (/<head[^>]*>/i.test(out)) {
    out = out.replace(/<head([^>]*)>/i, `<head$1>${inject}`);
  } else {
    out = `<!DOCTYPE html><html><head>${inject}</head>${out}`;
  }

  // Remove duplicate base tags if page had its own
  const bases = out.match(/<base\b[^>]*>/gi) ?? [];
  if (bases.length > 1) {
    let seen = 0;
    out = out.replace(/<base\b[^>]*>/gi, (b) => {
      seen += 1;
      return seen === 1 ? b : `<!-- ${b} -->`;
    });
  }

  return out;
}

