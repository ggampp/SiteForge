# 03 — Deep-dive: JCodesMore AI Website Cloner Template

**Repo:** https://github.com/JCodesMore/ai-website-cloner-template  
**Workspace local analisado:** `D:\claude_projects\dev-services\ai-website-cloner-template`  
**Versão observada:** 0.3.1 / master (2026)

## O que é

Template MIT para reverse-engineering de sites em **Next.js 16 + React 19 + Tailwind v4 + shadcn/ui** via agentes de IA.

O valor não está no app (placeholder), e sim no **playbook**:

- Skill: `.claude/skills/clone-website/SKILL.md`  
- Guides: `docs/research/INSPECTION_GUIDE.md`  
- Sync multi-plataforma: `scripts/sync-skills.mjs`, `scripts/sync-agent-rules.sh`  

## Stack do template

- Next.js 16 App Router, TypeScript strict  
- shadcn/ui + Tailwind v4 (oklch tokens)  
- Lucide (substituído por SVGs extraídos)  
- Node ≥ 24  

## Pipeline da skill `/clone-website`

### Pre-flight

1. Browser MCP obrigatório (Chrome preferido)  
2. Validar URLs  
3. `npm run build` no scaffold  
4. Criar `docs/research/`, `docs/design-references/`, etc.  

### Phase 1 — Reconnaissance

- Screenshots desktop 1440 / mobile 390  
- Fonts, colors, favicons, global patterns (Lenis etc.)  
- **Mandatory interaction sweep:** scroll, click, hover, responsive  
- `BEHAVIORS.md`, `PAGE_TOPOLOGY.md`  

### Phase 2 — Foundation

- `layout.tsx` fonts  
- `globals.css` tokens  
- Types em `src/types/`  
- `icons.tsx` de SVGs  
- `scripts/download-assets.mjs` (escrito por clone)  

### Phase 3 — Spec + Dispatch

Por seção:

1. Extract (screenshot + `getComputedStyle` walk script)  
2. Write `docs/research/components/<name>.spec.md`  
3. Dispatch builder agent em **git worktree**  
4. Merge contínuo  

**Complexity budget:** ~150 linhas de spec → split  
**Builder recebe:** spec **inline**, paths de assets, target file, `tsc --noEmit`  

### Phase 4 — Assembly

`page.tsx` + page-level behaviors.

### Phase 5 — Visual QA

Side-by-side original vs clone; fix via re-extract ou fix builder.

## Princípios (os que SiteForge herda)

1. Completeness beats speed  
2. Small tasks, perfect results  
3. Real content, real assets (incl. layered images)  
4. Foundation first  
5. Appearance **and** behavior  
6. Interaction model first (scroll before click)  
7. Every state, not just default  
8. Spec files are source of truth  
9. Build must always compile  

## Multi-plataforma

`sync-skills.mjs` gera para:

Claude, Codex, Copilot, Cursor, Windsurf, Gemini, OpenCode, Augment, Continue, Amazon Q  

`AGENTS.md` é source of truth de regras de projeto.

## O que o template **não** tem

- MCP próprio  
- Extractor Playwright embutido  
- Download de assets genérico versionado  
- Visual diff automatizado  
- Skills `/build-from-spec` e `/customize` (citadas em changelog antigo, ausentes no tree atual)  

## Código app atual

```tsx
// page.tsx essencialmente:
// "Clone target not yet built. Run /clone-website"
```

## Lições para SiteForge

| Do JCodesMore | Como usar |
|---------------|-----------|
| Playbook de fases | Skill SiteForge |
| Spec template markdown | Output opcional do MCP + skill |
| Interaction model | Skill (não só extract estático) |
| Worktree builders | Skill/orchestrator host — não no MCP |
| sync multi-host | `scripts/sync-skills` equivalente |
| Anti-patterns list | Seção fixa da skill |
| Template Next | `@siteforge/template` opcional |

## Complementaridade com PWC

```
JCodesMore = COMO o agente deve trabalhar (processo)
PWC        = O QUE o agente deveria receber (dados estruturados)
SiteForge  = processo + dados + protocolo MCP
```
