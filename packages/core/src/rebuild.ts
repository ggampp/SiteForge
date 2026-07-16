import { mkdir, writeFile, copyFile, access } from "node:fs/promises";
import path from "node:path";
import type { ElementNode, ExtractionResult } from "./schema.js";
import { loadExtraction, loadRawHtml, sourceDir } from "./store.js";
import { downloadSourceAssets, chunkSource } from "./pipeline.js";
import { discoverAssetsFromExtraction } from "./assets.js";

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
  // Prefer layout-critical props; keep all captured for fidelity
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
    if (k.startsWith("on")) continue; // strip handlers
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
  const title =
    opts.title ?? extraction.metadata.title ?? "SiteForge rebuild";
  const lang = extraction.metadata.lang ?? "en";

  return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
  <meta name="generator" content="SiteForge" />
  <style>
    /* SiteForge rebuild baseline */
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
  /** Prefer raw.html when available (higher visual fidelity for many sites) */
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
  sectionCount: number;
}

/**
 * Rebuild a source into a static site directory (index.html + assets).
 */
export async function rebuildSource(
  options: RebuildOptions,
): Promise<RebuildResult> {
  const extraction = await loadExtraction(options.outDir, options.sourceId);
  const targetDir = path.resolve(options.targetDir);
  const assetsDir = path.join(targetDir, "assets");
  await mkdir(assetsDir, { recursive: true });

  let assetCount = 0;
  const urlMap = new Map<string, string>();

  if (options.downloadAssets !== false) {
    const discovered = discoverAssetsFromExtraction(extraction);
    assetCount = discovered.length;
    if (discovered.length > 0) {
      const dl = await downloadSourceAssets(options.outDir, options.sourceId, {
        targetDir: assetsDir,
      });
      for (const item of dl.downloaded) {
        const rel = path.posix.join(
          "assets",
          path.basename(item.path).replace(/\\/g, "/"),
        );
        urlMap.set(item.url, rel);
      }
      assetCount = dl.downloaded.length;
    }
  }

  // Copy original screenshots for QA reference
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
    // chunk optional for rebuild
  }

  const preferRaw = options.preferRawHtml ?? true;
  const raw = preferRaw
    ? await loadRawHtml(options.outDir, options.sourceId)
    : null;

  let html: string;
  let mode: "tree" | "raw" = "tree";

  if (raw) {
    mode = "raw";
    html = rewriteRawHtml(raw, urlMap, extraction.metadata.finalUrl ?? extraction.metadata.url);
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
        sectionCount: chunkCount,
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
- **sections:** ${chunkCount}

## Serve locally

\`\`\`bash
npx --yes serve .
# or: python -m http.server 4173
\`\`\`

Legitimate use only — authorized clones / demos.
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
    sectionCount: chunkCount,
  };
}

function rewriteRawHtml(
  html: string,
  urlMap: Map<string, string>,
  baseUrl: string,
): string {
  let out = html;
  // Longest URLs first to avoid partial replacements
  const entries = [...urlMap.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [abs, rel] of entries) {
    out = out.split(abs).join(rel);
    try {
      const u = new URL(abs);
      const pathOnly = u.pathname + u.search;
      if (pathOnly.length > 3) {
        out = out.split(`"${pathOnly}"`).join(`"${rel}"`);
        out = out.split(`'${pathOnly}'`).join(`'${rel}'`);
      }
    } catch {
      // ignore
    }
  }
  // Inject base tag + SiteForge marker after <head>
  if (!/<base\s/i.test(out)) {
    out = out.replace(
      /<head([^>]*)>/i,
      `<head$1>\n  <base href="./" />\n  <meta name="generator" content="SiteForge rebuild" />\n  <!-- original: ${baseUrl} -->\n`,
    );
  }
  return out;
}
