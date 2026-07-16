# Case studies — SiteForge example clones

Generated 2026-07-15 with SiteForge extract → chunk → download → rebuild.

## Matrix

| Clone | URL | sourceId | Elements | Sections | Assets | Notes |
|-------|-----|----------|----------|----------|--------|-------|
| soudobem-site | https://soudobemsite.testecliente.com.br/ | `src_mrmt0l4c_27f01b4a` | 685 | 17 | 6 | Marketing landing |
| app-soudobem | https://appsoudobem.testecliente.com.br/ | `src_mrmt2wvz_3928c5a2` | 60 | 2 | 1 | Login shell (auth SPA) |
| tachyonix | https://www.tachyonix.io/ | `src_mrmt1j8n_005f1cbc` | 312 | 3 | 38 | Product home |
| tachyonix-hub | https://www.tachyonix.io/hub/?id=inicio | `src_mrmt2atu_1bb21970` | 756 | 3 | 6 | Hub inicio |

## Pipeline used

```bash
siteforge extract <url> --wait 2500
siteforge rebuild <sourceId> -t examples/clones/<slug> --slug <slug>
```

Rebuild mode: **raw.html** + asset URL rewrite to local `assets/`.

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
