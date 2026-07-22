#!/usr/bin/env node
/**
 * E2E smoke: fixture extract → sections → tokens → spec → visual_diff.
 * No network required.
 */
import { mkdtemp, rm, access, copyFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  extractPage,
  chunkSource,
  exportDesignTokens,
  writeSpecStub,
  visualDiff,
  runDoctor,
  assertSafeHttpUrl,
  SiteForgeException,
} from "../packages/core/dist/index.js";

const html = `<!doctype html><html><head><title>Smoke</title>
<style>body{font-family:sans-serif;color:#111;background:#fff}h1{font-size:40px;color:#06c}</style>
</head><body><header id="hero"><h1>Smoke Hero</h1></header><main><p>Hello</p></main></body></html>`;

const dir = await mkdtemp(path.join(tmpdir(), "sf-e2e-"));
const failures = [];

function ok(name) {
  console.log(`[ok] ${name}`);
}
function fail(name, err) {
  failures.push(`${name}: ${err}`);
  console.error(`[fail] ${name}: ${err}`);
}

try {
  const doctor = await runDoctor("0.1.0");
  if (!doctor.ok) {
    fail("doctor", JSON.stringify(doctor.checks.filter((c) => !c.ok)));
  } else ok("doctor");

  try {
    assertSafeHttpUrl("http://192.168.0.1", { allowLocalhost: false });
    fail("ssrf", "should block private IP");
  } catch (e) {
    if (e instanceof SiteForgeException && e.code === "PRIVATE_NETWORK_BLOCKED") {
      ok("ssrf");
    } else fail("ssrf", String(e));
  }

  const summary = await extractPage({
    html,
    outDir: dir,
    screenshots: true,
    lazyScroll: false,
    captureCss: false,
    waitMs: 0,
  });
  ok(`extract ${summary.sourceId}`);

  const chunked = await chunkSource(dir, summary.sourceId);
  if (chunked.summaries.length < 1) fail("chunk", "no sections");
  else ok(`chunk sections=${chunked.summaries.length}`);

  await exportDesignTokens(dir, summary.sourceId);
  ok("tokens");

  const sectionId = chunked.summaries[0].sectionId;
  const stub = await writeSpecStub({
    outDir: dir,
    sourceId: summary.sourceId,
    sectionId,
    targetPath: path.join(dir, "spec.md"),
  });
  await access(stub.path);
  ok("spec");

  const viewport = summary.paths.viewportScreenshot;
  if (!viewport) {
    fail("visual_diff", "no viewport screenshot");
  } else {
    const copy = path.join(dir, "viewport-copy.png");
    await copyFile(viewport, copy);
    const same = await visualDiff({ a: viewport, b: copy, outDir: dir });
    if (same.score !== 1 || !same.diffPath) {
      fail("visual_diff identical", JSON.stringify(same));
    } else ok("visual_diff identical");
  }

  console.log(JSON.stringify({ ok: failures.length === 0, failures }, null, 2));
  process.exitCode = failures.length ? 0 : 0;
  process.exitCode = failures.length ? 1 : 0;
} catch (err) {
  console.error(err);
  process.exitCode = 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
