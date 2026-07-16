---
name: siteforge
description: >
  Reverse-engineer and rebuild websites as pixel-faithful code using SiteForge MCP
  extraction plus a disciplined multi-phase pipeline. Use when the user wants to clone,
  replicate, rebuild, or reverse-engineer a website/page. Triggers: "clone this site",
  "pixel-perfect clone", "rebuild this page", /siteforge, /clone-website.
argument-hint: "<url1> [<url2> ...]"
user-invocable: true
---

# SiteForge Skill

**Extract. Spec. Rebuild — for AI coding agents.**

## Legitimate use only

Use only on sites you own or have permission to analyze. Not for phishing, brand impersonation, or ToS violations.

## Pre-flight (required)

1. Call MCP tool `doctor` (or CLI `siteforge doctor`).
2. Prefer **SiteForge MCP** tools for all factual page data.
3. If MCP missing: degraded mode with host browser tools + manual notes under `docs/research/`.
4. If neither available: stop and ask the user to install `@siteforge/mcp`.

## MCP tools (names)

| Tool | Use |
|------|-----|
| `doctor` | Environment check |
| `extract_page` | Extract URL → `sourceId` |
| `list_sources` | List local sources |
| `get_page_metadata` | Title, viewport, stats |
| `list_sections` / `chunk_source` | Three-principles sections |
| `get_section` | Section subtree + text + images |
| `query_source` | Dotted path on extraction JSON |
| `discover_assets` / `download_assets` | Asset inventory + download |
| CLI `siteforge rebuild` | Static HTML rebuild into a folder |
| CLI `siteforge diff` | Visual pixelmatch of two PNGs |

## Pipeline phases

### 0 — Pre-flight
- `doctor`
- Confirm outDir (default `.siteforge`)
- Create working dirs: `docs/research/`, `public/images/` if using the Next template

### 1 — Recon
- `extract_page` with full screenshots + raw HTML
- Record `sourceId`, title, stats, screenshot paths
- `list_sections` (auto-chunks if needed)

### 2 — Foundation
- `download_assets` into `public/images` or rebuild `assets/`
- Note fonts, colors from section styles / `query_source`
- Scaffold template: `templates/next-shadcn` or existing app

### 3 — Specs
For each major section write `docs/research/<sectionId>.spec.md`:

```markdown
# <ComponentName> Specification

## Overview
- Target file:
- Screenshot:
- Interaction model: static | click | scroll | time | hybrid
- SiteForge sourceId / sectionId:

## DOM Structure
## Computed Styles (from extract — not estimated)
## States & Behaviors
## Assets
## Text Content (verbatim)
## Responsive Behavior
## Open questions / gaps
```

### 4 — Build
- Implement one section per component file
- Prefer real text/assets from extract
- Keep builds green after each section

### 5 — Assemble
- Wire sections into page route(s)
- Match vertical order from `list_sections`

### 6 — QA
- Capture local screenshot
- `siteforge diff` vs original viewport/full
- List known gaps (WebGL, auth, live APIs)

## Guiding principles

1. Completeness beats speed  
2. Small tasks (section budget)  
3. Real content & layered assets  
4. Foundation first  
5. Appearance + behavior  
6. Prefer MCP data over visual guess  
7. Spec files are contracts  
8. Build always green  
9. Ethics first-class  

## Anti-patterns

- Guessing CSS without extract styles  
- One giant React file for the whole page  
- Committing secrets, cookies, or private dumps  
- Cloning competitors for phishing  

## CLI shortcuts

```bash
siteforge extract https://example.com
siteforge chunk <sourceId>
siteforge sections <sourceId>
siteforge download <sourceId>
siteforge rebuild <sourceId> --slug example --target examples/example
siteforge diff a.png b.png -o .siteforge/diff-out
```

## Degraded mode (no SiteForge MCP)

1. Capture screenshots with browser MCP  
2. Manually outline sections in markdown  
3. Still write specs before coding  
4. Re-run with SiteForge MCP when available for fidelity  

## Multi-host install

Run from monorepo:

```bash
node packages/skill/scripts/sync-skills.mjs
```

Copies `SKILL.md` into Claude Code / Cursor / Codex skill paths when present.
