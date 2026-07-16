# 00 — Visão e posicionamento

## Problema

Clonar/rebuild de sites com agentes de IA hoje sofre de:

1. **Alucinação visual** — o modelo “chuta” spacing, cores e tipografia a partir de screenshots  
2. **Falta de dados estruturados** — browser MCP genérico sem schema de extração  
3. **Playbooks presos a um template** — skills excelentes, mas acopladas a um monorepo Next específico  
4. **Produtos monólitos** — extractors poderosos presos a UI/sandbox/runtime próprios, difíceis de reusar em Claude/Grok/Cursor  
5. **QA frágil** — “parece ok” sem gate visual/build determinístico  

## Solução SiteForge

Toolkit em camadas:

```
┌─────────────────────────────────────────────────────────┐
│  Coding Agent Host (Claude / Grok / Cursor / Codex…)    │
│  + Skill SiteForge (processo, qualidade, anti-patterns) │
└──────────────────────────┬──────────────────────────────┘
                           │ MCP tools
                           ▼
┌─────────────────────────────────────────────────────────┐
│  SiteForge MCP / CLI                                    │
│  extract · chunk · query · assets · screenshot · diff   │
└──────────────────────────┬──────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│  Artefatos: source JSON · sections · public/ · specs    │
│  Template opcional: Next 16 + shadcn + Tailwind v4      │
└─────────────────────────────────────────────────────────┘
```

**Princípio:** o host agent orquestra; o MCP prova a verdade da página; a skill impõe disciplina de clone.

## Proposta de valor

| Para | Valor |
|------|--------|
| Dev com site legado | Rebuild em stack moderna com fidelidade alta |
| Time com coding agents | Pipeline repetível, multi-agente, multi-host |
| Autor de skills/MCP | Contrato de extração reutilizável |
| Quem estuda UI | Specs com `getComputedStyle` reais |

## Não-objetivos (MVP e Tier 2)

- Substituir Claude Code / Cursor como IDE agent  
- Sandbox tipo BoxLite/WebContainer  
- UI chat + Monaco própria  
- Scraping em massa / crawler multi-site enterprise  
- Bypass de captcha/auth  
- Clones de apps full-stack com backend real  

## Objetivos de fidelidade

| Nível | Definição |
|-------|-----------|
| **P0** | Layout desktop + mobile, cores, tipografia, assets reais, seções principais |
| **P1** | Hover/focus, theme light/dark, CSS variables, media queries básicas |
| **P2** | Scroll-driven, carousels, Lenis, WebGL — best-effort, documentar gaps |

## Princípios de design do produto

1. **Source of truth = dados extraídos**, não memória do LLM  
2. **Sections pequenas** (token budget + três princípios de chunking)  
3. **Specs auditáveis** (markdown ou JSON) antes de build  
4. **Build sempre verde** após cada merge de seção  
5. **MCP real** (stdio/HTTP), não “MCP” só no nome  
6. **Skill portátil** — funciona sem o monorepo, template é opcional  
7. **Uso legítimo first** — avisos, escopo, sem tooling de phishing  

## Sucesso (12 meses)

- MCP instalável em ≥3 hosts de agentes  
- Skill com sync multi-plataforma  
- 10 sites de benchmark com score de diff documentado  
- Comunidade usa SiteForge **fora** do template (em repos existentes)  
- Diferenciação clara vs JCodesMore (tools) e vs PWC (portabilidade)  

## Anti-sucesso

- Só mais um SKILL.md copiado  
- Produto UI que ninguém mantém  
- Extractor que só funciona em `example.com`  
- Nome/associação com phishing kits  
