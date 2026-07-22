# Release notes — v0.1.0

**Date:** 2026-07-22
**npm publish:** deferred (org `@siteforge` + publish still pending by choice)

## Highlights

- Full T1 toolkit: extract → chunk → assets → MCP → skill → Next template → rebuild → visual_diff
- T2 fidelity tools: `capture_theme`, `capture_interaction`, `export_design_tokens`, `extract_page_phased` / `get_extraction_status`, `write_spec_stub`, `screenshot_page`
- Hardening: SSRF guard, asset retries, overall extract deadline, Windows+Ubuntu CI, offline e2e smoke, MCP tool verification
- Example clones with before/after reference screenshots and scores
- Benchmark catalog (6 sites) + `pnpm bench` / `pnpm bench:smoke`

## Packages

| Package | Version |
|---------|---------|
| `@siteforge/core` | 0.1.0 |
| `@siteforge/cli` | 0.1.0 |
| `@siteforge/mcp` | 0.1.0 |
| `@siteforge/skill` | 0.1.0 (private) |

## MCP tools (19)

`doctor`, `extract_page`, `extract_page_phased`, `get_extraction_status`, `list_sources`, `get_page_metadata`, `list_sections`, `get_section`, `query_source`, `discover_assets`, `download_assets`, `chunk_source`, `rebuild_source`, `visual_diff`, `screenshot_page`, `capture_theme`, `capture_interaction`, `export_design_tokens`, `write_spec_stub`

## Verify locally

```bash
pnpm install
pnpm build
pnpm test
pnpm e2e
pnpm verify:mcp
pnpm skill:sync
pnpm doctor
```

## Still deferred

- Publish to npm registry
- Optional: `siteforge.dev` domain
- Optional VitePress docs site
- Deeper interaction sweep / shadow DOM (later T2+)
