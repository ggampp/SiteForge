# SiteForge

**Extract. Spec. Rebuild — for AI coding agents.**

Open-source toolkit that reverse-engineers websites into structured data and rebuildable code for coding agents (Claude Code, Grok, Cursor, Codex, …).

| Layer | Role |
|-------|------|
| **@siteforge/core** | Playwright extract, styles, chunk (3 principles), assets, rebuild, visual diff |
| **@siteforge/cli** | `siteforge` binary |
| **@siteforge/mcp** | MCP stdio tools for agents |
| **@siteforge/skill** | Portable skill playbook + sync script |
| **templates/next-shadcn** | Next + Tailwind scaffold |
| **examples/clones** | Working static rebuilds of demo sites |

---

## Quick start

```bash
pnpm install
pnpm --filter @siteforge/core exec playwright install chromium
pnpm build
pnpm test

pnpm --filter @siteforge/cli exec siteforge doctor
pnpm --filter @siteforge/cli exec siteforge extract https://example.com
pnpm --filter @siteforge/cli exec siteforge chunk <sourceId>
pnpm --filter @siteforge/cli exec siteforge rebuild <sourceId> -t examples/clones/demo --slug demo
```

### CLI commands

`doctor` · `extract` · `list` · `chunk` · `sections` · `section` · `download` · `query` · `meta` · `rebuild` · `diff`

### Example clones (included)

| Slug | Source |
|------|--------|
| [soudobem-site](examples/clones/soudobem-site/) | https://soudobemsite.testecliente.com.br/ |
| [app-soudobem](examples/clones/app-soudobem/) | https://appsoudobem.testecliente.com.br/ |
| [tachyonix](examples/clones/tachyonix/) | https://www.tachyonix.io/ |
| [tachyonix-hub](examples/clones/tachyonix-hub/) | https://www.tachyonix.io/hub/?id=inicio |

```bash
node examples/scripts/serve-clones.mjs
# → http://localhost:4173/
```

See [examples/CASE-STUDIES.md](examples/CASE-STUDIES.md).

---

## Documentation

| Doc | Content |
|-----|---------|
| [docs/INDEX.md](docs/INDEX.md) | Reading order |
| [docs/05-architecture.md](docs/05-architecture.md) | Architecture |
| [docs/06-mcp-contract.md](docs/06-mcp-contract.md) | MCP tools |
| [docs/08-development-plan.md](docs/08-development-plan.md) | Development plan |
| [docs/09-mvp-90-days.md](docs/09-mvp-90-days.md) | MVP timeline |
| [planning/roadmap.md](planning/roadmap.md) | Tiers |

---

## Status

| Item | Status |
|------|--------|
| Phase 0 bootstrap | Done |
| Phase 1 extract | Done |
| Phase 2 chunk + assets | Done |
| Phase 3 MCP P0 tools | Done |
| Phase 4 skill + sync | Done |
| Phase 5 Next template | Done |
| visual_diff + rebuild | Done |
| Example clones (4 sites) | Done |
| npm publish | Pending |

---

## Legitimate use

SiteForge is for: migrating sites you own, recovering lost source, learning real layouts, authorized demos.

**Not** for phishing, impersonation, or violating third-party ToS.

---

## License

MIT — see [LICENSE](LICENSE).
