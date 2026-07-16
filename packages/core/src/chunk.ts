import type { ElementNode, Rect, Section } from "./schema.js";
import type { ExtractionResult } from "./schema.js";

export interface ChunkOptions {
  /** Soft cap per section (approx tokens) */
  maxTokens?: number;
  /** Area (px²) above which two rects count as overlapping */
  overlapAreaThreshold?: number;
  /** Max vertical gap (px) to merge adjacent sections */
  mergeGapPx?: number;
  /** Minimum section height to keep as candidate */
  minHeight?: number;
  force?: boolean;
}

export interface SectionDetail extends Section {
  root: ElementNode;
  textSummary?: string;
  images: string[];
  htmlSnippet?: string;
}

export interface ChunkResult {
  sections: SectionDetail[];
  pageHeight: number;
  validation: ThreePrinciplesValidation;
}

export interface ThreePrinciplesValidation {
  ok: boolean;
  mutualExclusivity: boolean;
  completeCoverage: boolean;
  sizeControl: boolean;
  issues: string[];
}

const SEMANTIC_TAGS = new Set([
  "header",
  "nav",
  "main",
  "section",
  "article",
  "footer",
  "aside",
]);

/** Rough token estimate: UTF-16 code units / 4 */
export function estimateTokens(value: unknown): number {
  try {
    return Math.ceil(JSON.stringify(value).length / 4);
  } catch {
    return 0;
  }
}

export function rectArea(r: Rect): number {
  return Math.max(0, r.width) * Math.max(0, r.height);
}

export function rectOverlapArea(a: Rect, b: Rect): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  if (x2 <= x1 || y2 <= y1) return 0;
  return (x2 - x1) * (y2 - y1);
}

export function pageHeightFromTree(root: ElementNode): number {
  let max = 0;
  function walk(n: ElementNode): void {
    if (n.rect) {
      max = Math.max(max, n.rect.y + n.rect.height);
    }
    for (const c of n.children ?? []) walk(c);
  }
  walk(root);
  return max || root.rect?.height || 0;
}

function buildSelector(node: ElementNode): string {
  const parts: string[] = [node.tag];
  if (node.id) parts[0] += `#${node.id}`;
  else if (node.classes?.length) {
    parts[0] += "." + node.classes.slice(0, 2).join(".");
  }
  return parts[0];
}

function collectText(node: ElementNode, limit = 400): string {
  const parts: string[] = [];
  function walk(n: ElementNode): void {
    if (parts.join(" ").length >= limit) return;
    if (n.text) parts.push(n.text);
    for (const c of n.children ?? []) walk(c);
  }
  walk(node);
  return parts.join(" ").slice(0, limit);
}

function collectImages(node: ElementNode): string[] {
  const out: string[] = [];
  function walk(n: ElementNode): void {
    if (n.tag === "img") {
      const src = n.attributes?.src ?? n.attributes?.["data-src"];
      if (src) out.push(src);
    }
    const bg = n.styles?.backgroundImage;
    if (bg && bg !== "none") {
      const m = /url\(["']?([^"')]+)["']?\)/i.exec(bg);
      if (m?.[1]) out.push(m[1]);
    }
    for (const c of n.children ?? []) walk(c);
  }
  walk(node);
  return [...new Set(out)];
}

function cloneShallow(node: ElementNode): ElementNode {
  return {
    ...node,
    classes: [...(node.classes ?? [])],
    attributes: { ...(node.attributes ?? {}) },
    styles: node.styles ? { ...node.styles } : undefined,
    children: (node.children ?? []).map(cloneShallow),
  };
}

function candidateNodes(root: ElementNode, minHeight: number): ElementNode[] {
  const bodyKids = root.children ?? [];
  const semantic: ElementNode[] = [];

  function findSemantic(n: ElementNode, depth: number): void {
    if (SEMANTIC_TAGS.has(n.tag) && (n.rect?.height ?? 0) >= minHeight) {
      semantic.push(n);
      return; // don't nest semantic under semantic for candidates
    }
    if (depth < 4) {
      for (const c of n.children ?? []) findSemantic(c, depth + 1);
    }
  }
  findSemantic(root, 0);

  if (semantic.length >= 2) return semantic;

  const largeKids = bodyKids.filter((c) => (c.rect?.height ?? 0) >= minHeight);
  if (largeKids.length > 0) return largeKids;

  // Fallback: whole body as one section
  return [root];
}

function toDetail(
  node: ElementNode,
  index: number,
): SectionDetail {
  const rect = node.rect ?? { x: 0, y: 0, width: 0, height: 0 };
  const root = cloneShallow(node);
  const estimatedTokens = estimateTokens(root);
  const sectionId = `section_${String(index + 1).padStart(3, "0")}`;
  return {
    sectionId,
    selector: buildSelector(node),
    rect,
    estimatedTokens,
    root,
    textSummary: collectText(node),
    images: collectImages(node),
  };
}

function splitByTokenBudget(
  detail: SectionDetail,
  maxTokens: number,
): SectionDetail[] {
  if (detail.estimatedTokens <= maxTokens) return [detail];
  const kids = detail.root.children ?? [];
  if (kids.length < 2) return [detail]; // cannot split further

  const parts: SectionDetail[] = [];
  let bucket: ElementNode[] = [];
  let bucketTokens = 0;
  let bucketRect: Rect | null = null;

  const flush = (): void => {
    if (bucket.length === 0) return;
    const synthetic: ElementNode = {
      tag: "div",
      classes: ["siteforge-split"],
      attributes: {},
      rect: bucketRect ?? detail.rect,
      children: bucket,
    };
    parts.push(toDetail(synthetic, parts.length));
    bucket = [];
    bucketTokens = 0;
    bucketRect = null;
  };

  for (const kid of kids) {
    const t = estimateTokens(kid);
    if (bucketTokens + t > maxTokens && bucket.length > 0) flush();
    bucket.push(kid);
    bucketTokens += t;
    if (kid.rect) {
      if (!bucketRect) bucketRect = { ...kid.rect };
      else {
        const y1 = Math.min(bucketRect.y, kid.rect.y);
        const y2 = Math.max(
          bucketRect.y + bucketRect.height,
          kid.rect.y + kid.rect.height,
        );
        const x1 = Math.min(bucketRect.x, kid.rect.x);
        const x2 = Math.max(
          bucketRect.x + bucketRect.width,
          kid.rect.x + kid.rect.width,
        );
        bucketRect = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
      }
    }
  }
  flush();
  return parts.length > 0 ? parts : [detail];
}

function removeOverlaps(
  sections: SectionDetail[],
  threshold: number,
): SectionDetail[] {
  const sorted = [...sections].sort(
    (a, b) => (a.rect?.y ?? 0) - (b.rect?.y ?? 0),
  );
  const kept: SectionDetail[] = [];
  for (const s of sorted) {
    if (!s.rect) {
      kept.push(s);
      continue;
    }
    let conflict = false;
    for (const k of kept) {
      if (!k.rect) continue;
      if (rectOverlapArea(s.rect, k.rect) > threshold) {
        // keep the larger area
        if (rectArea(s.rect) > rectArea(k.rect)) {
          const idx = kept.indexOf(k);
          kept.splice(idx, 1, s);
        }
        conflict = true;
        break;
      }
    }
    if (!conflict) kept.push(s);
  }
  return kept.sort((a, b) => (a.rect?.y ?? 0) - (b.rect?.y ?? 0));
}

function isSyntheticSection(s: SectionDetail): boolean {
  const tag = s.root.tag;
  const classes = s.root.classes ?? [];
  return (
    classes.includes("siteforge-split") ||
    classes.includes("siteforge-merged") ||
    tag === "div" && classes.some((c) => c.startsWith("siteforge-"))
  );
}

function mergeGaps(
  sections: SectionDetail[],
  mergeGapPx: number,
  maxTokens: number,
): SectionDetail[] {
  if (sections.length < 2) return sections;
  const out: SectionDetail[] = [];
  let current = sections[0]!;
  /** Only merge tiny fragments / synthetic splits — keep semantic blocks. */
  const smallCap = Math.min(1500, Math.floor(maxTokens / 6));

  for (let i = 1; i < sections.length; i++) {
    const next = sections[i]!;
    const cy = (current.rect?.y ?? 0) + (current.rect?.height ?? 0);
    const ny = next.rect?.y ?? 0;
    const gap = ny - cy;
    const combinedTokens = current.estimatedTokens + next.estimatedTokens;
    const heightOk =
      (current.rect?.height ?? 0) <= 120 && (next.rect?.height ?? 0) <= 120;
    const bothSmall =
      heightOk &&
      current.estimatedTokens <= smallCap &&
      next.estimatedTokens <= smallCap;
    const eitherSynthetic =
      isSyntheticSection(current) || isSyntheticSection(next);
    const bothSemantic =
      SEMANTIC_TAGS.has(current.root.tag) && SEMANTIC_TAGS.has(next.root.tag);

    if (
      gap >= 0 &&
      gap <= mergeGapPx &&
      combinedTokens <= maxTokens &&
      !bothSemantic &&
      (bothSmall || eitherSynthetic)
    ) {
      const y1 = Math.min(current.rect?.y ?? 0, next.rect?.y ?? 0);
      const y2 = Math.max(
        (current.rect?.y ?? 0) + (current.rect?.height ?? 0),
        (next.rect?.y ?? 0) + (next.rect?.height ?? 0),
      );
      const x1 = Math.min(current.rect?.x ?? 0, next.rect?.x ?? 0);
      const x2 = Math.max(
        (current.rect?.x ?? 0) + (current.rect?.width ?? 0),
        (next.rect?.x ?? 0) + (next.rect?.width ?? 0),
      );
      const mergedRoot: ElementNode = {
        tag: "div",
        classes: ["siteforge-merged"],
        attributes: {},
        rect: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 },
        children: [current.root, next.root],
      };
      current = toDetail(mergedRoot, 0);
    } else {
      out.push(current);
      current = next;
    }
  }
  out.push(current);
  return out;
}

export function validateThreePrinciples(
  sections: SectionDetail[],
  pageHeight: number,
  maxTokens: number,
  overlapThreshold: number,
  force = false,
): ThreePrinciplesValidation {
  const issues: string[] = [];

  // 1 mutual exclusivity
  let mutualExclusivity = true;
  for (let i = 0; i < sections.length; i++) {
    for (let j = i + 1; j < sections.length; j++) {
      const a = sections[i]?.rect;
      const b = sections[j]?.rect;
      if (!a || !b) continue;
      if (rectOverlapArea(a, b) > overlapThreshold) {
        mutualExclusivity = false;
        issues.push(
          `Overlap between ${sections[i]!.sectionId} and ${sections[j]!.sectionId}`,
        );
      }
    }
  }

  // 2 complete coverage (vertical union with tolerance)
  let completeCoverage = true;
  if (pageHeight > 0 && sections.length > 0) {
    const sorted = [...sections]
      .filter((s) => s.rect)
      .sort((a, b) => a.rect!.y - b.rect!.y);
    const tol = Math.max(40, pageHeight * 0.05);
    let coveredTo = sorted[0]!.rect!.y;
    if (coveredTo > tol) {
      completeCoverage = false;
      issues.push(`Coverage gap at top (starts at y=${coveredTo.toFixed(0)})`);
    }
    for (const s of sorted) {
      const r = s.rect!;
      if (r.y > coveredTo + tol) {
        completeCoverage = false;
        issues.push(
          `Coverage gap before ${s.sectionId} (y=${r.y.toFixed(0)}, coveredTo=${coveredTo.toFixed(0)})`,
        );
      }
      coveredTo = Math.max(coveredTo, r.y + r.height);
    }
    if (coveredTo < pageHeight - tol) {
      completeCoverage = false;
      issues.push(
        `Coverage gap at bottom (coveredTo=${coveredTo.toFixed(0)}, pageHeight=${pageHeight.toFixed(0)})`,
      );
    }
  }

  // 3 size control
  let sizeControl = true;
  for (const s of sections) {
    if (s.estimatedTokens > maxTokens && !force) {
      sizeControl = false;
      issues.push(
        `${s.sectionId} exceeds maxTokens (${s.estimatedTokens} > ${maxTokens})`,
      );
    }
  }

  return {
    ok: mutualExclusivity && completeCoverage && sizeControl,
    mutualExclusivity,
    completeCoverage,
    sizeControl,
    issues,
  };
}

/**
 * Chunk extraction tree into sections using three principles (PWC-inspired).
 */
export function chunkExtraction(
  extraction: ExtractionResult,
  options: ChunkOptions = {},
): ChunkResult {
  const maxTokens = options.maxTokens ?? 10_000;
  const overlapAreaThreshold = options.overlapAreaThreshold ?? 100;
  const mergeGapPx = options.mergeGapPx ?? 80;
  const minHeight = options.minHeight ?? 40;
  const force = options.force ?? false;

  const pageHeight = pageHeightFromTree(extraction.root);
  let candidates = candidateNodes(extraction.root, minHeight).map((n, i) =>
    toDetail(n, i),
  );

  // split oversized
  candidates = candidates.flatMap((c) =>
    splitByTokenBudget(c, maxTokens),
  );

  candidates = removeOverlaps(candidates, overlapAreaThreshold);
  candidates = mergeGaps(candidates, mergeGapPx, maxTokens);

  // re-id stable-ish by vertical order
  candidates = candidates
    .sort((a, b) => (a.rect?.y ?? 0) - (b.rect?.y ?? 0))
    .map((s, i) => ({
      ...s,
      sectionId: `section_${String(i + 1).padStart(3, "0")}`,
    }));

  const validation = validateThreePrinciples(
    candidates,
    pageHeight,
    maxTokens,
    overlapAreaThreshold,
    force,
  );

  return { sections: candidates, pageHeight, validation };
}

/** Lightweight list item (no full root) */
export function toSectionSummary(
  detail: SectionDetail,
  filePath?: string,
): Section {
  return {
    sectionId: detail.sectionId,
    selector: detail.selector,
    rect: detail.rect,
    estimatedTokens: detail.estimatedTokens,
    path: filePath,
  };
}
