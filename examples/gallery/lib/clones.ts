export type CloneInfo = {
  slug: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceId: string;
  mode: string;
  sectionCount: number;
  assetCount: number;
};

export const CLONES: CloneInfo[] = [
  {
    slug: "soudobem-site",
    title: "Sou do Bem — Site",
    summary:
      "Landing institucional do movimento Sou do Bem (extract completo + seções).",
    sourceUrl: "https://soudobemsite.testecliente.com.br/",
    sourceId: "src_mrmt0l4c_27f01b4a",
    mode: "raw",
    sectionCount: 17,
    assetCount: 6,
  },
  {
    slug: "app-soudobem",
    title: "Sou do Bem — App (login)",
    summary:
      "Tela de entrada do app SocialTech (SPA autenticada; shell + login capturados).",
    sourceUrl: "https://appsoudobem.testecliente.com.br/",
    sourceId: "src_mrmt2wvz_3928c5a2",
    mode: "raw",
    sectionCount: 2,
    assetCount: 1,
  },
  {
    slug: "tachyonix",
    title: "Tachyonix — Home",
    summary: "Home marketing Tachyonix com assets e layout capturados.",
    sourceUrl: "https://www.tachyonix.io/",
    sourceId: "src_mrmt1j8n_005f1cbc",
    mode: "raw",
    sectionCount: 3,
    assetCount: 38,
  },
  {
    slug: "tachyonix-hub",
    title: "Tachyonix — Hub início",
    summary: "Hub /inicio do produto Tachyonix (extract da rota hub).",
    sourceUrl: "https://www.tachyonix.io/hub/?id=inicio",
    sourceId: "src_mrmt2atu_1bb21970",
    mode: "raw",
    sectionCount: 3,
    assetCount: 6,
  },
];

export function getClone(slug: string): CloneInfo | undefined {
  return CLONES.find((c) => c.slug === slug);
}
