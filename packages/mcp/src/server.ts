#!/usr/bin/env node
/**
 * Minimal MCP server scaffold (Phase 0).
 * Full P0 tools wired in Phase 3 — doctor + extract_page stubs available now.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { extractPage, listSourceIds, runDoctor } from "@siteforge/core";

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

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "doctor",
      description: "Check SiteForge environment (Node, Playwright Chromium)",
      inputSchema: {
        type: "object",
        properties: {},
      },
    },
    {
      name: "extract_page",
      description:
        "Extract a public http(s) page into the local .siteforge source store",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "Page URL" },
          outDir: {
            type: "string",
            description: "Store root",
            default: ".siteforge",
          },
          waitMs: { type: "number", default: 2000 },
        },
        required: ["url"],
      },
    },
    {
      name: "list_sources",
      description: "List source ids under outDir",
      inputSchema: {
        type: "object",
        properties: {
          outDir: { type: "string", default: ".siteforge" },
        },
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = (request.params.arguments ?? {}) as Record<string, unknown>;

  try {
    if (name === "doctor") {
      const report = await runDoctor("0.1.0");
      return {
        content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
      };
    }

    if (name === "extract_page") {
      const url = String(args.url ?? "");
      if (!/^https?:\/\//i.test(url)) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify({
                ok: false,
                code: "INVALID_URL",
                message: "url must be http(s)",
              }),
            },
          ],
        };
      }
      const result = await extractPage({
        url,
        outDir: String(args.outDir ?? ".siteforge"),
        waitMs: typeof args.waitMs === "number" ? args.waitMs : 2000,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }

    if (name === "list_sources") {
      const sources = await listSourceIds(String(args.outDir ?? ".siteforge"));
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ok: true, sources }, null, 2),
          },
        ],
      };
    }

    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            ok: false,
            code: "UNKNOWN_TOOL",
            message: `Unknown tool: ${name}`,
          }),
        },
      ],
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: JSON.stringify({
            ok: false,
            code: "INTERNAL",
            message,
          }),
        },
      ],
    };
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
