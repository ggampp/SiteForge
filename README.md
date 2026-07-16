# SiteForge

**Extract. Spec. Rebuild — for AI coding agents.**

SiteForge is an open-source toolkit that reverse-engineers websites into clean modern code (Next.js + shadcn/ui by default) for **coding agents** (Claude Code, Grok, Cursor, Codex, etc.).

| Layer | Role |
|-------|------|
| **Extractor** | Playwright: DOM + computed styles + CSS + assets + theme + interactions |
| **MCP** | Portable deterministic tools (`extract_page`, `list_sections`, `query_source`, …) |
| **Skill** | Pixel-faithful clone playbook (recon → foundation → specs → builders → QA) |
| **Template** | Optional scaffold Next 16 + Tailwind v4 + shadcn |

---

## Quick start (dev monorepo)

```bash
pnpm install
pnpm exec playwright install chromium
pnpm build
pnpm test
pnpm --filter @siteforge/cli exec siteforge doctor
# optional smoke:
# pnpm --filter @siteforge/cli exec siteforge extract https://example.com
```

Packages:

| Package | Description |
|---------|-------------|
| `@siteforge/core` | Schema, browser, extract, store, doctor |
| `@siteforge/cli` | `siteforge` binary |
| `@siteforge/mcp` | MCP stdio server (doctor, extract_page, list_sources) |
| `@siteforge/skill` | SKILL.md source |

Store layout: `.siteforge/sources/{sourceId}/` (gitignored).

---

## Documentation

| Doc | Content |
|-----|---------|
| [docs/00-vision.md](docs/00-vision.md) | Vision & non-goals |
| [docs/05-architecture.md](docs/05-architecture.md) | Target monorepo architecture |
| [docs/06-mcp-contract.md](docs/06-mcp-contract.md) | MCP tool contract |
| [docs/08-development-plan.md](docs/08-development-plan.md) | Full development plan |
| [docs/09-mvp-90-days.md](docs/09-mvp-90-days.md) | 90-day MVP |
| [docs/name-availability.md](docs/name-availability.md) | npm/GitHub/PyPI name check |
| [docs/INDEX.md](docs/INDEX.md) | Full reading order |
| [planning/roadmap.md](planning/roadmap.md) | Tiers |
| [planning/wbs.md](planning/wbs.md) | Work breakdown |

---

## Decisions (research)

1. **Project name:** SiteForge  
2. **Positioning:** Skill + MCP + optional template — **no** product UI in the MVP  
3. **Effort sweet spot:** Tier 1→2 (~90–150 person-days); Tier 3 only with traction  
4. **npm:** publish **scoped** `@siteforge/*` (unscoped `siteforge` is taken)  
5. **Primary references:** JCodesMore (process/skill), Perfect-Web-Clone (extract patterns), Varalix clone-team (quality)

---

## Status

| Item | Status |
|------|--------|
| Research / docs | Done |
| Name availability | Checked — see [docs/name-availability.md](docs/name-availability.md) |
| Monorepo bootstrap (Phase 0) | Done |
| Core extract (styles, screenshots, scroll, raw.html, timeouts) | Done |
| Phase 2 chunk + assets + CLI/MCP tools | Done |
| GitHub repo `ggampp/SiteForge` | Done (pushed) |
| Skill polish + Next template | Pending |
| npm publish | Pending |

---

## Legitimate use

SiteForge is for: migrating sites you own, recovering lost source, learning real layouts.

**Not** for phishing, impersonation, or violating third-party ToS.

---

## Next steps

1. Expand Phase 1 extract (styles subset, screenshots, CLI polish)  
2. Phase 2 chunk + assets  
3. Create GitHub repo `ggampp/SiteForge` when ready to push  
4. Register npm org `@siteforge` before first publish  

---

*Research consolidated from OSS analysis (2026-07). Phase 0 monorepo bootstrapped 2026-07.*
