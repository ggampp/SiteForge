import { defineCommand, runMain as cittyRunMain } from "citty";
import {
  extractPage,
  listSourceIds,
  runDoctor,
  errResult,
  toErrorShape,
  SiteForgeException,
  assertHttpUrl,
  chunkSource,
  getSectionsList,
  getSectionDetail,
  discoverSourceAssets,
  downloadSourceAssets,
  querySource,
  getPageMetadata,
  rebuildSource,
  visualDiff,
} from "@siteforge/core";

const VERSION = "0.1.0";

function printError(err: unknown): never {
  console.error(JSON.stringify(toErrorShape(err), null, 2));
  process.exit(1);
}

const doctor = defineCommand({
  meta: {
    name: "doctor",
    description: "Check Node, Playwright Chromium, and environment",
  },
  async run() {
    const report = await runDoctor(VERSION);
    console.log(`SiteForge doctor v${report.versions.siteforge}`);
    console.log(`Platform: ${report.versions.platform}`);
    console.log(`Node: ${report.versions.node}`);
    console.log("");
    for (const check of report.checks) {
      const mark = check.ok ? "OK" : "FAIL";
      console.log(`[${mark}] ${check.name}: ${check.message}`);
    }
    if (!report.ok) {
      console.log("");
      console.log("Hint: pnpm exec playwright install chromium");
      process.exitCode = 1;
    }
  },
});

const extract = defineCommand({
  meta: {
    name: "extract",
    description: "Extract a page into .siteforge/sources/{id}",
  },
  args: {
    url: {
      type: "positional",
      description: "URL to extract (http/https)",
      required: true,
    },
    out: {
      type: "string",
      description: "Output root directory",
      default: ".siteforge",
      alias: "o",
    },
    wait: {
      type: "string",
      description: "Extra wait after load (ms)",
      default: "2000",
    },
    timeout: {
      type: "string",
      description: "Navigation timeout (ms)",
      default: "60000",
    },
    "no-scroll": {
      type: "boolean",
      description: "Disable lazy scroll before extract",
      default: false,
    },
    "no-screenshots": {
      type: "boolean",
      description: "Skip viewport/full-page screenshots",
      default: false,
    },
    "no-styles": {
      type: "boolean",
      description: "Skip computed style capture",
      default: false,
    },
    "no-raw-html": {
      type: "boolean",
      description: "Skip saving raw.html",
      default: false,
    },
  },
  async run({ args }) {
    try {
      const url = String(args.url);
      assertHttpUrl(url);
      console.error(`Extracting ${url} …`);
      const result = await extractPage({
        url,
        outDir: String(args.out),
        waitMs: Number(args.wait) || 0,
        timeoutMs: Number(args.timeout) || 60_000,
        lazyScroll: !args["no-scroll"],
        screenshots: !args["no-screenshots"],
        captureStyles: !args["no-styles"],
        saveRawHtml: !args["no-raw-html"],
      });
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      printError(err);
    }
  },
});

const list = defineCommand({
  meta: {
    name: "list",
    description: "List source ids under outDir",
  },
  args: {
    out: {
      type: "string",
      description: "Output root directory",
      default: ".siteforge",
      alias: "o",
    },
  },
  async run({ args }) {
    const ids = await listSourceIds(String(args.out));
    console.log(JSON.stringify({ ok: true, sources: ids }, null, 2));
  },
});

const chunk = defineCommand({
  meta: {
    name: "chunk",
    description: "Chunk a source into sections (three principles)",
  },
  args: {
    sourceId: {
      type: "positional",
      description: "Source id",
      required: true,
    },
    out: {
      type: "string",
      default: ".siteforge",
      alias: "o",
    },
    "max-tokens": {
      type: "string",
      default: "10000",
    },
  },
  async run({ args }) {
    try {
      const result = await chunkSource(String(args.out), String(args.sourceId), {
        maxTokens: Number(args["max-tokens"]) || 10_000,
      });
      console.log(
        JSON.stringify(
          {
            ok: true,
            sourceId: args.sourceId,
            pageHeight: result.pageHeight,
            validation: result.validation,
            indexPath: result.indexPath,
            sections: result.summaries,
          },
          null,
          2,
        ),
      );
    } catch (err) {
      printError(err);
    }
  },
});

const sections = defineCommand({
  meta: {
    name: "sections",
    description: "List sections for a source (chunks if needed)",
  },
  args: {
    sourceId: {
      type: "positional",
      required: true,
    },
    out: {
      type: "string",
      default: ".siteforge",
      alias: "o",
    },
  },
  async run({ args }) {
    try {
      const result = await getSectionsList(
        String(args.out),
        String(args.sourceId),
      );
      console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    } catch (err) {
      printError(err);
    }
  },
});

const section = defineCommand({
  meta: {
    name: "section",
    description: "Get one section detail JSON",
  },
  args: {
    sourceId: { type: "positional", required: true },
    sectionId: { type: "positional", required: true },
    out: { type: "string", default: ".siteforge", alias: "o" },
  },
  async run({ args }) {
    try {
      const detail = await getSectionDetail(
        String(args.out),
        String(args.sourceId),
        String(args.sectionId),
      );
      console.log(JSON.stringify({ ok: true, section: detail }, null, 2));
    } catch (err) {
      printError(err);
    }
  },
});

const download = defineCommand({
  meta: {
    name: "download",
    description: "Discover and download assets for a source",
  },
  args: {
    sourceId: { type: "positional", required: true },
    out: { type: "string", default: ".siteforge", alias: "o" },
    target: {
      type: "string",
      description: "Target directory (default: source assets/)",
      alias: "t",
    },
  },
  async run({ args }) {
    try {
      const discovered = await discoverSourceAssets(
        String(args.out),
        String(args.sourceId),
      );
      const result = await downloadSourceAssets(
        String(args.out),
        String(args.sourceId),
        {
          targetDir: args.target ? String(args.target) : undefined,
        },
      );
      console.log(
        JSON.stringify(
          {
            ok: true,
            discovered: discovered.count,
            downloaded: result.downloaded.length,
            failed: result.failed.length,
            manifestPath: result.manifestPath,
            downloadedFiles: result.downloaded,
            failedFiles: result.failed,
          },
          null,
          2,
        ),
      );
    } catch (err) {
      printError(err);
    }
  },
});

const query = defineCommand({
  meta: {
    name: "query",
    description: "Query extraction JSON with dotted path",
  },
  args: {
    sourceId: { type: "positional", required: true },
    path: { type: "positional", required: true },
    out: { type: "string", default: ".siteforge", alias: "o" },
  },
  async run({ args }) {
    try {
      const result = await querySource(
        String(args.out),
        String(args.sourceId),
        String(args.path),
      );
      console.log(JSON.stringify({ ok: true, ...result }, null, 2));
    } catch (err) {
      printError(err);
    }
  },
});

const meta = defineCommand({
  meta: {
    name: "meta",
    description: "Show page metadata for a source",
  },
  args: {
    sourceId: { type: "positional", required: true },
    out: { type: "string", default: ".siteforge", alias: "o" },
  },
  async run({ args }) {
    try {
      const result = await getPageMetadata(
        String(args.out),
        String(args.sourceId),
      );
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      printError(err);
    }
  },
});

const rebuild = defineCommand({
  meta: {
    name: "rebuild",
    description: "Rebuild a source into static HTML + assets",
  },
  args: {
    sourceId: { type: "positional", required: true },
    out: { type: "string", default: ".siteforge", alias: "o" },
    target: {
      type: "string",
      description: "Output directory for the static site",
      required: true,
      alias: "t",
    },
    slug: {
      type: "string",
      description: "Site slug label",
      default: "rebuild",
    },
    "no-raw": {
      type: "boolean",
      description: "Force tree rebuild instead of raw.html",
      default: false,
    },
    "no-assets": {
      type: "boolean",
      description: "Skip asset download",
      default: false,
    },
  },
  async run({ args }) {
    try {
      const result = await rebuildSource({
        outDir: String(args.out),
        sourceId: String(args.sourceId),
        targetDir: String(args.target),
        siteSlug: String(args.slug),
        preferRawHtml: !args["no-raw"],
        downloadAssets: !args["no-assets"],
      });
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      printError(err);
    }
  },
});

const diff = defineCommand({
  meta: {
    name: "diff",
    description: "Visual pixel diff between two PNG screenshots",
  },
  args: {
    a: { type: "positional", required: true, description: "Original PNG" },
    b: { type: "positional", required: true, description: "Candidate PNG" },
    out: {
      type: "string",
      description: "Directory for diff.png",
      alias: "o",
    },
  },
  async run({ args }) {
    try {
      const result = await visualDiff({
        a: String(args.a),
        b: String(args.b),
        outDir: args.out ? String(args.out) : undefined,
      });
      console.log(JSON.stringify(result, null, 2));
    } catch (err) {
      printError(err);
    }
  },
});

const main = defineCommand({
  meta: {
    name: "siteforge",
    version: VERSION,
    description:
      "Extract. Spec. Rebuild — toolkit for AI coding agents. Legitimate use only.",
  },
  subCommands: {
    doctor,
    extract,
    list,
    chunk,
    sections,
    section,
    download,
    query,
    meta,
    rebuild,
    diff,
  },
});

export async function runMain(): Promise<void> {
  await cittyRunMain(main);
}

export { main, SiteForgeException, errResult };
