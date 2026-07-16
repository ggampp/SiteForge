# 08 — Plano completo de desenvolvimento

## Resumo de esforço (revalidado)

| Tier | Escopo | Pessoa-dias | Calendário (1 sênior) |
|------|--------|-------------|------------------------|
| **T1 MVP** | core extract + chunk + MCP P0 + skill + template mínimo + doctor | **60–90** | **3–4,5 meses** |
| **T2 Pro** | T1 + theme/interactions + visual_diff + phased extract + hardening | **120–180** | **6–9 meses** |
| **T3 Product** | T2 + UI + workers runtime + sandbox | **280–450** | **14–22 meses** |

**Decisão de planejamento:** executar **T1 → T2**. T3 só com tração.

## Fases de produto

### Phase 0 — Foundation (1–2 semanas)

- [x] Init monorepo pnpm (packages/core, mcp, cli, skill)  
- [x] License MIT + CODE_OF_CONDUCT + SECURITY + CONTRIBUTING  
- [x] CI: typecheck, build, unit (GitHub Actions)  
- [x] `siteforge doctor` stub  
- [x] Validar nome npm/GitHub → [name-availability.md](name-availability.md)  

**Exit:** `pnpm build` green, CI on push.

### Phase 1 — Core extract (3–5 semanas)

- [x] Playwright browser manager (mínimo)  
- [x] Schema Zod (`ExtractionResult`, `ElementNode`, …)  
- [x] DOM walk + computed styles subset (30+ props)  
- [x] Viewport + full-page screenshot  
- [x] Metadata (description/lang) + raw HTML (`raw.html`)  
- [x] Lazy scroll helper  
- [x] Persist store `.siteforge/sources/{id}`  
- [x] CLI `extract` (MVP) + timeouts / INVALID_URL  
- [x] Fixture tests com HTML local (não rede flaky)  

**Exit:** extract de 3 páginas estáticas locais + 2 URLs públicas de benchmark.

### Phase 2 — Chunk + assets (2–3 semanas)

- [x] Three principles chunker  
- [x] `list_sections` / `get_section`  
- [x] Asset discover + download batch (concurrency 4)  
- [x] Manifest paths + path-escape guard  
- [x] CLI `chunk`, `sections`, `section`, `download`, `query`, `meta`  

**Exit:** section set validado (no overlap, coverage) em fixtures.

### Phase 3 — MCP P0 (2–3 semanas)

- [x] MCP server stdio (SDK oficial) — tools Phase 1–2 wired  
- [x] Tools P0 core wired (extract, sections, assets, query, doctor)  
- [x] Truncation + path returns (get_section large)  
- [x] Error codes estruturados  

- [ ] Manual verify Claude Code + Cursor + Grok  
- [ ] Publish `@siteforge/mcp` (private first ok)  

**Exit:** agent externo clona workflow extract→sections sem ler o monorepo source.

### Phase 4 — Skill portátil (2–3 semanas)

- [ ] SKILL.md completo (fases + anti-patterns + MCP-first)  
- [ ] Degraded browser-MCP mode  
- [ ] sync-skills multi-host  
- [ ] Spec template + write_spec_stub (core helper)  
- [ ] Docs install  

**Exit:** `/siteforge <url>` end-to-end em template com MCP.

### Phase 5 — Template Next (1–2 semanas)

- [ ] Scaffold Next 16 + Tailwind v4 + shadcn button  
- [ ] Placeholders research dirs  
- [ ] README quickstart SiteForge  
- [ ] Optional: scripts sync from skill  

**Exit:** `create` ou clone template + skill path documented.

### Phase 6 — QA tools T2 start (2–3 semanas)

- [ ] `visual_diff`  
- [ ] Theme capture  
- [ ] Interaction capture hover/focus  
- [ ] `export_design_tokens`  
- [ ] Benchmark harness  

**Exit:** score report em 5 sites benchmark.

### Phase 7 — Hardening (contínuo / 2–4 semanas dedicadas)

- [ ] Windows CI  
- [ ] SSRF guards  
- [ ] Timeouts/retries  
- [ ] e2e smoke  
- [ ] Performance budgets  
- [ ] Docs site (opcional VitePress)  

## Ordem de dependências

```
Phase0 → Phase1 → Phase2 → Phase3 → Phase4
                      ↘ Phase5 (pode // com 3–4)
Phase3+4 → Phase6 → Phase7
```

## Stack técnica (decisões default)

| Área | Escolha |
|------|---------|
| Language | TypeScript 5.x strict |
| Package manager | pnpm |
| Browser | Playwright Chromium |
| Validation | Zod |
| MCP | `@modelcontextprotocol/sdk` |
| Diff | pixelmatch + pngjs (ou similar) |
| Query | jsonpath-plus |
| CLI | citty ou commander |
| Test | vitest + playwright test |
| Lint | eslint + prettier |

## Equipe sugerida

| Perfil | Foco |
|--------|------|
| Dev A (core) | extract, chunk, store |
| Dev B (agents) | MCP, skill, template, docs |
| Solo | T1 sequencial conforme phases |

## Definition of Done (global T1)

- [ ] `npx @siteforge/mcp` sobe e lista tools  
- [ ] Skill instalável em Claude + Cursor  
- [ ] Extract + sections em site público de marketing  
- [ ] Assets em `public/`  
- [ ] Pelo menos um clone parcial documentado como case study  
- [ ] README com quickstart < 10 minutos  
- [ ] Ética/ToS no README e skill  

## Fora de escopo até T3

- Web UI product  
- BoxLite/WebContainer  
- Multi-agent runtime interno  
- Pause/resume jobs multi-sessão (nice-to-have T2.5)  
- Conta cloud SaaS  

## Métricas de progresso

| KPI | T1 target |
|-----|-----------|
| Tools MCP | ≥ 8 |
| Test coverage core extract | ≥ 60% lines schemas+chunk |
| Benchmark sites automated | ≥ 5 |
| Time to first extract (docs) | < 10 min |
| Host agents verified | ≥ 3 |
