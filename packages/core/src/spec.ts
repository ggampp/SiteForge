import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { SectionDetail } from "./chunk.js";
import { getSectionDetail } from "./pipeline.js";
import { SiteForgeException } from "./errors.js";

export interface WriteSpecStubOptions {
  outDir: string;
  sourceId: string;
  sectionId: string;
  /** Output markdown path (default docs/research/<sectionId>.spec.md) */
  targetPath?: string;
  componentName?: string;
}

export interface WriteSpecStubResult {
  ok: true;
  path: string;
  sectionId: string;
  sourceId: string;
}

function guessName(section: SectionDetail): string {
  const sel = section.selector ?? section.sectionId;
  const idMatch = sel.match(/#([a-zA-Z][\w-]*)/);
  if (idMatch?.[1]) return pascal(idMatch[1]);
  const classMatch = sel.match(/\.([a-zA-Z][\w-]*)/);
  if (classMatch?.[1]) return pascal(classMatch[1]);
  return pascal(section.sectionId);
}

function pascal(s: string): string {
  return s
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function formatStyles(section: SectionDetail): string {
  const styles = section.root?.styles;
  if (!styles || Object.keys(styles).length === 0) {
    return "_No container styles on section root — inspect children via get_section._";
  }
  return Object.entries(styles)
    .slice(0, 40)
    .map(([k, v]) => `- \`${k}\`: \`${v}\``)
    .join("\n");
}

function formatImages(section: SectionDetail): string {
  if (!section.images?.length) return "_None discovered in section subtree._";
  return section.images
    .slice(0, 20)
    .map((src, i) => `${i + 1}. ${src}`)
    .join("\n");
}

/**
 * Generate a JCodesMore-compatible markdown spec stub from a section.
 */
export async function writeSpecStub(
  options: WriteSpecStubOptions,
): Promise<WriteSpecStubResult> {
  let section: SectionDetail;
  try {
    section = await getSectionDetail(
      options.outDir,
      options.sourceId,
      options.sectionId,
    );
  } catch (err) {
    if (err instanceof SiteForgeException) throw err;
    throw new SiteForgeException(
      "SECTION_NOT_FOUND",
      `Section not found: ${options.sectionId}`,
    );
  }

  const name = options.componentName ?? guessName(section);
  const target =
    options.targetPath ??
    path.join("docs", "research", `${options.sectionId}.spec.md`);

  const md = `# ${name} Specification

## Overview
- Target file: \`components/${name}.tsx\` (suggested)
- Screenshot: (attach from source screenshots or section crop)
- Interaction model: static | click | scroll | time | hybrid
- SiteForge sourceId: \`${options.sourceId}\`
- SiteForge sectionId: \`${section.sectionId}\`
- Selector: \`${section.selector ?? ""}\`
- Rect: \`${JSON.stringify(section.rect ?? {})}\`
- Estimated tokens: ${section.estimatedTokens}

## DOM Structure
\`\`\`
${section.selector ?? section.sectionId}
\`\`\`
_Use \`get_section\` for full subtree JSON at \`${section.path ?? ""}\`._

## Computed Styles (from extract — not estimated)
${formatStyles(section)}

## States & Behaviors
- Default:
- Hover:
- Focus:
- Active:
- Responsive breakpoints:

## Assets
${formatImages(section)}

## Text Content (verbatim)
\`\`\`
${(section.textSummary ?? "").slice(0, 2000)}
\`\`\`

## Responsive Behavior
- Desktop:
- Tablet:
- Mobile:

## Open questions / gaps
- [ ]
`;

  await mkdir(path.dirname(path.resolve(target)), { recursive: true });
  await writeFile(target, md, "utf8");

  return {
    ok: true,
    path: target,
    sectionId: section.sectionId,
    sourceId: options.sourceId,
  };
}
