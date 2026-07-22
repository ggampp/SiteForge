#!/usr/bin/env node
/**
 * SiteForge MCP server — extract, sections, assets, query, T2 fidelity tools.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  extractPage,
  listSourceIds,
  runDoctor,
  isHttpUrl,
  toErrorShape,
  chunkSource,
  getSectionsList,
  getSectionDetail,
  discoverSourceAssets,
  downloadSourceAssets,
  querySource,
  getPageMetadata,
  loadRawHtml,
  rebuildSource,
  visualDiff,
  captureTheme,
  captureInteraction,
  exportDesignTokens,
  extractPagePhased,
  getExtractionStatus,
  writeSpecStub,
  screenshotPage,
} from "@siteforge/core";

const server = new Server(
  {
    name: "siteforge",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

function textResult(data: unknown, isError = false) {
  return {
    isError,
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "doctor",
      description: "Check SiteForge environment (Node, Playwright Chromium)",
      inputSchema: { type: "object", properties: {} },
    },
    {
      name: "extract_page",
      description:
        "Extract a public http(s) page into the local .siteforge source store",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string" },
          outDir: { type: "string", default: ".siteforge" },
          waitMs: { type: "number", default: 2000 },
          timeoutMs: { type: "number", default: 60000 },
          saveRawHtml: { type: "boolean", default: true },
          lazyScroll: { type: "boolean", default: true },
          screenshots: { type: "boolean", default: true },
          allowLocalhost: { type: "boolean", default: true },
          ssrfGuard: { type: "boolean", default: true },
        },
        required: ["url"],
      },
    },
    {
      name: "extract_page_phased",
      description:
        "Start extract asynchronously; returns jobId for get_extraction_status",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string" },
          outDir: { type: "string", default: ".siteforge" },
          waitMs: { type: "number", default: 2000 },
          timeoutMs: { type: "number", default: 60000 },
        },
        required: ["url"],
      },
    },
    {
      name: "get_extraction_status",
      description: "Poll phased extraction job status",
      inputSchema: {
        type: "object",
        properties: {
          jobId: { type: "string" },
          outDir: { type: "string", default: ".siteforge" },
        },
        required: ["jobId"],
      },
    },
    {
      name: "list_sources",
      description: "List source ids under outDir",
      inputSchema: {
        type: "object",
        properties: { outDir: { type: "string", default: ".siteforge" } },
      },
    },
    {
      name: "get_page_metadata",
      description: "Metadata + stats for a source",
      inputSchema: {
        type: "object",
        properties: {
          sourceId: { type: "string" },
          outDir: { type: "string", default: ".siteforge" },
        },
        required: ["sourceId"],
      },
    },
    {
      name: "list_sections",
      description:
        "List sections for a source (runs three-principles chunk if needed)",
      inputSchema: {
        type: "object",
        properties: {
          sourceId: { type: "string" },
          outDir: { type: "string", default: ".siteforge" },
        },
        required: ["sourceId"],
      },
    },
    {
      name: "get_section",
      description: "Full section payload (root subtree, text, images)",
      inputSchema: {
        type: "object",
        properties: {
          sourceId: { type: "string" },
          sectionId: { type: "string" },
          outDir: { type: "string", default: ".siteforge" },
        },
        required: ["sourceId", "sectionId"],
      },
    },
    {
      name: "query_source",
      description: "Query extraction JSON via dotted path (e.g. metadata.title)",
      inputSchema: {
        type: "object",
        properties: {
          sourceId: { type: "string" },
          path: { type: "string" },
          outDir: { type: "string", default: ".siteforge" },
        },
        required: ["sourceId", "path"],
      },
    },
    {
      name: "discover_assets",
      description: "List image/video/font asset URLs from a source tree",
      inputSchema: {
        type: "object",
        properties: {
          sourceId: { type: "string" },
          outDir: { type: "string", default: ".siteforge" },
        },
        required: ["sourceId"],
      },
    },
    {
      name: "download_assets",
      description:
        "Download assets for a source into targetDir (default source assets/)",
      inputSchema: {
        type: "object",
        properties: {
          sourceId: { type: "string" },
          outDir: { type: "string", default: ".siteforge" },
          targetDir: { type: "string" },
          assetUrls: { type: "array", items: { type: "string" } },
        },
        required: ["sourceId"],
      },
    },
    {
      name: "chunk_source",
      description: "Force re-chunk of a source into sections",
      inputSchema: {
        type: "object",
        properties: {
          sourceId: { type: "string" },
          outDir: { type: "string", default: ".siteforge" },
          maxTokens: { type: "number", default: 10000 },
        },
        required: ["sourceId"],
      },
    },
    {
      name: "rebuild_source",
      description: "Rebuild source to static HTML folder (raw.html + assets)",
      inputSchema: {
        type: "object",
        properties: {
          sourceId: { type: "string" },
          targetDir: { type: "string" },
          siteSlug: { type: "string" },
          outDir: { type: "string", default: ".siteforge" },
          preferRawHtml: { type: "boolean", default: true },
        },
        required: ["sourceId", "targetDir", "siteSlug"],
      },
    },
    {
      name: "visual_diff",
      description: "Pixelmatch two PNG screenshots; optional diff.png outDir",
      inputSchema: {
        type: "object",
        properties: {
          a: { type: "string" },
          b: { type: "string" },
          outDir: { type: "string" },
          threshold: { type: "number" },
        },
        required: ["a", "b"],
      },
    },
    {
      name: "screenshot_page",
      description: "Capture viewport/full-page PNG for a url or sourceId",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string" },
          sourceId: { type: "string" },
          outDir: { type: "string", default: ".siteforge" },
          fullPage: { type: "boolean", default: true },
          waitMs: { type: "number" },
        },
      },
    },
    {
      name: "capture_theme",
      description: "Capture light/dark theme snapshots + CSS variables",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string" },
          outDir: { type: "string", default: ".siteforge" },
          sourceId: { type: "string" },
          waitMs: { type: "number" },
        },
        required: ["url"],
      },
    },
    {
      name: "capture_interaction",
      description: "Style diff before/after hover|focus|active on a selector",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string" },
          selector: { type: "string" },
          kind: { type: "string", enum: ["hover", "focus", "active"] },
          outDir: { type: "string", default: ".siteforge" },
          sourceId: { type: "string" },
          waitMs: { type: "number" },
        },
        required: ["url", "selector", "kind"],
      },
    },
    {
      name: "export_design_tokens",
      description: "Export colors/fonts from extraction to JSON + CSS snippet",
      inputSchema: {
        type: "object",
        properties: {
          sourceId: { type: "string" },
          outDir: { type: "string", default: ".siteforge" },
          targetDir: { type: "string" },
        },
        required: ["sourceId"],
      },
    },
    {
      name: "write_spec_stub",
      description: "Write markdown section spec stub from section JSON",
      inputSchema: {
        type: "object",
        properties: {
          sourceId: { type: "string" },
          sectionId: { type: "string" },
          outDir: { type: "string", default: ".siteforge" },
          targetPath: { type: "string" },
          componentName: { type: "string" },
        },
        required: ["sourceId", "sectionId"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = (request.params.arguments ?? {}) as Record<string, unknown>;
  const outDir = String(args.outDir ?? ".siteforge");

  try {
    if (name === "doctor") {
      return textResult(await runDoctor("0.1.0"));
    }

    if (name === "extract_page") {
      const url = String(args.url ?? "");
      if (!isHttpUrl(url)) {
        return textResult(
          {
            ok: false,
            code: "INVALID_URL",
            message: "url must be http(s)",
            hint: "Example: https://example.com",
          },
          true,
        );
      }
      const result = await extractPage({
        url,
        outDir,
        waitMs: typeof args.waitMs === "number" ? args.waitMs : 2000,
        timeoutMs: typeof args.timeoutMs === "number" ? args.timeoutMs : 60_000,
        saveRawHtml: args.saveRawHtml !== false,
        lazyScroll: args.lazyScroll !== false,
        screenshots: args.screenshots !== false,
        allowLocalhost: args.allowLocalhost !== false,
        ssrfGuard: args.ssrfGuard !== false,
      });
      return textResult(result);
    }

    if (name === "extract_page_phased") {
      const url = String(args.url ?? "");
      if (!isHttpUrl(url)) {
        return textResult(
          { ok: false, code: "INVALID_URL", message: "url must be http(s)" },
          true,
        );
      }
      return textResult(
        await extractPagePhased({
          url,
          outDir,
          waitMs: typeof args.waitMs === "number" ? args.waitMs : 2000,
          timeoutMs:
            typeof args.timeoutMs === "number" ? args.timeoutMs : 60_000,
        }),
      );
    }

    if (name === "get_extraction_status") {
      return textResult(
        await getExtractionStatus(outDir, String(args.jobId ?? "")),
      );
    }

    if (name === "list_sources") {
      const sources = await listSourceIds(outDir);
      return textResult({ ok: true, sources });
    }

    if (name === "get_page_metadata") {
      const sourceId = String(args.sourceId ?? "");
      const meta = await getPageMetadata(outDir, sourceId);
      const rawHtml = await loadRawHtml(outDir, sourceId);
      return textResult({
        ...meta,
        hasRawHtml: rawHtml !== null,
      });
    }

    if (name === "list_sections") {
      const list = await getSectionsList(outDir, String(args.sourceId ?? ""));
      return textResult({ ok: true, ...list });
    }

    if (name === "get_section") {
      const section = await getSectionDetail(
        outDir,
        String(args.sourceId ?? ""),
        String(args.sectionId ?? ""),
      );
      const estimated = JSON.stringify(section).length;
      if (estimated > 80_000) {
        return textResult({
          ok: true,
          truncated: true,
          sectionId: section.sectionId,
          selector: section.selector,
          rect: section.rect,
          estimatedTokens: section.estimatedTokens,
          textSummary: section.textSummary,
          images: section.images,
          path: section.path,
          hint: "Full section JSON is on disk at path; root omitted due to size",
        });
      }
      return textResult({ ok: true, section });
    }

    if (name === "query_source") {
      const q = await querySource(
        outDir,
        String(args.sourceId ?? ""),
        String(args.path ?? ""),
      );
      return textResult({ ok: true, ...q });
    }

    if (name === "discover_assets") {
      return textResult(
        await discoverSourceAssets(outDir, String(args.sourceId ?? "")),
      );
    }

    if (name === "download_assets") {
      const assetUrls = Array.isArray(args.assetUrls)
        ? (args.assetUrls as string[])
        : undefined;
      const result = await downloadSourceAssets(
        outDir,
        String(args.sourceId ?? ""),
        {
          targetDir: args.targetDir ? String(args.targetDir) : undefined,
          assetUrls,
        },
      );
      return textResult({
        ok: true,
        downloaded: result.downloaded,
        failed: result.failed,
        manifestPath: result.manifestPath,
      });
    }

    if (name === "chunk_source") {
      const result = await chunkSource(outDir, String(args.sourceId ?? ""), {
        maxTokens:
          typeof args.maxTokens === "number" ? args.maxTokens : 10_000,
      });
      return textResult({
        ok: true,
        pageHeight: result.pageHeight,
        validation: result.validation,
        indexPath: result.indexPath,
        sections: result.summaries,
      });
    }

    if (name === "rebuild_source") {
      const result = await rebuildSource({
        outDir,
        sourceId: String(args.sourceId ?? ""),
        targetDir: String(args.targetDir ?? ""),
        siteSlug: String(args.siteSlug ?? "rebuild"),
        preferRawHtml: args.preferRawHtml !== false,
      });
      return textResult(result);
    }

    if (name === "visual_diff") {
      const result = await visualDiff({
        a: String(args.a ?? ""),
        b: String(args.b ?? ""),
        outDir: args.outDir ? String(args.outDir) : undefined,
        threshold:
          typeof args.threshold === "number" ? args.threshold : undefined,
      });
      return textResult(result);
    }

    if (name === "screenshot_page") {
      return textResult(
        await screenshotPage({
          url: args.url ? String(args.url) : undefined,
          sourceId: args.sourceId ? String(args.sourceId) : undefined,
          outDir,
          fullPage: args.fullPage !== false,
          waitMs: typeof args.waitMs === "number" ? args.waitMs : undefined,
        }),
      );
    }

    if (name === "capture_theme") {
      return textResult(
        await captureTheme({
          url: String(args.url ?? ""),
          outDir,
          sourceId: args.sourceId ? String(args.sourceId) : undefined,
          waitMs: typeof args.waitMs === "number" ? args.waitMs : undefined,
        }),
      );
    }

    if (name === "capture_interaction") {
      const kind = String(args.kind ?? "hover") as "hover" | "focus" | "active";
      return textResult(
        await captureInteraction({
          url: String(args.url ?? ""),
          selector: String(args.selector ?? ""),
          kind,
          outDir,
          sourceId: args.sourceId ? String(args.sourceId) : undefined,
          waitMs: typeof args.waitMs === "number" ? args.waitMs : undefined,
        }),
      );
    }

    if (name === "export_design_tokens") {
      return textResult(
        await exportDesignTokens(
          outDir,
          String(args.sourceId ?? ""),
          args.targetDir ? String(args.targetDir) : undefined,
        ),
      );
    }

    if (name === "write_spec_stub") {
      return textResult(
        await writeSpecStub({
          outDir,
          sourceId: String(args.sourceId ?? ""),
          sectionId: String(args.sectionId ?? ""),
          targetPath: args.targetPath ? String(args.targetPath) : undefined,
          componentName: args.componentName
            ? String(args.componentName)
            : undefined,
        }),
      );
    }

    return textResult(
      {
        ok: false,
        code: "UNKNOWN_TOOL",
        message: `Unknown tool: ${name}`,
      },
      true,
    );
  } catch (err) {
    return textResult(toErrorShape(err), true);
  }
});

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
