import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-[var(--muted)]">
          SiteForge template
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Extract. Spec. Rebuild.
        </h1>
        <p className="max-w-2xl text-lg text-[var(--muted)]">
          Scaffold for agent-driven website rebuilds. Run{" "}
          <code className="rounded bg-[var(--card)] px-1.5 py-0.5 text-sm">
            /siteforge &lt;url&gt;
          </code>{" "}
          or the SiteForge MCP tools, then replace this page with section
          components.
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border border-white/10 bg-[var(--card)] p-6">
        <h2 className="text-lg font-medium">Research dirs</h2>
        <ul className="list-disc space-y-1 pl-5 text-[var(--muted)]">
          <li>
            <code>docs/research/</code> — section specs
          </li>
          <li>
            <code>public/images/</code> — downloaded assets
          </li>
          <li>
            <code>.siteforge/</code> — extract store (gitignored locally)
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button href="https://github.com/ggampp/SiteForge">GitHub</Button>
        <Button variant="secondary" href="/docs">
          Docs placeholder
        </Button>
      </div>
    </main>
  );
}
