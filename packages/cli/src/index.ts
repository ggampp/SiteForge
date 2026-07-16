import { defineCommand, runMain as cittyRunMain } from "citty";
import {
  extractPage,
  listSourceIds,
  runDoctor,
  errResult,
} from "@siteforge/core";

const VERSION = "0.1.0";

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
  },
  async run({ args }) {
    const url = String(args.url);
    if (!/^https?:\/\//i.test(url)) {
      console.error(
        JSON.stringify(
          errResult("INVALID_URL", "URL must start with http:// or https://", "Example: siteforge extract https://example.com"),
          null,
          2,
        ),
      );
      process.exitCode = 1;
      return;
    }

    console.error(`Extracting ${url} …`);
    const result = await extractPage({
      url,
      outDir: String(args.out),
      waitMs: Number(args.wait) || 0,
      lazyScroll: !args["no-scroll"],
      screenshots: !args["no-screenshots"],
      captureStyles: !args["no-styles"],
    });
    console.log(JSON.stringify(result, null, 2));
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
  },
});

export async function runMain(): Promise<void> {
  await cittyRunMain(main);
}

export { main };
