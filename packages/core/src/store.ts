import { mkdir, readFile, writeFile, readdir, access } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import {
  ExtractionResultSchema,
  SourceMetaSchema,
  type ExtractionResult,
  type SourceMeta,
  type Viewport,
} from "./schema.js";
import type { SectionDetail } from "./chunk.js";
import type { AssetsManifest } from "./assets.js";
import { SiteForgeException } from "./errors.js";

export function createSourceId(prefix = "src"): string {
  const ts = Date.now().toString(36);
  const rand = randomBytes(4).toString("hex");
  return `${prefix}_${ts}_${rand}`;
}

export function sourcesRoot(outDir: string): string {
  return path.join(outDir, "sources");
}

export function sourceDir(outDir: string, sourceId: string): string {
  return path.join(sourcesRoot(outDir), sourceId);
}

export function sectionsDir(outDir: string, sourceId: string): string {
  return path.join(sourceDir(outDir, sourceId), "sections");
}

export async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

export interface PersistExtractionInput {
  outDir: string;
  url: string;
  title: string;
  viewport: Viewport;
  result: ExtractionResult;
  rawHtml?: string;
}

export async function persistExtraction(
  input: PersistExtractionInput,
): Promise<SourceMeta> {
  const { outDir, url, title, viewport, result, rawHtml } = input;
  const dir = sourceDir(outDir, result.sourceId);
  const screenshotsDir = path.join(dir, "screenshots");
  await ensureDir(screenshotsDir);

  const metaPath = path.join(dir, "meta.json");
  const extractionPath = path.join(dir, "extraction.json");
  const rawHtmlPath = path.join(dir, "raw.html");
  const now = new Date().toISOString();

  let existingCreated = now;
  if (await pathExists(metaPath)) {
    try {
      const prev = SourceMetaSchema.parse(JSON.parse(await readFile(metaPath, "utf8")));
      existingCreated = prev.createdAt;
    } catch {
      // ignore
    }
  }

  if (rawHtml !== undefined) {
    await writeFile(rawHtmlPath, rawHtml, "utf8");
  }

  const meta: SourceMeta = {
    sourceId: result.sourceId,
    url,
    title,
    createdAt: existingCreated,
    updatedAt: now,
    viewport,
    phase: "extracted",
    paths: {
      meta: metaPath,
      extraction: extractionPath,
      screenshotsDir,
      rawHtml: rawHtml !== undefined || (await pathExists(rawHtmlPath))
        ? rawHtmlPath
        : undefined,
    },
  };

  SourceMetaSchema.parse(meta);
  ExtractionResultSchema.parse(result);

  await writeFile(metaPath, JSON.stringify(meta, null, 2), "utf8");
  await writeFile(extractionPath, JSON.stringify(result, null, 2), "utf8");

  return meta;
}

export async function loadSourceMeta(
  outDir: string,
  sourceId: string,
): Promise<SourceMeta> {
  const metaPath = path.join(sourceDir(outDir, sourceId), "meta.json");
  if (!(await pathExists(metaPath))) {
    throw new SiteForgeException(
      "SOURCE_NOT_FOUND",
      `Source not found: ${sourceId}`,
      `Check list of sources under ${sourcesRoot(outDir)}`,
    );
  }
  const raw = await readFile(metaPath, "utf8");
  return SourceMetaSchema.parse(JSON.parse(raw));
}

export async function loadExtraction(
  outDir: string,
  sourceId: string,
): Promise<ExtractionResult> {
  const extractionPath = path.join(
    sourceDir(outDir, sourceId),
    "extraction.json",
  );
  if (!(await pathExists(extractionPath))) {
    throw new SiteForgeException(
      "SOURCE_NOT_FOUND",
      `Extraction not found for: ${sourceId}`,
    );
  }
  const raw = await readFile(extractionPath, "utf8");
  return ExtractionResultSchema.parse(JSON.parse(raw));
}

export async function loadRawHtml(
  outDir: string,
  sourceId: string,
): Promise<string | null> {
  const p = path.join(sourceDir(outDir, sourceId), "raw.html");
  if (!(await pathExists(p))) return null;
  return readFile(p, "utf8");
}

export async function listSourceIds(outDir: string): Promise<string[]> {
  const root = sourcesRoot(outDir);
  if (!(await pathExists(root))) return [];
  const entries = await readdir(root, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
}

export async function persistSections(
  outDir: string,
  sourceId: string,
  sections: SectionDetail[],
  pageHeight: number,
  validation: unknown,
): Promise<{ sectionPaths: string[]; indexPath: string }> {
  const dir = sectionsDir(outDir, sourceId);
  await ensureDir(dir);

  const sectionPaths: string[] = [];
  for (const section of sections) {
    const filePath = path.join(dir, `${section.sectionId}.json`);
    const payload = { ...section, path: filePath };
    await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
    sectionPaths.push(filePath);
  }

  const indexPath = path.join(dir, "index.json");
  await writeFile(
    indexPath,
    JSON.stringify(
      {
        sourceId,
        pageHeight,
        validation,
        sections: sections.map((s, i) => ({
          sectionId: s.sectionId,
          selector: s.selector,
          rect: s.rect,
          estimatedTokens: s.estimatedTokens,
          path: sectionPaths[i],
          textSummary: s.textSummary,
          images: s.images,
        })),
      },
      null,
      2,
    ),
    "utf8",
  );

  // update meta phase
  const meta = await loadSourceMeta(outDir, sourceId);
  meta.phase = "chunked";
  meta.updatedAt = new Date().toISOString();
  meta.paths.sectionsDir = dir;
  meta.paths.sectionsIndex = indexPath;
  await writeFile(meta.paths.meta, JSON.stringify(meta, null, 2), "utf8");

  return { sectionPaths, indexPath };
}

export async function listSections(
  outDir: string,
  sourceId: string,
): Promise<{
  sourceId: string;
  pageHeight: number;
  validation: unknown;
  sections: Array<{
    sectionId: string;
    selector?: string;
    rect?: { x: number; y: number; width: number; height: number };
    estimatedTokens: number;
    path?: string;
    textSummary?: string;
    images?: string[];
  }>;
}> {
  const indexPath = path.join(sectionsDir(outDir, sourceId), "index.json");
  if (!(await pathExists(indexPath))) {
    throw new SiteForgeException(
      "SECTION_NOT_FOUND",
      `No sections for source ${sourceId}`,
      "Run chunk first: siteforge chunk <sourceId>",
    );
  }
  return JSON.parse(await readFile(indexPath, "utf8")) as {
    sourceId: string;
    pageHeight: number;
    validation: unknown;
    sections: Array<{
      sectionId: string;
      selector?: string;
      rect?: { x: number; y: number; width: number; height: number };
      estimatedTokens: number;
      path?: string;
      textSummary?: string;
      images?: string[];
    }>;
  };
}

export async function loadSection(
  outDir: string,
  sourceId: string,
  sectionId: string,
): Promise<SectionDetail> {
  const filePath = path.join(
    sectionsDir(outDir, sourceId),
    `${sectionId}.json`,
  );
  if (!(await pathExists(filePath))) {
    throw new SiteForgeException(
      "SECTION_NOT_FOUND",
      `Section ${sectionId} not found for ${sourceId}`,
    );
  }
  return JSON.parse(await readFile(filePath, "utf8")) as SectionDetail;
}

export async function persistAssetsManifest(
  outDir: string,
  sourceId: string,
  manifest: AssetsManifest,
  manifestPath: string,
): Promise<void> {
  const dir = sourceDir(outDir, sourceId);
  const storeManifest = path.join(dir, "assets-manifest.json");
  await writeFile(storeManifest, JSON.stringify(manifest, null, 2), "utf8");

  const meta = await loadSourceMeta(outDir, sourceId);
  meta.phase = "assets";
  meta.updatedAt = new Date().toISOString();
  meta.paths.assetsManifest = storeManifest;
  meta.paths.assetsDir = manifest.targetDir;
  // keep copy path note
  void manifestPath;
  await writeFile(meta.paths.meta, JSON.stringify(meta, null, 2), "utf8");
}
