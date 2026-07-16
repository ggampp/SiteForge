# Case studies — SiteForge example clones

Generated 2026-07-15 with SiteForge extract → chunk → download → rebuild.

## Matrix

| Clone | URL | sourceId | Sections | Assets | Offline CSS | Notes |
|-------|-----|----------|----------|--------|-------------|-------|
| soudobem-site | https://soudobemsite.testecliente.com.br/ | `src_mrmtd5kz_d7f282cb` | 17 | 20 | ~100KB | Landing + CSS offline |
| app-soudobem | https://appsoudobem.testecliente.com.br/ | `src_mrmtdg8u_fd8c7b02` | 2 | 1 | ~171KB | Login shell (auth SPA) |
| tachyonix | https://www.tachyonix.io/ | `src_mrmte9qu_d37ce2e7` | 3 | 58 | ~815KB | Theme/bootstrap offline |
| tachyonix-hub | https://www.tachyonix.io/hub/?id=inicio | `src_mrmtffpa_049c0041` | 3 | 8 | ~17KB | Hub inicio |

## Pipeline used

```bash
siteforge extract <url> --wait 3000
siteforge rebuild <sourceId> -t examples/clones/<slug> --slug <slug>
```

Rebuild mode: **raw.html** + `assets/siteforge-offline.css` (stylesheets capturados/baixados, `url()` reescritos) + assets locais.

## How to view

```bash
node examples/scripts/serve-clones.mjs
# http://localhost:4173/soudobem-site/
# http://localhost:4173/tachyonix/
```

Or gallery:

```bash
node examples/scripts/sync-clones-to-gallery.mjs
cd examples/gallery && pnpm install && pnpm dev
```

## Limitations (honest)

1. Client-only SPAs after login are **not** fully mirrored without credentials.
2. External CDN assets not discovered in the DOM tree may still 404 offline.
3. Interactive widgets (live chat, analytics, auth APIs) are not reimplemented.
4. Visual score vs original should be measured with `siteforge diff` after local screenshots.

## Ethics

These demos assume authorized analysis of properties controlled by the project owner / clients. Do not use SiteForge for phishing or unauthorized impersonation.
