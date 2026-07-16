# SiteForge example clones

Static rebuilds produced by:

```bash
siteforge extract <url>
siteforge rebuild <sourceId> -t examples/clones/<slug> --slug <slug>
```

| Slug | Source URL |
|------|------------|
| `soudobem-site` | https://soudobemsite.testecliente.com.br/ |
| `app-soudobem` | https://appsoudobem.testecliente.com.br/ |
| `tachyonix` | https://www.tachyonix.io/ |
| `tachyonix-hub` | https://www.tachyonix.io/hub/?id=inicio |

## Serve one clone

```bash
npx --yes serve examples/clones/soudobem-site -p 4173
```

## Gallery (all clones)

```bash
# copy clones into gallery public (from repo root)
node examples/scripts/sync-clones-to-gallery.mjs
cd examples/gallery && pnpm install && pnpm dev
```

Open http://localhost:4310

## Notes

- **app-soudobem** is an authenticated SPA; the capture reflects the **login shell**, not the full private app.
- Rebuilds use `raw.html` + rewritten local assets when available.
- Reference screenshots live under each clone’s `_reference/` folder.
- Legitimate / authorized demo use only.
