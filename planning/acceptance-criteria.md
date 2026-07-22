# Critérios de aceite por épico

## EPIC-0 Bootstrap

- [x] `pnpm install && pnpm build` em repo limpo
- [x] CI falha se typecheck falhar
- [x] LICENSE presente

## EPIC-1 Core Extract

- [x] Dado HTML fixture local, `extract` produz JSON válido no schema Zod
- [x] Cada nó visível relevante tem ≥ estilos layout (display/position/box) quando aplicável
- [x] Screenshots PNG não vazios
- [x] `sourceId` reutilizável em comandos seguintes
- [x] URL inválida → erro `INVALID_URL` sem crash
- [x] `raw.html` opcional no store

## EPIC-2 Chunking

- [x] Validator `threePrinciples` no output
- [x] Overlap removal com threshold
- [x] Coverage check (tolerância)
- [x] Split por `maxTokens` quando possível
- [x] `sectionId`s ordenados por eixo Y

## EPIC-3 Assets

- [x] Discover img/bg do tree
- [x] Falha de 1 URL não aborta batch
- [x] Manifest lista success/fail
- [x] Path escape fora de targetDir rejeitado

## EPIC-4 MCP

- [x] Tools P0 listadas no server (stdio)
- [x] `extract_page` + `list_sections` verificados (CLI + `scripts/verify-mcp.mjs` + docs/verification-mcp.md)
- [x] Respostas grandes truncadas com path para full
- [x] `doctor` reporta missing browsers claramente

## EPIC-5 Skill

- [x] Preflight detecta MCP SiteForge (`doctor` required)
- [x] Fases documentadas com nomes de tools
- [x] Spec template completo
- [x] Responsible use section presente
- [x] Sync gera pelo menos 3 hosts sem erro (claude/cursor/codex/grok)

## EPIC-6 Template

- [x] `pnpm build` no template virgin (`pnpm install --ignore-workspace`)
- [x] Placeholder instrui `/siteforge`
- [x] Pastas research/design-references existem

## EPIC-7 QA

- [x] visual_diff em duas imagens idênticas → score ~1 ou diff vazio
- [x] Imagens diferentes → score < threshold e diff file
- [x] Case study com screenshots before/after (`examples/clones/*/_reference/`)

## EPIC-8 Hardening

- [x] Path traversal tests
- [x] Timeout extract respeitado (+ deadlineMs overall)
- [x] Windows job in CI matrix
- [x] SSRF guards (`PRIVATE_NETWORK_BLOCKED`)
- [x] Download retries
- [x] e2e smoke (`pnpm e2e`)

## Definição de “clone MVP bem-sucedido”

Para uma landing estática escolhida:

1. Extract + ≥ 3 sections
2. Assets principais locais
3. ≥ 50% das seções implementadas como componentes
4. Build green
5. Diff visual desktop documentado (mesmo que score médio)
6. Gaps listados (animações, etc.)
