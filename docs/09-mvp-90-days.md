# 09 — MVP 90 dias (plano executável)

Premissa: **1 desenvolvedor sênior**, ~4–5 dias úteis/semana, foco T1.

## Objetivo do MVP

> Um agente de codificação com SiteForge MCP + skill consegue extrair uma landing page pública, obter seções estruturadas, baixar assets e reconstruir a página no template Next com fidelidade visual razoável (P0), com build verde.

## Calendário

### Semanas 1–2 — Bootstrap

| Entrega | Aceite | Status |
|---------|--------|--------|
| Monorepo pnpm packages/core,mcp,cli | build CI green | Done (local); CI on first push |
| Zod schemas iniciais | testes unitários | Done |
| Playwright launch + goto fixture HTML | test local | Done |
| LICENSE MIT, README skeleton | merged | Done |


### Semanas 3–5 — Extract

| Entrega | Aceite | Status |
|---------|--------|--------|
| DOM tree + computed styles | fixture test + 30+ props list | Done |
| Screenshots viewport+full | files exist | Done |
| Source store | sourceId roundtrip | Done |
| CLI `siteforge extract` | command works | Done |
| Lazy scroll | steps in stats | Done |
| raw.html + timeouts/INVALID_URL | tests + CLI | Done |
| 2 public URLs smoke | checklist | Done (`example.com`, `httpbin.org/html`) |

### Semanas 6–7 — Chunk + assets

| Entrega | Aceite | Status |
|---------|--------|--------|
| Chunker 3 principles | validation function tests | Done |
| Section JSON files | list_sections ≥ 1 | Done |
| Download assets batch | concurrency 4 + partial fail OK | Done |
| Manifest | urls→paths | Done |
| CLI chunk/download/query | commands work | Done |


### Semanas 8–9 — MCP

| Entrega | Aceite |
|---------|--------|
| stdio MCP all P0 tools | MCP inspector OK |
| Errors estruturados | invalid url returns code |
| Config snippet Claude/Cursor/Grok | docs |
| Real agent session recorded | short loom/md log |

### Semanas 10–11 — Skill + template

| Entrega | Aceite |
|---------|--------|
| SKILL.md MCP-first | phases complete |
| sync-skills ≥ Claude+Cursor+Codex | generated files |
| Template next-shadcn | npm run build |
| E2E guided clone of simple site | case study md |

### Semana 12 — Polish MVP

| Entrega | Aceite |
|---------|--------|
| doctor command | detects missing browsers |
| Security/ethics README | present |
| Known limitations doc | present |
| Tag `v0.1.0` | release notes |

## Buffer

Se atrasar: cortar **template polish** e **multi-host sync** (manter só Claude+Cursor); não cortar extract+MCP.

## Critérios de aceite MVP (checklist final)

- [ ] `siteforge extract https://example.com` → sourceId  
- [ ] `list_sections` retorna N sections com rects  
- [ ] `download_assets` popula diretório  
- [ ] MCP tools visíveis no host agent  
- [ ] Skill instruções usam tools por nome  
- [ ] Clone parcial de 1 landing real documentado  
- [ ] `npm run build` no template pós-clone (mesmo que incompleto)  
- [ ] Nenhuma credencial no repo  
- [ ] Disclaimer legal presente  

## Anti-goals dos 90 dias

- Pixel 100% em sites WebGL  
- Healing loop  
- UI web  
- Public npm viral marketing  

## Depois do dia 90

Entrar em T2: theme, interaction capture, visual_diff, phased extract, Windows CI matrix, benchmarks automatizados.
