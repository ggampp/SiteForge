import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow serving sibling clone static files via rewrite in dev notes;
  // clones are opened as static dirs or via /clone/[slug] iframe base.
  outputFileTracingRoot: path.join(__dirname, "../.."),
};

export default nextConfig;
