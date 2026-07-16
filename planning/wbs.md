# WBS — Work Breakdown Structure

IDs estáveis para issues futuras.

## EPIC-0 Bootstrap

| ID | Work package | Tier |
|----|--------------|------|
| W0.1 | Monorepo pnpm + tooling | T1 |
| W0.2 | CI lint/type/test | T1 |
| W0.3 | LICENSE, SECURITY, CONTRIBUTING | T1 |
| W0.4 | Name availability check | T1 |

## EPIC-1 Core Extract

| ID | Work package | Tier |
|----|--------------|------|
| W1.1 | Browser manager Playwright | T1 |
| W1.2 | Schema Zod ExtractionResult | T1 |
| W1.3 | DOM walk + computed styles | T1 |
| W1.4 | Screenshots | T1 |
| W1.5 | Metadata + timing | T1 |
| W1.6 | Lazy scroll | T1 |
| W1.7 | Source store FS | T1 |
| W1.8 | CLI extract | T1 |
| W1.9 | Unit/fixture tests | T1 |
| W1.10 | CSS data (vars, keyframes, media) | T2 |
| W1.11 | Theme dual capture | T2 |
| W1.12 | Interaction hover/focus | T2 |
| W1.13 | Network capture summary | T2 |
| W1.14 | Phased extract + status | T2 |
| W1.15 | Shadow DOM best-effort | T2+ |

## EPIC-2 Chunking

| ID | Work package | Tier |
|----|--------------|------|
| W2.1 | Token estimate | T1 |
| W2.2 | Section candidates from tree | T1 |
| W2.3 | Split large sections | T1 |
| W2.4 | Overlap removal | T1 |
| W2.5 | Gap merge / coverage | T1 |
| W2.6 | Validate three principles | T1 |
| W2.7 | Persist section JSON | T1 |
| W2.8 | Horizontal layout handling | T2 |

## EPIC-3 Assets

| ID | Work package | Tier |
|----|--------------|------|
| W3.1 | Discover img/video/bg/fonts | T1 |
| W3.2 | Batch download + retry | T1 |
| W3.3 | Manifest url→path | T1 |
| W3.4 | Content-type / size limits | T1 |
| W3.5 | Dedup by hash | T2 |

## EPIC-4 MCP

| ID | Work package | Tier |
|----|--------------|------|
| W4.1 | Server scaffold stdio | T1 |
| W4.2 | Tool extract_page | T1 |
| W4.3 | Tool list/get sections | T1 |
| W4.4 | Tool query_source | T1 |
| W4.5 | Tool assets discover/download | T1 |
| W4.6 | Tool screenshot | T1 |
| W4.7 | Tool doctor | T1 |
| W4.8 | Error taxonomy | T1 |
| W4.9 | HTTP transport | T2 |
| W4.10 | visual_diff tool | T2 |
| W4.11 | capture_interaction/theme | T2 |
| W4.12 | write_spec_stub / tokens | T2 |

## EPIC-5 Skill

| ID | Work package | Tier |
|----|--------------|------|
| W5.1 | SKILL.md full pipeline | T1 |
| W5.2 | MCP-first preflight | T1 |
| W5.3 | Degraded browser mode | T1 |
| W5.4 | Spec template | T1 |
| W5.5 | Anti-patterns section | T1 |
| W5.6 | sync-skills multi-host | T1 |
| W5.7 | No-worktree sequential mode | T1 |
| W5.8 | QA gate checklist | T2 |
| W5.9 | ARCHITECTURE.md optional path | T2 |

## EPIC-6 Template

| ID | Work package | Tier |
|----|--------------|------|
| W6.1 | Next 16 + TW4 + shadcn scaffold | T1 |
| W6.2 | Research dirs + placeholder page | T1 |
| W6.3 | Quickstart wired to skill | T1 |
| W6.4 | Docker optional | T2 |

## EPIC-7 QA & Benchmarks

| ID | Work package | Tier |
|----|--------------|------|
| W7.1 | Local HTML fixtures | T1 |
| W7.2 | visual_diff lib | T2 |
| W7.3 | benchmarks/sites.json | T2 |
| W7.4 | Score reports CI nightly | T2 |
| W7.5 | Case study docs | T1 |

## EPIC-8 Hardening

| ID | Work package | Tier |
|----|--------------|------|
| W8.1 | Windows CI | T2 |
| W8.2 | SSRF / path guards | T1 partial / T2 full |
| W8.3 | Timeouts/retries | T1 |
| W8.4 | Perf budgets | T2 |
| W8.5 | Telemetry opt-in | T3 |

## EPIC-9 Product (T3)

| ID | Work package | Tier |
|----|--------------|------|
| W9.1 | Web UI extract | T3 |
| W9.2 | Job history | T3 |
| W9.3 | Sandbox preview | T3 |
| W9.4 | Worker service | T3 |
