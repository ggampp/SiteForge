# Contributing to SiteForge

Thanks for helping build SiteForge.

## Legitimate use

SiteForge is for authorized reverse-engineering: sites you own, lost-source recovery, and learning layouts. Do not use it for phishing, brand impersonation, or violating third-party ToS.

## Development setup

```bash
pnpm install
pnpm exec playwright install chromium
pnpm build
pnpm test
pnpm typecheck
```

## Monorepo layout

| Package | Role |
|---------|------|
| `@siteforge/core` | Extract, schema, store, chunk, assets |
| `@siteforge/mcp` | MCP server tools |
| `@siteforge/cli` | `siteforge` CLI |
| `@siteforge/skill` | Skill source + sync scripts |

## Pull requests

1. Keep PRs focused (one concern).
2. Add/adjust tests for core behavior.
3. Do not commit secrets, cookies, or live extract dumps under `.siteforge/`.
4. Update docs when changing MCP tool contracts.

## Style

- TypeScript strict
- Prefer small pure functions in `core`
- MCP tools return data + paths, never generated React
