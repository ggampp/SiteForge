# 06 — Contrato MCP SiteForge

## Metadados do server

```json
{
  "name": "siteforge",
  "version": "0.1.0",
  "description": "Deterministic website extraction, sectioning, assets, and visual QA for AI coding agents"
}
```

## Princípios

1. Tools retornam **dados e paths**, não código React gerado  
2. Todo extract cria um `source_id` estável  
3. Payloads grandes: retornar **summary + path**; full via `query_source` / `get_section`  
4. Erros estruturados: `{ ok: false, code, message, hint }`  
5. Side effects de FS só sob `outDir` / `.siteforge`  

---

## Tools MVP (P0)

### `extract_page`

Extrai página e persiste source.

| Input | Tipo | Default | Desc |
|-------|------|---------|------|
| `url` | string | required | URL http(s) |
| `viewport` | `{width,height}` | `{1440,900}` | Viewport |
| `outDir` | string | `.siteforge` | Root store |
| `fullPageScreenshot` | bool | true | Full page PNG |
| `waitMs` | number | 2000 | Extra wait pós-load |
| `maxDepth` | number | 30 | DOM walk depth |

**Output:**
```json
{
  "ok": true,
  "sourceId": "src_…",
  "url": "…",
  "title": "…",
  "paths": {
    "meta": ".siteforge/sources/src_…/meta.json",
    "extraction": ".siteforge/sources/src_…/extraction.json",
    "screenshot": ".siteforge/sources/src_…/screenshots/viewport.png"
  },
  "stats": {
    "totalElements": 1200,
    "maxDepth": 14,
    "loadTimeMs": 3400
  }
}
```

### `list_sources`

Lista sources no `outDir`.

### `get_page_metadata`

| Input | `sourceId` |
| Output | metadata + theme_detection summary |

### `list_sections`

Roda chunking se necessário; lista sections.

**Output item:**
```json
{
  "sectionId": "section_001",
  "selector": "main > section.hero",
  "rect": { "x": 0, "y": 0, "width": 1440, "height": 720 },
  "estimatedTokens": 4200,
  "path": ".siteforge/sources/…/sections/section_001.json"
}
```

### `get_section`

| Input | `sourceId`, `sectionId` |
| Output | html snippet, text, styles summary, images[], rect, selector |

### `query_source`

| Input | `sourceId`, `path` (JSONPath or dotted) |
| Output | matched value (truncated se > N KB) |

### `discover_assets`

Inventário images/videos/fonts/bg do source ou re-scan URL.

### `download_assets`

| Input | `sourceId`, `assetUrls?`, `targetDir` (default `public/images`) |
| Output | `{ downloaded: [{url, path, bytes}], failed: [] }` |

### `screenshot_page`

| Input | `url` **ou** `sourceId`, `viewport?`, `fullPage?` |
| Output | path PNG |

### `siteforge_doctor`

Health: browsers installed, versions, disk.

---

## Tools P1 (Tier 2)

### `extract_page_phased` + `get_extraction_status`

Quick return + poll (como PWC extract_quick).

### `capture_interaction`

| Input | `sourceId` ou live `url`, `selector`, `kind`: hover\|focus\|active |
| Output | styleDiff before/after |

### `capture_theme`

Light/dark dual capture se suportado.

### `visual_diff`

| Input | `baselinePath`, `candidatePath` **ou** `candidateUrl` + `sourceId` |
| Output | `{ score, diffPath, width, height }` |

### `write_spec_stub`

Gera markdown spec skeleton a partir de `sectionId` (template JCodesMore-like).

### `export_design_tokens`

CSS variables + color/font summary → snippet para `globals.css`.

---

## Tools P2 (opcional / later)

| Tool | Nota |
|------|------|
| `interaction_sweep` | Heurística scroll/click — difícil acertar |
| `tech_stack_detect` | Framework sniff |
| `network_summary` | XHR/fetch inventory |
| `pause_job` / `resume_job` | clone-team style |

---

## Tools que **não** entram no MCP

| Anti-tool | Motivo |
|-----------|--------|
| `generate_react_component` | Domínio do LLM host |
| `spawn_workers` | Domínio do coding agent |
| `start_dev_server` | Host/shell |
| `heal_build` | Host |

---

## Formato de section JSON

```json
{
  "sectionId": "section_001",
  "name": "hero",
  "selector": "…",
  "rect": {},
  "estimatedTokens": 0,
  "html": "…",
  "textContent": "…",
  "styles": { "container": {}, "children": [] },
  "images": [{ "src": "…", "alt": "…", "localPath": null }],
  "interactionHints": []
}
```

## Erros padrão

| code | Quando |
|------|--------|
| `INVALID_URL` | URL malformada / non-http |
| `NAVIGATION_FAILED` | timeout, DNS, SSL |
| `SOURCE_NOT_FOUND` | sourceId inválido |
| `SECTION_NOT_FOUND` | sectionId inválido |
| `PLAYWRIGHT_MISSING` | browsers não instalados |
| `PATH_ESCAPE` | outDir fora do permitido |
| `EXTRACT_TIMEOUT` | excedeu deadline |
| `PRIVATE_NETWORK_BLOCKED` | SSRF guard |

## Configuração MCP (exemplo)

```json
{
  "mcpServers": {
    "siteforge": {
      "command": "npx",
      "args": ["-y", "@siteforge/mcp"],
      "env": {
        "SITEFORGE_OUT_DIR": ".siteforge"
      }
    }
  }
}
```

## Versionamento

- SemVer no server  
- `siteforge_doctor` reporta `coreVersion` + `protocolVersion`  
- Breaking schema changes → major  
