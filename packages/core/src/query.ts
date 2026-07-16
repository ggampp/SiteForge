import type { ExtractionResult } from "./schema.js";
import { SiteForgeException } from "./errors.js";

/**
 * Resolve a simple dotted path on an object, e.g. `metadata.title` or `stats.totalElements`.
 * Array indices: `root.children.0.tag`
 */
export function queryPath(data: unknown, pathExpr: string): unknown {
  const parts = pathExpr
    .replace(/^\$\.?/, "")
    .split(/\.|\[|\]/)
    .filter(Boolean)
    .map((p) => p.replace(/^["']|["']$/g, ""));

  if (parts.length === 0) return data;

  let cur: unknown = data;
  for (const part of parts) {
    if (cur == null || typeof cur !== "object") {
      throw new SiteForgeException(
        "INTERNAL",
        `Cannot resolve '${part}' on non-object at path ${pathExpr}`,
      );
    }
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

export function queryExtraction(
  extraction: ExtractionResult,
  pathExpr: string,
  maxChars = 50_000,
): { path: string; value: unknown; truncated: boolean } {
  const value = queryPath(extraction, pathExpr);
  const serialized = JSON.stringify(value);
  if (serialized !== undefined && serialized.length > maxChars) {
    return {
      path: pathExpr,
      value: serialized.slice(0, maxChars) + "…",
      truncated: true,
    };
  }
  return { path: pathExpr, value, truncated: false };
}
