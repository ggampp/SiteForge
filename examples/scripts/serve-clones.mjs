#!/usr/bin/env node
/**
 * Tiny static server for examples/clones on port 4173.
 */
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../clones",
);
const port = Number(process.env.PORT || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || "/").split("?")[0] || "/");
    if (urlPath === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<!doctype html><meta charset=utf-8><title>SiteForge clones</title>
        <h1>SiteForge clones</h1>
        <ul>
          <li><a href="/soudobem-site/">soudobem-site</a></li>
          <li><a href="/app-soudobem/">app-soudobem</a></li>
          <li><a href="/tachyonix/">tachyonix</a></li>
          <li><a href="/tachyonix-hub/">tachyonix-hub</a></li>
        </ul>`);
      return;
    }
    if (urlPath.endsWith("/")) urlPath += "index.html";
    const file = path.normalize(path.join(root, urlPath));
    if (!file.startsWith(root)) {
      res.writeHead(403);
      res.end("forbidden");
      return;
    }
    const st = await stat(file);
    if (st.isDirectory()) {
      res.writeHead(302, { Location: urlPath.endsWith("/") ? urlPath + "index.html" : urlPath + "/" });
      res.end();
      return;
    }
    const data = await readFile(file);
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

server.listen(port, () => {
  console.log(`SiteForge clones at http://localhost:${port}/`);
});
