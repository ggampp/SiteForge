#!/usr/bin/env node
import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const src = path.join(root, "examples", "clones");
const dest = path.join(root, "examples", "gallery", "public", "clones");

const slugs = ["soudobem-site", "app-soudobem", "tachyonix", "tachyonix-hub"];

await rm(dest, { recursive: true, force: true });
await mkdir(dest, { recursive: true });

for (const slug of slugs) {
  const from = path.join(src, slug);
  const to = path.join(dest, slug);
  await cp(from, to, { recursive: true });
  console.log("synced", slug);
}

console.log("done →", dest);
