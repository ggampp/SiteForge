# 10 — Riscos, ética e legal

## Uso legítimo

SiteForge é destinado a:

- Sites que você **possui** ou tem **autorização** para copiar
- Migração de stacks (WordPress → Next, etc.)
- Recuperação de front quando o source se perdeu
- Aprendizado e estudo de layout com respeito a direitos

## Uso proibido (documentar em README + skill + CLI banner)

- Phishing ou páginas de impersonação
- Clonar marcas/assets para passar como produto alheio
- Violar ToS de crawlers/scraping do alvo
- Contornar autenticação, captcha, paywall

## Riscos técnicos

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Anti-bot / WAF | Extract falha | Erros claros; headed mode; não contornar CAPTCHA |
| SPA hydrations | DOM incompleto | wait networkidle + waitMs + scroll lazy |
| Shadow DOM | Estilos perdidos | Suporte phased T2 |
| Canvas/WebGL | Não clonável em HTML | Documentar gap |
| Scroll libraries (Lenis) | Feel errado | Skill behaviors + optional notes |
| Windows Playwright | Crashes | CI Windows; document browser install |
| JSON gigante | Context overflow | sections + query_source |
| SSRF se exposto | Segurança | Bind localhost; block private IPs |
| Image proxy open | Abuse | Não oferecer proxy público |
| Licença de assets baixados | Legal | Usuário responsável; gitignore assets |

## Riscos de produto

| Risco | Mitigação |
|-------|-----------|
| Confusão com WebClone mirror MCP | Naming + messaging rebuild |
| Scope creep T3 | Roadmap locked; ADR process |
| Single maintainer | Docs first; issues templates |
| Dependência Anthropic-only | MCP multi-host from day 1 |

## Compliance checklist release

- [x] MIT LICENSE file
- [x] SECURITY.md (report vuln)
- [x] README “Not for phishing”
- [x] Skill responsible use block
- [x] CLI prints short ethics note on first run (optional)
- [x] No default tracking/telemetry without opt-in

## Dados e privacidade

- Extract roda **local** por default
- Não enviar DOM para cloud SiteForge (não existe backend SaaS no plano T1/T2)
- Screenshots podem conter PII de páginas logadas — avisar usuário

## Propriedade intelectual

- Código SiteForge: MIT (recomendado)
- Output do clone: responsabilidade do usuário (pode incluir IP de terceiros)
- Não redistribuir assets de terceiros no repo SiteForge (benchmarks com fixtures próprias)
