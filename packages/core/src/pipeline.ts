import path from "node:path";
import {
  chunkExtraction,
  type ChunkOptions,
  type ChunkResult,
  toSectionSummary,
} from "./chunk.js";
import {
  discoverAssetsFromExtraction,
  downloadAssets,
  type DiscoveredAsset,
  type DownloadResult,
} from "./assets.js";
import {
  loadExtraction,
  loadSection,
  listSections,
  persistAssetsManifest,
  persistSections,
  sourceDir,
} from "./store.js";
import { queryExtraction } from "./query.js";
import type { Section } from "./schema.js";

export async function chunkSource(
  outDir: string,
  sourceId: string,
  options: ChunkOptions = {},
): Promise<
  ChunkResult & {
    indexPath: string;
    sectionPaths: string[];
    summaries: Section[];
  }
> {
  const extraction = await loadExtraction(outDir, sourceId);
  const result = chunkExtraction(extraction, options);
  const { sectionPaths, indexPath } = await persistSections(
    outDir,
    sourceId,
    result.sections,
    result.pageHeight,
    result.validation,
  );
  const summaries = result.sections.map((s, i) =>
    toSectionSummary(s, sectionPaths[i]),
  );
  return { ...result, indexPath, sectionPaths, summaries };
}

export async function getSectionsList(outDir: string, sourceId: string) {
  // auto-chunk if missing?
  try {
    return await listSections(outDir, sourceId);
  } catch {
    const chunked = await chunkSource(outDir, sourceId);
    return {
      sourceId,
      pageHeight: chunked.pageHeight,
      validation: chunked.validation,
      sections: chunked.summaries.map((s) => ({
        ...s,
        textSummary: chunked.sections.find((d) => d.sectionId === s.sectionId)
          ?.textSummary,
        images: chunked.sections.find((d) => d.sectionId === s.sectionId)
          ?.images,
      })),
    };
  }
}

export async function getSectionDetail(
  outDir: string,
  sourceId: string,
  sectionId: string,
) {
  try {
    return await loadSection(outDir, sourceId, sectionId);
  } catch {
    await chunkSource(outDir, sourceId);
    return loadSection(outDir, sourceId, sectionId);
  }
}

export async function discoverSourceAssets(outDir: string, sourceId: string) {
  const extraction = await loadExtraction(outDir, sourceId);
  const assets = discoverAssetsFromExtraction(extraction);
  return { ok: true as const, sourceId, count: assets.length, assets };
}

export async function downloadSourceAssets(
  outDir: string,
  sourceId: string,
  opts: {
    targetDir?: string;
    assetUrls?: string[];
    concurrency?: number;
  } = {},
): Promise<DownloadResult & { ok: true }> {
  const extraction = await loadExtraction(outDir, sourceId);
  let assets: DiscoveredAsset[] = discoverAssetsFromExtraction(extraction);
  if (opts.assetUrls?.length) {
    const allow = new Set(opts.assetUrls);
    assets = assets.filter((a) => allow.has(a.url));
    // also allow explicit URLs not in tree
    for (const url of opts.assetUrls) {
      if (!assets.some((a) => a.url === url)) {
        assets.push({ url, kind: "other", source: "explicit" });
      }
    }
  }
  const targetDir =
    opts.targetDir ?? path.join(sourceDir(outDir, sourceId), "assets");
  const result = await downloadAssets({
    sourceId,
    assets,
    targetDir,
    concurrency: opts.concurrency ?? 4,
  });
  await persistAssetsManifest(
    outDir,
    sourceId,
    result.manifest,
    result.manifestPath,
  );
  return { ok: true, ...result };
}

export async function querySource(
  outDir: string,
  sourceId: string,
  pathExpr: string,
) {
  const extraction = await loadExtraction(outDir, sourceId);
  return queryExtraction(extraction, pathExpr);
}

export async function getPageMetadata(outDir: string, sourceId: string) {
  const extraction = await loadExtraction(outDir, sourceId);
  return {
    ok: true as const,
    sourceId,
    metadata: extraction.metadata,
    stats: extraction.stats,
    screenshots: extraction.screenshots,
  };
}
