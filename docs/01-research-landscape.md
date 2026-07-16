# 01 — Landscape: projetos de clone de website

**Data da pesquisa:** 2026-07-15  
**Método:** hub-research (limitado por `gh auth` inicial) + web + GitHub topics + deep-dives  
**Nota:** após `gh auth login`, metadados oficiais via GitHub API.

## Famílias de projetos

| Família | O que faz | Output | Exemplo |
|---------|-----------|--------|---------|
| **A. AI skill / template** | Playbook + scaffold para coding agents | React/Next limpo | JCodesMore template |
| **B. Multi-agent product** | Extractor + agents + sandbox/UI | App gerado no produto | Perfect-Web-Clone |
| **C. Downloader estático** | Mirror HTML/CSS/JS offline | Snapshot | X-SLAYER Website-Cloner, HTTrack |
| **D. Blueprint reverse-eng** | Docs/planos, não pixel UI | ARCHITECTURE / prompts | unbuild, partes do clone-team |
| **E. Portfólio “X clone”** | Réplica manual de marca | Demo learning | Netflix/Amazon clones |

SiteForge compete em **A+B (camada tools)**, não em C/E.

---

## Projetos relevantes (AI / agent-native)

### JCodesMore/ai-website-cloner-template (~28,5k★)

- **Tipo:** Template Next 16 + skill `/clone-website` multi-plataforma  
- **Pipeline:** recon → foundation → component specs → parallel builders (worktrees) → visual QA  
- **Extração:** via browser MCP do host (Chrome/Playwright MCP), snippets JS na skill  
- **Força:** playbook maduro, tração, sync multi-agent, interaction model documentado  
- **Fraqueza:** sem extractor/MCP próprio; valor = markdown + scaffold  
- **URL:** https://github.com/JCodesMore/ai-website-cloner-template  

### ericshang98/Perfect-Web-Clone (~249★)

- **Tipo:** Produto FastAPI + Next + multi-agent + 40+ tools internas  
- **Extração:** Playwright próprio, schema rico, theme dual, CSS completo  
- **Chunking:** rule-based, três princípios (no overlap, coverage, token cap)  
- **“MCP”:** bridge interno Anthropic tools ↔ WebSocket/sandbox — **não** MCP stdio padrão  
- **Skill companion:** https://github.com/ericshang98/perfect-web-clone-skill (~30★)  
- **URL:** https://github.com/ericshang98/Perfect-Web-Clone  

### Varalix-Digitech-Solutions/clone-team (~18★)

- **Tipo:** Claude Code skill + dynamic workflow  
- **Diferencial:** Tester gate unskippable, `ARCHITECTURE.md`, pause/resume  
- **URL:** https://github.com/Varalix-Digitech-Solutions/clone-team  

### santowilem/skills (`clone-ui`) (~3★)

- **Tipo:** Skill multi-host (SKILL.md standard)  
- **Diferencial:** anti-hallucination, adversarial verification, multi-stack output  
- **URL:** https://github.com/santowilem/skills  

### Outros

| Projeto | Notas |
|---------|--------|
| samibajwaisking/website-cloner | Skill → single HTML file |
| UHolli/ai-website-cloner | Template Next similar spirit |
| horuz-ai claude-plugins | Pixel-perfect cloner skill (marketplace) |
| ruslanmv/webclone | MCP de **mirror/crawl** (RAG/docs) — domínio de nome “WebClone” ocupado |
| lonexreb/site2cli | URL → CLI/API + MCP generation (outro problema) |

---

## Downloaders clássicos (não rebuild)

| Projeto | Stars (aprox.) | Nota |
|---------|----------------|------|
| X-SLAYER/Website-Cloner | ~350 | Crawler recursivo VB.NET |
| ZKAW/website-cloner | ~57 | Python BS4 |
| zebbern/website-clone | ~42 | Offline dump (topics phishing — cuidado) |
| HTTrack / wget --mirror | — | Clássicos offline |

---

## Insight estratégico

```
Skill markdown sozinha  →  fidelidade limitada (guess)
Produto monólito        →  extract forte, portabilidade fraca
Downloader              →  HTML morto, sem componentes
────────────────────────────────────────────────────
GAP                       →  MCP thin + skill rigorosa + template opcional
                            = SiteForge
```

Ninguém no landscape combina de forma limpa:

1. Extractor nível PWC  
2. MCP protocolo real multi-host  
3. Playbook nível JCodesMore  
4. Quality gate inspirado em clone-team  

**Isso é o espaço do SiteForge.**

---

## Fontes

- GitHub topic `website-clone` (161+ repos; líder JCodesMore)  
- READMEs e source de Perfect-Web-Clone (API `gh`, 2026-07-15)  
- Coveragem mídia/Reddit sobre AI website cloner template  
- Sessões de análise em `ai-website-cloner-template`  
