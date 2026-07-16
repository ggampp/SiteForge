import { describe, expect, it } from "vitest";
import {
  discoverStylesheetUrlsFromHtml,
  extractUrlsFromCss,
  rewriteCssUrls,
} from "./css.js";

describe("css helpers", () => {
  it("discovers stylesheet links from html", () => {
    const html = `
      <link rel="stylesheet" href="/assets/app.css" />
      <link rel="stylesheet" href="https://cdn.example.com/x.css" />
      <link rel="icon" href="/favicon.ico" />
    `;
    const urls = discoverStylesheetUrlsFromHtml(html, "https://site.test/");
    expect(urls).toContain("https://site.test/assets/app.css");
    expect(urls).toContain("https://cdn.example.com/x.css");
    expect(urls).not.toContain("https://site.test/favicon.ico");
  });

  it("extracts url() and @import from css", () => {
    const css = `
      @import url("https://fonts.example/a.css");
      .x { background: url('/img/a.png'); }
      .y { src: url("https://cdn.example/f.woff2"); }
    `;
    const urls = extractUrlsFromCss(css, "https://site.test/page");
    expect(urls).toContain("https://fonts.example/a.css");
    expect(urls).toContain("https://site.test/img/a.png");
    expect(urls).toContain("https://cdn.example/f.woff2");
  });

  it("rewrites css urls via map", () => {
    const map = new Map([
      ["https://site.test/img/a.png", "assets/001_a.png"],
    ]);
    const out = rewriteCssUrls(
      `.x{background:url("/img/a.png")}`,
      "https://site.test/",
      map,
    );
    expect(out).toContain("assets/001_a.png");
  });
});
