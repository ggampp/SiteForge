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
}

export async function persistExtraction(
  input: PersistExtractionInput,
): Promise<SourceMeta> {
  const { outDir, url, title, viewport, result } = input;
  const dir = sourceDir(outDir, result.sourceId);
  const screenshotsDir = path.join(dir, "screenshots");
  await ensureDir(screenshotsDir);

  const metaPath = path.join(dir, "meta.json");
  const extractionPath = path.join(dir, "extraction.json");
  const now = new Date().toISOString();

  const meta: SourceMeta = {
    sourceId: result.sourceId,
    url,
    title,
    createdAt: now,
    updatedAt: now,
    viewport,
    phase: "extracted",
    paths: {
      meta: metaPath,
      extraction: extractionPath,
      screenshotsDir,
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
  const raw = await readFile(metaPath, "utf8");
  return SourceMetaSchema.parse(JSON.parse(raw));
}

export async function loadExtraction(
  outDir: string,
  sourceId: string,
): Promise<ExtractionResult> {
  const extractionPath = path.join(sourceDir(outDir, sourceId), "extraction.json");
  const raw = await readFile(extractionPath, "utf8");
  return ExtractionResultSchema.parse(JSON.parse(raw));
}

export async function listSourceIds(outDir: string): Promise<string[]> {
  const root = sourcesRoot(outDir);
  if (!(await pathExists(root))) return [];
  const entries = await readdir(root, { withFileTypes: true });
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}
