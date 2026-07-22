/**
 * Soft performance budgets for extracts / payloads (NFR targets from architecture docs).
 */
export const PERF_BUDGETS = {
  /** Cold extract marketing page target (ms) */
  extractColdMs: 120_000,
  /** Warm / cached browser extract target (ms) */
  extractWarmMs: 60_000,
  /** list_sections over cached extraction (ms) */
  listSectionsMs: 5_000,
  /** MCP server startup (ms) */
  mcpStartupMs: 2_000,
  /** Max extraction.json size before recommending query/sections (bytes) */
  extractionJsonBytes: 25 * 1024 * 1024,
  /** Soft section token budget */
  sectionMaxTokens: 10_000,
} as const;

export type PerfBudgetKey = keyof typeof PERF_BUDGETS;

export interface PerfCheck {
  name: PerfBudgetKey | string;
  actual: number;
  budget: number;
  ok: boolean;
  unit: "ms" | "bytes" | "tokens";
}

export function checkBudget(
  name: string,
  actual: number,
  budget: number,
  unit: PerfCheck["unit"] = "ms",
): PerfCheck {
  return { name, actual, budget, ok: actual <= budget, unit };
}

export function summarizePerf(checks: PerfCheck[]): {
  ok: boolean;
  checks: PerfCheck[];
} {
  return { ok: checks.every((c) => c.ok), checks };
}
