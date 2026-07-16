# 04 — Matriz competitiva e gaps

## Comparativo principal

| Dimensão | JCodesMore | Perfect-Web-Clone | clone-team | Downloaders | **SiteForge (alvo)** |
|----------|------------|-------------------|------------|-------------|----------------------|
| Tipo | Skill + template | Produto full | Skill + workflow | Crawler | **Toolkit MCP+Skill** |
| Extractor próprio | Não (host browser MCP) | Sim (Playwright) | agent-browser | HTTP | **Sim (Playwright)** |
| Schema tipado | Não | Sim (Pydantic) | Parcial | Não | **Sim** |
| Chunking 3 princípios | Manual na skill | Automático | Manual/workflow | N/A | **Automático** |
| MCP protocolo real | Não | Não (bridge interno) | Não | Não | **Sim (stdio/HTTP)** |
| Skill multi-host | Excelente | Companion Claude | Claude-centric | N/A | **Sim** |
| Specs auditáveis | Markdown forte | JSON source | Specs + ARCH.md | N/A | **JSON + MD** |
| Multi-agent | Worktrees host | Workers internos | Dynamic workflow | N/A | **Host agents** |
| Visual QA gate | Manual skill | Preview+healing | Tester loop | N/A | **Tool visual_diff** |
| Sandbox/UI | Não | Sim | Não | N/A | **Não (MVP)** |
| Tração | ~28k★ | ~249★ | ~18★ | Variável | — |
| Manutenção | Comunidade | 1 maintainer | Pequena | Variável | Planejada |

## Gap analysis (oportunidade)

| Gap | Quem quase fecha | O que falta | SiteForge |
|-----|------------------|-------------|-----------|
| Extract determinístico portátil | PWC skill scripts | Empacotar como MCP multi-host | Core |
| Playbook interaction-aware | JCodesMore | Dados estruturados | Skill + extract flags |
| Tester unskippable | clone-team | Extractor forte | QA tools + skill gates |
| Nome/categoria limpa | — | WebClone já é mirror MCP | SiteForge branding |
| Template desacoplado | JCodesMore | Tools sem forçar template | template opcional |

## Posicionamento one-liner

> **SiteForge** is the open agent toolkit that turns any public page into structured extraction data and production-ready frontend code — via MCP tools and a portable clone skill.

## Anti-posicionamento

- Não somos HTTrack  
- Não somos phishing kit  
- Não somos “outro v0/screenshot-to-code”  
- Não somos IDE agent  
- Não precisamos de UI própria para vencer  

## Ameaças

| Ameaça | Mitigação |
|--------|-----------|
| JCodesMore adiciona extractor | Diferenciar com MCP + schema + packaging |
| PWC publica MCP real | Open-source first, DX multi-host, docs |
| WebClone confunde mercado | Messaging: rebuild components ≠ mirror HTML |
| Agents ficam bons o bastante sem tools | Tools ainda vencem em scale/consistency |

## Tabela “steal with pride”

| Origem | Steal | Skip |
|--------|-------|------|
| JCodesMore | Fases, specs, anti-patterns, multi-host sync, interaction model | Acoplar só a um template |
| PWC | Extract pipeline, schema, chunking, query source | UI, sandbox, fake MCP name |
| clone-team | Tester gate, pause/resume, ARCH.md opcional | Dependência só Claude plugin |
| clone-ui | Anti-hallucination phrasing, multi-stack | Baixa maturidade |
| Downloaders | Batch download patterns | Output HTML morto |
