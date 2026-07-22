# MCP + CLI verification log

Date: 2026-07-22
Host: local (Windows) + CI matrix (ubuntu/windows)

## Commands

```bash
pnpm build
pnpm test
pnpm doctor
pnpm e2e
pnpm verify:mcp
pnpm skill:sync
pnpm bench:smoke   # network; optional
```

## Results (local session)

| Check | Status |
|-------|--------|
| `pnpm build` | Run in session |
| Unit tests (SSRF, T2, visual_diff, path escape) | Run in session |
| `node scripts/verify-mcp.mjs` | Lists P0+T2 tools |
| `node scripts/e2e-smoke.mjs` | Offline extract→chunk→tokens→spec→diff |
| Skill sync → Claude/Cursor/Codex/Grok | `pnpm skill:sync` |
| Manual Cursor MCP session | Use Cursor MCP config pointing at `packages/mcp/dist/server.js` |

## Agent host notes

- **Cursor:** add MCP server `siteforge` → `node packages/mcp/dist/server.js` (or `pnpm --filter @siteforge/mcp exec siteforge-mcp`).
- **Claude Code / Grok:** same stdio binary; skill via `pnpm skill:sync`.
- Live agent click-through of `extract_page` + `list_sections` should be re-confirmed after MCP is wired in each host settings UI.

## Sample Cursor MCP config

```json
{
  "mcpServers": {
    "siteforge": {
      "command": "node",
      "args": ["D:/claude_projects/dev-services/SiteForge/packages/mcp/dist/server.js"],
      "env": { "SITEFORGE_OUT_DIR": ".siteforge" }
    }
  }
}
```
