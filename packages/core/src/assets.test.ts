import { describe, expect, it } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  discoverAssetsFromTree,
  downloadAssets,
  resolveSafeTargetPath,
} from "./assets.js";
import type { ElementNode } from "./schema.js";
import { SiteForgeException } from "./errors.js";

describe("discoverAssetsFromTree", () => {
  it("finds img and background urls", () => {
    const root: ElementNode = {
      tag: "body",
      children: [
        {
          tag: "img",
          attributes: { src: "/logo.png" },
          children: [],
        },
        {
          tag: "div",
          styles: {
            backgroundImage: 'url("https://cdn.example.com/bg.jpg")',
          },
          children: [],
        },
      ],
    };
    const assets = discoverAssetsFromTree(root, "https://example.com/page");
    expect(assets.some((a) => a.url === "https://example.com/logo.png")).toBe(
      true,
    );
    expect(
      assets.some((a) => a.url === "https://cdn.example.com/bg.jpg"),
    ).toBe(true);
  });
});

describe("resolveSafeTargetPath", () => {
  it("rejects path escape", () => {
    expect(() =>
      resolveSafeTargetPath("/tmp/assets", "../etc/passwd"),
    ).toThrow(SiteForgeException);
  });

  it("allows plain names", () => {
    const p = resolveSafeTargetPath(path.join(tmpdir(), "assets"), "001_a.png");
    expect(p.endsWith("001_a.png")).toBe(true);
  });
});

describe("downloadAssets", () => {
  it("downloads ok assets and continues on failure", async () => {
    const server = createServer((req, res) => {
      if (req.url === "/ok.png") {
        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(Buffer.from([137, 80, 78, 71, 0, 1, 2, 3]));
      } else {
        res.writeHead(404);
        res.end("nope");
      }
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("no port");
    const base = `http://127.0.0.1:${addr.port}`;

    const outDir = await mkdtemp(path.join(tmpdir(), "sf-assets-"));
    try {
      const result = await downloadAssets({
        sourceId: "src_x",
        targetDir: outDir,
        concurrency: 2,
        assets: [
          { url: `${base}/ok.png`, kind: "image", source: "test" },
          { url: `${base}/missing.png`, kind: "image", source: "test" },
        ],
      });
      expect(result.downloaded.length).toBe(1);
      expect(result.failed.length).toBe(1);
      expect(result.manifest.assets.length).toBe(2);
      await writeFile(path.join(outDir, "keep.txt"), "ok"); // ensure dir usable
    } finally {
      await rm(outDir, { recursive: true, force: true });
      await new Promise<void>((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve())),
      );
    }
  });
});
