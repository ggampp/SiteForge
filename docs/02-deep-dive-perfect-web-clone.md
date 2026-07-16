# 02 — Deep-dive: Perfect-Web-Clone

**Repo:** https://github.com/ericshang98/Perfect-Web-Clone  
**Skill:** https://github.com/ericshang98/perfect-web-clone-skill  
**Análise:** 2026-07-15 via `gh` autenticado + leitura de sources

## Metadados

| Campo | Valor |
|-------|--------|
| Stars / forks | 249 / 21 |
| Criado | 2026-01-06 |
| Último push (código) | 2026-06-18 |
| Linguagens | Python ~59%, TypeScript ~40% |
| Contributors | 1 (ericshang98) |
| Issues abertas | 6 (Windows/Playwright, security, etc.) |
| License API | null (README alega MIT) |

## Arquitetura

```
backend/ (FastAPI :5100)
  extractor/     Playwright extraction
  agent/         multi-agent + tools + WS
  boxlite/       sandbox backend
  cache/, sources/, checkpoint/
  image_proxy/, image_downloader/
frontend/ (Next :3100)
  extractor UI, agent chat, preview iframe
```

### Routers backend

| Prefixo | Função |
|---------|--------|
| `/api/cache/*` | Cache de extrações |
| `/api/playwright/*` | Extract (paths reais; README às vezes diz extractor) |
| `/api/agent/*` | WebSocket clone agent |
| `/api/boxlite/*` | Sandbox |
| `/api/sources/*` | FS sources |
| `/api/image-proxy/*`, `/api/image-downloader/*` | Assets |
| `/api/checkpoints/*` | Estado |

## Extractor (`PlaywrightExtractorService`)

### Métodos principais

- Browser lifecycle: `_ensure_browser`, `close`
- Entry: `extract`, `extract_quick`, `_extract_remaining_phases`
- Theme: `_detect_theme_support`, `_capture_theme_styles`, `_extract_themed_data`
- Core: `_extract_metadata`, `_extract_dom_tree`, `_extract_assets`, `_scroll_to_load_lazy_content`
- CSS: `_extract_css_data` (stylesheets, keyframes, variables, transitions, pseudo, media)
- Network: `_setup_network_monitoring`, `_compile_network_data`
- Interactions: `_capture_interactions` (hover/focus em a, button, input, …)
- Resources: `_download_resources`, `fetch_resources_only`
- Analysis: `_analyze_tech_stack`, `_analyze_components`

### Pipeline `extract()`

```
new_page → goto → lazy scroll
→ metadata | screenshot | assets | html | network (paralelo)
→ theme detect (+ dual mode se BOTH)
→ DOM tree (getComputedStyle)
→ CSS data
→ interactions
→ full-page screenshot
→ download resources (serial)
→ tech_stack + components
→ ExtractionResult
```

### Pipeline `extract_quick()`

| Fase | Conteúdo |
|------|----------|
| QUICK | metadata, screenshot, assets, raw_html, theme (~25%) |
| DOM | dom_tree, style_summary |
| ADVANCED | css, network, interactions, tech_stack, components |
| COMPLETE | downloaded_resources |

Poll: `GET /extract/{request_id}/status`

### Schema chave

**ElementInfo:** tag, id, classes, rect, styles (computed), text, attributes, children, xpath/selector, visibility/interactive flags.

**ExtractionResult:** metadata, screenshots, dom_tree, style_summary, assets, raw_html, css_data, network_data, downloaded_resources, interaction_data, tech_stack, components, theme_detection, light/dark themed data.

**ExtractRequest flags:** viewport, max_depth, include_hidden, download_resources, capture_network, capture_interactions, extract_css, full_page_screenshot.

## ComponentAnalyzer (sem LLM)

Fluxo rule-based:

1. Page dimensions  
2. Extract sections from DOM (incl. horizontal)  
3. Split se > ~10K tokens (`inner_html_length // 4`)  
4. Remove overlaps  
5. Merge gaps  
6. Validate **three principles**  
7. ComponentInfo + unify `section_1…N`

### Three Principles

| # | Nome | Regra |
|---|------|--------|
| 1 | Mutual exclusivity | Sem overlap de bounding boxes (threshold ~100px²) |
| 2 | Complete coverage | Cobertura y=0…pageHeight |
| 3 | Size control | Chunk abaixo do teto de tokens |

Documentado também em `perfect-web-clone-skill/docs/CHUNKING.md` (skill usa até 50K tokens).

## Agent runtime

### Orchestrator (6 stages)

1. Preprocess messages  
2. Compression check  
3. System prompt  
4. Conversation stream  
5. Tool execution  
6. Collect results  

`max_iterations` efetivamente ilimitado.

### WorkerManager

- Section tasks em paralelo com `Semaphore`  
- Merge de resultados  
- Eventos spawned/started/completed/error  

### Tools (`mcp_tools.TOOL_DEFINITIONS`) ~24

| Grupo | Tools |
|-------|--------|
| Files | read/write/edit/delete/list_files |
| Shell | shell, reinstall_dependencies |
| Preview | take_screenshot, get_state, get_build_errors, diagnose_preview_state, analyze_build_error |
| Source | query_json_source, get_section_data, get_layout, get_component_analysis |
| Multi-agent | spawn_section_workers, get_worker_status, retry_failed_sections, reconcile_imports |
| Healing | start/verify/stop healing_loop, get_healing_status |

### “MCP” real vs marketing

```python
# Comentário no código:
# "simplified implementation that works with the Claude API directly,
#  rather than the full MCP protocol"
```

- `WebContainerMCPServer` → tools via WebSocket → frontend  
- `BoxLiteMCPServer` → mesma API, executa no sandbox backend  

**Não é servidor MCP stdio para hosts externos.**

## Skill companion

- `scripts/extract_page.py` — CLI Playwright enxuto  
- `scripts/chunk_content.py` — three principles  
- `docs/EXTRACTION.md`, `CHUNKING.md`, `CODE_GENERATION.md`  
- Skill manda spawnar Task subagents no Claude Code  

**Melhor ponto de partida open-source para SiteForge extractor** (menor que o monólito backend).

## O que SiteForge deve copiar (padrões, não código cego)

1. Schema tipado de extração  
2. Pipeline extract + quick/phased  
3. Three principles de chunking  
4. `query_json_source` / JSONPath  
5. Separação extract → generate  
6. Flags de captura (network, interactions, CSS)  

## O que NÃO copiar no MVP

1. BoxLite / WebContainer dual stack  
2. UI chat/IDE  
3. Naming MCP sem protocolo  
4. Healing loop embutido (host agent já tem shell)  
5. Orchestrator + memory multi-tier  

## Riscos observados no projeto

- Windows + Playwright/uvicorn (issues abertas)  
- Single maintainer  
- CORS `*` + image proxy (security issue)  
- Context explosion (200KB+ JSON)  
- Interactions limitadas vs scroll-driven sites  
