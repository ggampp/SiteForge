# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.x     | Yes (best effort while pre-1.0) |

## Reporting a vulnerability

Please **do not** open a public issue for security problems.

Email: **ggampp@gmail.com** with subject `[SiteForge security]`.

Include:

- Description and impact
- Steps to reproduce
- Affected package/version
- Whether a fix is known

We aim to acknowledge within 7 days.

## Scope notes

SiteForge drives a headless browser and downloads assets from URLs you provide.

- Prefer authorized targets only (sites you own or have permission to analyze).
- Do not point SiteForge at internal/private networks unless you understand SSRF risk.
- Never pass secrets into extract targets expecting them to stay private in stored JSON.
