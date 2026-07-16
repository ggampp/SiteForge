# 05 — Arquitetura alvo SiteForge

## Diagrama lógico

```
                    ┌──────────────────────────────┐
                    │     Human / Coding Agent     │
                    │  (Claude, Grok, Cursor, …)   │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │ Skill (process)    │    MCP (truth)     │
              │ recon, specs,      │    extract, chunk, │
              │ builders, QA       │    query, assets   │
              └────────────────────┼────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────────┐
                    │     SiteForge Core (lib)     │
                    │  Playwright · schema · store │
                    └──────────────┬───────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              ▼                    ▼                    ▼
         .siteforge/          public/assets         docs/research
         sources/*.json       images/…              specs/*.md
```

## Monorepo proposto

```
SiteForge/
├── README.md
├── docs/                      # pesquisa e planejamento (este material)
├── packages/
│   ├── core/                  # @siteforge/core — extract, chunk, schema, store
│   ├── mcp/                   # @siteforge/mcp — servidor MCP stdio/HTTP
│   ├── cli/                   # siteforge CLI
│   └── skill/                 # skill source + sync scripts
├── templates/
│   └── next-shadcn/           # template opcional (fork-friendly do spirit JCodesMore)
├── benchmarks/
│   └── sites.json             # URLs de QA + golden expectations
└── planning/                  # roadmaps vivos
```

### Alternativa de linguagem

| Opção | Prós | Contras |
|-------|------|---------|
| **TypeScript (recomendado)** | 1 language, MCP SDK bom, alinhado template Next | Playwright TS maduro |
| Python core + TS template | Reuso mental do PWC | Dois ecossistemas |
| Python only | Extract scripts da skill PWC | Skill/template JS fricção |

**Decisão recomendada:** monorepo **TypeScript** (pnpm), Playwright, Zod schemas. Skill em markdown. Template Next separado.

## Pacotes

### `@siteforge/core`

| Módulo | Responsabilidade |
|--------|------------------|
| `browser` | Lifecycle Playwright |
| `extract` | Pipeline extract / extract phased |
| `schema` | Zod types (ElementNode, ExtractionResult, …) |
| `chunk` | Three principles sectioning |
| `assets` | Discover + download batch |
| `store` | Source store em `.siteforge/sources/{id}/` |
| `query` | JSONPath / path queries |
| `diff` | Screenshot compare (pixelmatch ou similar) |

### `@siteforge/mcp`

Expõe tools do [06-mcp-contract.md](06-mcp-contract.md).  
Transport: stdio (default) + streamable HTTP opcional.

### `@siteforge/cli`

```bash
siteforge extract <url> [-o .siteforge]
siteforge chunk <sourceId>
siteforge sections <sourceId>
siteforge query <sourceId> '$.metadata'
siteforge doctor
siteforge mcp   # sobe servidor
```

### `@siteforge/skill` (ou pasta skills/)

Source of truth `SKILL.md` + `sync-skills.mjs` multi-host.

### `templates/next-shadcn`

Scaffold mínimo; skill pode apontar para ele **ou** para repo do usuário.

## Fluxo de dados

```
URL
 → extract → ExtractionResult (JSON)
 → store source_id
 → chunk → sections[]
 → (skill) write specs.md from section payloads
 → (agent) implement components
 → (skill) assemble page
 → visual_diff(original, local)
 → iterate
```

## Persistência

```
.siteforge/
  sources/
    {sourceId}/
      meta.json           # url, timestamps, viewport, phase
      extraction.json     # full or sharded
      sections/
        section_001.json
      screenshots/
        viewport.png
        full.png
      assets-manifest.json
  state.json              # optional job state (pause/resume later)
```

Gitignore padrão: screenshots grandes, raw dumps; option to commit manifests + specs.

## Boundaries

| Dentro do MCP/core | Fora (host agent + skill) |
|--------------------|---------------------------|
| Browser automation | Escolher stack |
| Compute styles | Escrever React |
| Chunk sections | Worktrees / parallel agents |
| Download assets | Merge conflicts |
| Visual pixel diff | Product copy changes |
| Query JSON | UX decisions |

## Non-functional

| NFR | Alvo |
|-----|------|
| Extract página marketing 5k DOM | < 120s cold, < 60s warm browser |
| Section list | < 5s sobre extraction cached |
| MCP startup | < 2s |
| Windows + macOS + Linux | Suportados (Playwright official) |
| Offline após extract | query/chunk offline |

## Segurança

- Sem proxy aberto público por default  
- Downloads só para `outDir` permitido  
- Sem credentials logging  
- SSRF: block private IP ranges opcional em flag enterprise  
- Disclaimer de uso legítimo no CLI e skill  

## Observabilidade

- Structured logs (level via `SITEFORGE_LOG`)  
- `siteforge doctor` — playwright browsers, disk, versions  
- Timing spans por fase de extract  
