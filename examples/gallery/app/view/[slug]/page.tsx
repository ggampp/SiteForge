import Link from "next/link";
import { notFound } from "next/navigation";
import { CLONES, getClone } from "@/lib/clones";

export function generateStaticParams() {
  return CLONES.map((c) => ({ slug: c.slug }));
}

export default async function ViewClonePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const clone = getClone(slug);
  if (!clone) notFound();

  return (
    <main>
      <div className="toolbar">
        <div>
          <Link href="/">← Galeria</Link>
          <h1 style={{ margin: "8px 0 4px", fontSize: "1.5rem" }}>
            {clone.title}
          </h1>
          <div className="meta">
            sourceId: {clone.sourceId} ·{" "}
            <a href={clone.sourceUrl} target="_blank" rel="noreferrer">
              original
            </a>
          </div>
        </div>
        <div className="actions">
          <a className="btn primary" href={`/clones/${clone.slug}/index.html`} target="_blank" rel="noreferrer">
            Tela cheia
          </a>
        </div>
      </div>
      <div className="frame-wrap">
        <iframe
          title={clone.title}
          src={`/clones/${clone.slug}/index.html`}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
        />
      </div>
    </main>
  );
}
