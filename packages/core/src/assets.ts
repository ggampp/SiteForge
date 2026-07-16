import { createWriteStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import type { ElementNode, ExtractionResult } from "./schema.js";
import { SiteForgeException } from "./errors.js";

export type AssetKind = "image" | "video" | "font" | "other";

export interface DiscoveredAsset {
  url: string;
  kind: AssetKind;
  source: string;
}

export interface AssetsManifest {
  sourceId: string;
  targetDir: string;
  createdAt: string;
  assets: Array<{
    url: string;
    kind: AssetKind;
    path?: string;
    bytes?: number;
    ok: boolean;
    error?: string;
  }>;
}

export interface DownloadResult {
  downloaded: Array<{ url: string; path: string; bytes: number; kind: AssetKind }>;
  failed: Array<{ url: string; error: string; kind: AssetKind }>;
  manifestPath: string;
  manifest: AssetsManifest;
}

const BG_URL_RE = /url\(\s*["']?([^"')]+)["']?\s*\)/gi;

function resolveUrl(raw: string, baseUrl: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.startsWith("data:")) return null;
  try {
    return new URL(trimmed, baseUrl).href;
  } catch {
    return null;
  }
}

function kindFromUrl(url: string, hint?: AssetKind): AssetKind {
  if (hint) return hint;
  const lower = url.toLowerCase();
  if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(lower)) return "font";
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(lower)) return "video";
  if (/\.(png|jpe?g|gif|webp|svg|avif|ico|bmp)(\?|$)/i.test(lower)) return "image";
  return "other";
}

export function discoverAssetsFromTree(
  root: ElementNode,
  baseUrl: string,
): DiscoveredAsset[] {
  const map = new Map<string, DiscoveredAsset>();

  function add(raw: string | undefined, kind: AssetKind, source: string): void {
    if (!raw) return;
    const abs = resolveUrl(raw, baseUrl);
    if (!abs) return;
    if (!map.has(abs)) {
      map.set(abs, { url: abs, kind: kindFromUrl(abs, kind), source });
    }
  }

  function walk(n: ElementNode): void {
    if (n.tag === "img") {
      add(n.attributes?.src, "image", "img[src]");
      add(n.attributes?.["data-src"], "image", "img[data-src]");
      add(n.attributes?.srcset?.split(",")[0]?.trim().split(/\s+/)[0], "image", "img[srcset]");
    }
    if (n.tag === "video" || n.tag === "source" || n.tag === "audio") {
      add(n.attributes?.src, "video", `${n.tag}[src]`);
    }
    if (n.tag === "link") {
      const rel = (n.attributes?.rel ?? "").toLowerCase();
      if (rel.includes("icon") || rel.includes("apple-touch-icon")) {
        add(n.attributes?.href, "image", "link[rel=icon]");
      }
      if (rel.includes("stylesheet") === false && /\.woff/i.test(n.attributes?.href ?? "")) {
        add(n.attributes?.href, "font", "link[href]");
      }
    }
    const bg = n.styles?.backgroundImage;
    if (bg && bg !== "none") {
      let m: RegExpExecArray | null;
      BG_URL_RE.lastIndex = 0;
      while ((m = BG_URL_RE.exec(bg)) !== null) {
        add(m[1], "image", "style.backgroundImage");
      }
    }
    for (const c of n.children ?? []) walk(c);
  }

  walk(root);
  return [...map.values()];
}

export function discoverAssetsFromExtraction(
  extraction: ExtractionResult,
): DiscoveredAsset[] {
  const base = extraction.metadata.finalUrl ?? extraction.metadata.url;
  return discoverAssetsFromTree(extraction.root, base);
}

function safeFileName(url: string, index: number): string {
  let name = "asset";
  try {
    const u = new URL(url);
    name = path.basename(u.pathname) || "asset";
  } catch {
    name = "asset";
  }
  name = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  if (!name || name === "." || name === "..") name = `asset_${index}`;
  if (!path.extname(name)) name += ".bin";
  return `${String(index).padStart(3, "0")}_${name}`;
}

/**
 * Ensure resolved path stays under targetDir (no path escape).
 */
export function resolveSafeTargetPath(targetDir: string, fileName: string): string {
  const root = path.resolve(targetDir);
  const full = path.resolve(root, fileName);
  if (full !== root && !full.startsWith(root + path.sep)) {
    throw new SiteForgeException(
      "PATH_ESCAPE",
      `Refusing path outside targetDir: ${fileName}`,
      "Use a plain file name without .. segments",
    );
  }
  return full;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]!, i);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(1, items.length)) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

export interface DownloadAssetsOptions {
  sourceId: string;
  assets: DiscoveredAsset[];
  targetDir: string;
  concurrency?: number;
  timeoutMs?: number;
  maxBytes?: number;
}

export async function downloadAssets(
  options: DownloadAssetsOptions,
): Promise<DownloadResult> {
  const concurrency = options.concurrency ?? 4;
  const timeoutMs = options.timeoutMs ?? 30_000;
  const maxBytes = options.maxBytes ?? 15 * 1024 * 1024;

  await mkdir(options.targetDir, { recursive: true });

  const results = await mapPool(options.assets, concurrency, async (asset, index) => {
    const fileName = safeFileName(asset.url, index);
    try {
      const dest = resolveSafeTargetPath(options.targetDir, fileName);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(asset.url, {
          signal: controller.signal,
          redirect: "follow",
          headers: { "User-Agent": "SiteForge/0.1 (+https://github.com/ggampp/SiteForge)" },
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const len = Number(res.headers.get("content-length") ?? 0);
        if (len > maxBytes) {
          throw new Error(`Content-Length ${len} exceeds maxBytes ${maxBytes}`);
        }
        if (!res.body) throw new Error("Empty body");

        const nodeStream = Readable.fromWeb(
          res.body as import("node:stream/web").ReadableStream,
        );
        await pipeline(nodeStream, createWriteStream(dest));

        const { size } = await import("node:fs/promises").then((fs) =>
          fs.stat(dest),
        );
        if (size > maxBytes) {
          await import("node:fs/promises").then((fs) => fs.unlink(dest).catch(() => undefined));
          throw new Error(`Downloaded size ${size} exceeds maxBytes ${maxBytes}`);
        }
        return {
          ok: true as const,
          url: asset.url,
          kind: asset.kind,
          path: dest,
          bytes: size,
        };
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        ok: false as const,
        url: asset.url,
        kind: asset.kind,
        error: message,
      };
    }
  });

  const downloaded: DownloadResult["downloaded"] = [];
  const failed: DownloadResult["failed"] = [];
  const manifestAssets: AssetsManifest["assets"] = [];

  for (const r of results) {
    if (r.ok) {
      downloaded.push({
        url: r.url,
        path: r.path,
        bytes: r.bytes,
        kind: r.kind,
      });
      manifestAssets.push({
        url: r.url,
        kind: r.kind,
        path: r.path,
        bytes: r.bytes,
        ok: true,
      });
    } else {
      failed.push({ url: r.url, error: r.error, kind: r.kind });
      manifestAssets.push({
        url: r.url,
        kind: r.kind,
        ok: false,
        error: r.error,
      });
    }
  }

  const manifest: AssetsManifest = {
    sourceId: options.sourceId,
    targetDir: options.targetDir,
    createdAt: new Date().toISOString(),
    assets: manifestAssets,
  };

  const manifestPath = path.join(options.targetDir, "assets-manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  return { downloaded, failed, manifestPath, manifest };
}
