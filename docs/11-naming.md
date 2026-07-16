# 11 — Naming system

## Nome canônico

**SiteForge**

**Tagline:** Extract. Spec. Rebuild — for AI coding agents.

## Sistema de nomes

| Camada | Nome |
|--------|------|
| Projeto | SiteForge |
| GitHub repo | `siteforge` ou `SiteForge` |
| MCP server id | `siteforge` |
| npm scope | `@siteforge/*` |
| CLI bin | `siteforge` |
| Skill | `siteforge` (alias `clone-website`) |
| Template | `@siteforge/template-next` / `templates/next-shadcn` |
| Store dir | `.siteforge/` |
| Env prefix | `SITEFORGE_*` |

## Alternativas consideradas

| Nome | Decisão |
|------|---------|
| PixelSpec | runner-up técnico |
| CloneKit | runner-up toolkit |
| DomSource | bom para subpacote `core` |
| WebReforge | ok, mais longo |
| WebClone | **rejeitado** — colisão com ruslanmv/webclone MCP |
| Perfect Web Clone | marca alheia |
| ai-website-cloner | confusão JCodesMore |

## Mensagens de posicionamento

**Curta:**  
SiteForge gives AI coding agents structured page truth and a disciplined clone skill.

**Média:**  
SiteForge extracts live websites into typed DOM/CSS/section data via MCP, then guides agents to rebuild clean Next.js (or your stack) — proofs, not guesses.

**Comparação:**  
- vs JCodesMore: same discipline, plus deterministic extraction tools  
- vs Perfect-Web-Clone: portable MCP/skill, no required product UI  
- vs HTTrack: rebuildable components, not dead HTML mirrors  

## Checklist disponibilidade

Detalhes: [name-availability.md](name-availability.md) (2026-07-15).

- [x] `npm search siteforge` — unscoped **taken**; scope `@siteforge/*` **free**  
- [x] `pypi` taken (N/A se TS-only)  
- [x] GitHub `ggampp/SiteForge` **criado** (public) — remote SSH pessoal configurado  

- [ ] Domínio opcional `siteforge.dev`  

