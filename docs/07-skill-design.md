# 07 — Design da Skill SiteForge

## Nome e triggers

```yaml
name: siteforge
description: >
  Reverse-engineer and rebuild websites as pixel-faithful code using SiteForge MCP
  extraction plus a disciplined multi-phase pipeline. Use when the user wants to clone,
  replicate, rebuild, or reverse-engineer a website/page. Triggers: "clone this site",
  "pixel-perfect clone", "rebuild this page", /siteforge, /clone-website.
argument-hint: "<url1> [<url2> ...]"
user-invocable: true
```

**Compat:** aceitar alias `/clone-website` para quem vem do JCodesMore.

## Dependência crítica

```
Pre-flight:
1. Prefer SiteForge MCP tools if available
2. Else fall back to browser MCP + inline extract scripts (degraded mode)
3. If neither, stop and instruct user to install @siteforge/mcp or a browser MCP
```

## Defaults de escopo

| Item | Default |
|------|---------|
| Fidelity | Pixel-perfect visual |
| In scope | Layout, components, interactions mockable, responsive, real content |
| Out of scope | Real backend, auth, realtime, SEO deep, a11y full audit |
| Customization | None until clone base done |

## Fases (mapeadas a tools)

| Fase | Skill faz | MCP (preferido) |
|------|-----------|-----------------|
| 0 Pre-flight | build check, dirs | `siteforge_doctor` |
| 1 Recon | topology, behaviors | `extract_page`, `screenshot_page`, `list_sections` |
| 2 Foundation | fonts, globals, types, icons | `export_design_tokens`, `download_assets` |
| 3 Specs | write `*.spec.md` | `get_section`, `query_source`, `write_spec_stub` |
| 4 Build | dispatch subagents/worktrees | — |
| 5 Assemble | page.tsx wiring | — |
| 6 QA | interaction tests | `visual_diff`, screenshots |

## Guiding principles (herdados + reforçados)

1. Completeness beats speed  
2. Small tasks (token/section budget)  
3. Real content & layered assets  
4. Foundation first  
5. Appearance + behavior  
6. Interaction model first (scroll before click)  
7. All states  
8. Spec files are contracts  
9. Build always green  
10. **Prefer MCP data over visual guess**  

## Template de spec (compatível JCodesMore)

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

## Modo degradado (sem SiteForge MCP)

Incluir na skill os scripts JS de extract (como JCodesMore) e instruir browser MCP. Documentar perda de qualidade esperada.

## Modo sem worktrees

Pipeline sequencial: uma seção por vez, commits atômicos, sem fan-out.

## Multi-URL

```
docs/research/<hostname>/
.siteforge/sources/… (por URL)
public/images/<hostname>/
```

## Sync multi-plataforma

Source: `packages/skill/siteforge/SKILL.md`  
Script: `packages/skill/sync-skills.mjs` → Claude, Codex, Cursor, Copilot, Gemini, OpenCode, etc. (mesmo padrão JCodesMore).

## Quality gates na skill (inspirado clone-team)

Antes de marcar done:

- [ ] `list_sections` count ≈ seções em PAGE_TOPOLOGY  
- [ ] Cada component tem spec file  
- [ ] `npm run build` / `typecheck` green  
- [ ] `visual_diff` score acima do threshold **ou** gaps documentados  
- [ ] Interaction sweep re-testado  

## Responsável use (bloco fixo na skill)

```
Only clone sites you own or are authorized to reproduce.
Do not use for phishing, brand impersonation, or ToS violations.
Credentials never committed; prefer public pages.
```

## Métricas de completion report

- sections built  
- components created  
- specs written  
- assets downloaded  
- build status  
- visual_diff scores  
- known gaps  
