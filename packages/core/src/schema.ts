import { z } from "zod";

/** Bounding box in CSS pixels */
export const RectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});
export type Rect = z.infer<typeof RectSchema>;

export const ViewportSchema = z.object({
  width: z.number().int().positive().default(1440),
  height: z.number().int().positive().default(900),
});
export type Viewport = z.infer<typeof ViewportSchema>;

/** Subset of computed styles kept in extract (expand in Phase 1) */
export const ComputedStylesSchema = z.record(z.string(), z.string());
export type ComputedStyles = z.infer<typeof ComputedStylesSchema>;

export const ElementNodeSchema: z.ZodType<ElementNode> = z.lazy(() =>
  z.object({
    tag: z.string(),
    id: z.string().optional(),
    classes: z.array(z.string()).default([]),
    attributes: z.record(z.string(), z.string()).default({}),
    text: z.string().optional(),
    rect: RectSchema.optional(),
    styles: ComputedStylesSchema.optional(),
    children: z.array(ElementNodeSchema).default([]),
  }),
);

export interface ElementNode {
  tag: string;
  id?: string;
  classes?: string[];
  attributes?: Record<string, string>;
  text?: string;
  rect?: Rect;
  styles?: ComputedStyles;
  children?: ElementNode[];
}

/** Allow real pages and offline fixture URLs (about:blank). */
const PageUrlSchema = z.string().min(1);

export const PageMetadataSchema = z.object({
  url: PageUrlSchema,
  finalUrl: PageUrlSchema.optional(),
  title: z.string().default(""),
  description: z.string().optional(),
  lang: z.string().optional(),
  viewport: ViewportSchema,
  extractedAt: z.string().datetime(),
  loadTimeMs: z.number().nonnegative().optional(),
  userAgent: z.string().optional(),
});
export type PageMetadata = z.infer<typeof PageMetadataSchema>;

export const ExtractionStatsSchema = z.object({
  totalElements: z.number().int().nonnegative(),
  maxDepth: z.number().int().nonnegative(),
  loadTimeMs: z.number().nonnegative().optional(),
});
export type ExtractionStats = z.infer<typeof ExtractionStatsSchema>;

export const ExtractionResultSchema = z.object({
  sourceId: z.string().min(1),
  metadata: PageMetadataSchema,
  root: ElementNodeSchema,
  stats: ExtractionStatsSchema,
  screenshots: z
    .object({
      viewport: z.string().optional(),
      fullPage: z.string().optional(),
    })
    .default({}),
});
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

export const SourceMetaSchema = z.object({
  sourceId: z.string(),
  url: PageUrlSchema,
  title: z.string().default(""),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  viewport: ViewportSchema,
  phase: z.enum(["extracted", "chunked", "assets"]).default("extracted"),
  paths: z.object({
    meta: z.string(),
    extraction: z.string(),
    screenshotsDir: z.string().optional(),
    rawHtml: z.string().optional(),
    stylesheets: z.string().optional(),
    capturedCss: z.string().optional(),
    sectionsDir: z.string().optional(),
    sectionsIndex: z.string().optional(),
    assetsManifest: z.string().optional(),
    assetsDir: z.string().optional(),
  }),
});
export type SourceMeta = z.infer<typeof SourceMetaSchema>;

export const SectionSchema = z.object({
  sectionId: z.string(),
  selector: z.string().optional(),
  rect: RectSchema.optional(),
  estimatedTokens: z.number().int().nonnegative().default(0),
  path: z.string().optional(),
});
export type Section = z.infer<typeof SectionSchema>;

/** Structured error used by CLI/MCP */
export const SiteForgeErrorSchema = z.object({
  ok: z.literal(false),
  code: z.string(),
  message: z.string(),
  hint: z.string().optional(),
});
export type SiteForgeError = z.infer<typeof SiteForgeErrorSchema>;

export function okResult<T extends Record<string, unknown>>(data: T) {
  return { ok: true as const, ...data };
}

export function errResult(
  code: string,
  message: string,
  hint?: string,
): SiteForgeError {
  return hint
    ? { ok: false, code, message, hint }
    : { ok: false, code, message };
}
