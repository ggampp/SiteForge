#!/usr/bin/env node
/**
 * Verify MCP server lists expected tools using the official SDK client.
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(
  path.resolve(__dirname, "../packages/mcp/package.json"),
);
const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require(
  "@modelcontextprotocol/sdk/client/stdio.js",
);
const serverPath = path.resolve(__dirname, "../packages/mcp/dist/server.js");

const REQUIRED = [
  "doctor",
  "extract_page",
  "list_sections",
  "get_section",
  "visual_diff",
  "capture_theme",
  "capture_interaction",
  "export_design_tokens",
  "extract_page_phased",
  "get_extraction_status",
  "write_spec_stub",
  "screenshot_page",
];

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [serverPath],
});

const client = new Client({ name: "siteforge-verify", version: "0.1.0" });

try {
  await client.connect(transport);
  const listed = await client.listTools();
  const tools = listed.tools.map((t) => t.name);
  const missing = REQUIRED.filter((t) => !tools.includes(t));
  const result = {
    ok: missing.length === 0 && tools.length >= REQUIRED.length,
    toolCount: tools.length,
    tools,
    missing,
  };
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 1;
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await client.close().catch(() => undefined);
}
