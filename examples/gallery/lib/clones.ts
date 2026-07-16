export type CloneInfo = {
  slug: string;
  title: string;
  summary: string;
  sourceUrl: string;
  sourceId: string;
  mode: string;
  sectionCount: number;
  assetCount: number;
  cssBytes: number;
};

export const CLONES: CloneInfo[] = [
  {
    slug: "soudobem-site",
    title: "Sou do Bem — Site",
    summary:
      "Landing institucional com CSS offline (~100KB) + assets locais.",
    sourceUrl: "https://soudobemsite.testecliente.com.br/",
    sourceId: "src_mrmtd5kz_d7f282cb",
    mode: "raw+offline-css",
    sectionCount: 17,
    assetCount: 20,
    cssBytes: 101900,
  },
  {
    slug: "app-soudobem",
    title: "Sou do Bem — App (login)",
    summary:
      "Tela de login do app com stylesheet capturado offline (~171KB).",
    sourceUrl: "https://appsoudobem.testecliente.com.br/",
    sourceId: "src_mrmtdg8u_fd8c7b02",
    mode: "raw+offline-css",
    sectionCount: 2,
    assetCount: 1,
    cssBytes: 171457,
  },
  {
    slug: "tachyonix",
    title: "Tachyonix — Home",
    summary:
      "Home marketing com bootstrap/theme CSS offline (~815KB) e assets.",
    sourceUrl: "https://www.tachyonix.io/",
    sourceId: "src_mrmte9qu_d37ce2e7",
    mode: "raw+offline-css",
    sectionCount: 3,
    assetCount: 58,
    cssBytes: 815249,
  },
  {
    slug: "tachyonix-hub",
    title: "Tachyonix — Hub início",
    summary: "Hub /inicio com CSS e assets capturados para uso offline.",
    sourceUrl: "https://www.tachyonix.io/hub/?id=inicio",
    sourceId: "src_mrmtffpa_049c0041",
    mode: "raw+offline-css",
    sectionCount: 3,
    assetCount: 8,
    cssBytes: 16789,
  },
];

export function getClone(slug: string): CloneInfo | undefined {
  return CLONES.find((c) => c.slug === slug);
}
