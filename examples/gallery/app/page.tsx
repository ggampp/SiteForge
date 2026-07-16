import Link from "next/link";
import { CLONES } from "@/lib/clones";

export default function GalleryHome() {
  return (
    <main>
      <div className="hero">
        <span className="badge">SiteForge examples</span>
        <h1>Clones de demonstração</h1>
        <p>
          Páginas reconstruídas a partir de extract + rebuild do SiteForge
          (HTML capturado, assets locais, seções chunked). Uso legítimo /
          demos autorizadas.
        </p>
      </div>

      <div className="grid">
        {CLONES.map((c) => (
          <article key={c.slug} className="card">
            <h2>{c.title}</h2>
            <p>{c.summary}</p>
            <div className="meta">
              origem: {c.sourceUrl}
              <br />
              seções: {c.sectionCount} · assets: {c.assetCount} · modo:{" "}
              {c.mode}
            </div>
            <div className="actions">
              <Link className="btn primary" href={`/view/${c.slug}`}>
                Abrir clone
              </Link>
              <a className="btn" href={c.sourceUrl} target="_blank" rel="noreferrer">
                Original
              </a>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
