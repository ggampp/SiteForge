# Disponibilidade de nome — SiteForge

**Checked:** 2026-07-15 (session bootstrap)

## Summary

| Asset | Status | Notes |
|-------|--------|--------|
| npm unscoped `siteforge` | **Taken** | Sierra Softworks static site generator v1.2.3 (2014) |
| npm scope `@siteforge/*` | **Available** | `@siteforge/core`, `mcp`, `cli`, `skill` → 404 |
| PyPI `siteforge` | **Taken** | Unrelated Python package (HTML duplication tooling) — N/A for TS monorepo |
| GitHub `ggampp/siteforge` | **Available** | 404 (not created yet) |
| GitHub `ggampp/SiteForge` | **Available** | 404 |
| Brand "SiteForge" on GitHub | **Crowded** | Several unrelated repos (SSG, AI builders, Chrome extension) — low stars; differentiate via tagline + scope |

## Decision

- **Ship packages as** `@siteforge/core`, `@siteforge/mcp`, `@siteforge/cli` (scoped).
- **CLI bin** remains `siteforge` (local/npx path `@siteforge/cli` → bin name).
- **GitHub repo:** create `ggampp/SiteForge` or `ggampp/siteforge` when ready to push (remote SSH: `git@github-pessoal:ggampp/SiteForge.git`).
- **Do not** try to claim unscoped npm `siteforge` or PyPI.
- Optional later: register npm org `@siteforge` before first publish.

## Checklist

- [x] `npm view siteforge` — taken  
- [x] `npm view @siteforge/core` — free  
- [x] PyPI — taken (ignore for TS)  
- [x] GitHub user namespace free  
- [x] Create GitHub repo `ggampp/SiteForge` (public) — remote `git@github-pessoal:ggampp/SiteForge.git`  
- [ ] Push initial commit (awaiting explicit confirmation)  
- [ ] Create npm org `@siteforge` before publish  
