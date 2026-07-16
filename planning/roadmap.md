# Roadmap SiteForge

## Tier 1 — MVP Toolkit (agora)

**Meta:** MCP + core extract/chunk/assets + skill + template mínimo

- Extract Playwright + schema  
- Three-principles sections  
- MCP P0 tools  
- Skill multi-host (mín. Claude + Cursor)  
- Template Next  
- Doctor + ethics  

**Release:** `v0.1.0`

## Tier 2 — Pro Fidelity

**Meta:** Qualidade de extract nível PWC + QA automatizável

- Theme light/dark  
- Interaction capture  
- CSS variables/animations export  
- Phased extract + status  
- visual_diff  
- write_spec_stub / design tokens  
- Benchmark suite 10 sites  
- Windows CI  
- Pause/resume job state (opcional)  

**Release:** `v0.2.0` → `v0.3.0`

## Tier 3 — Product Surface (só com tração)

**Meta:** Experiência produto (não bloqueia toolkit)

- Web UI extractor + job history  
- Optional hosted runners  
- Multi-agent worker service  
- Sandbox preview  
- Team workspaces  

**Release:** `v1.0.0` product line (separar branding se necessário)

## Timeline ilustrativa (1 sênior)

```
M1–M3   Tier 1
M4–M7   Tier 2
M8+     Tier 3 only if KPIs met
```

## KPIs go/no-go Tier 3

- ≥ 1 external contributor ou ≥ 50 users ativos  
- MCP estável (sem breaking semanal)  
- Benchmark médio visual score acima do threshold  
- Manutenção T1/T2 < 20% tempo semanal  

## Versionamento

| Versão | Significado |
|--------|-------------|
| 0.x | Breaking OK com changelog |
| 1.0 | MCP contract stable |
