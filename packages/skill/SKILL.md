---
name: siteforge
description: Extract live websites into structured DOM/CSS/section data via SiteForge MCP, then rebuild clean Next.js (or your stack) with disciplined specs. Use for authorized clone, migration, and layout study.
---

# SiteForge Skill (draft — Phase 0)

**Tagline:** Extract. Spec. Rebuild — for AI coding agents.

## Legitimate use only

Use only on sites you own or have permission to analyze. Not for phishing or impersonation.

## MCP-first preflight

1. Ensure SiteForge MCP is connected (`doctor` tool or `siteforge doctor`).
2. Prefer MCP tools over raw browser guessing:
   - `extract_page`
   - `list_sources`
   - (later) `list_sections`, `get_section`, `download_assets`, `visual_diff`
3. Store lives under `.siteforge/sources/{sourceId}/`.

## Pipeline (target)

1. **Recon** — extract page, note title/viewport/stats  
2. **Sections** — list sections after chunking (Phase 2)  
3. **Specs** — write markdown specs per section  
4. **Foundation** — tokens, layout shell in template  
5. **Builders** — implement sections  
6. **QA** — visual diff + manual pass  

## Anti-patterns

- Guessing CSS without extract data  
- Generating huge single-file React without sections  
- Committing secrets or full raw dumps of private apps  

## Degraded mode

If MCP is unavailable, use host browser tools carefully and still write structured notes under `docs/research/`. Full fidelity requires SiteForge MCP.

## Install (hosts)

See monorepo README and `docs/07-skill-design.md` for Claude Code / Cursor / Grok config once packages are published.
