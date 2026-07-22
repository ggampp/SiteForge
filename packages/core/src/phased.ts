import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { extractPage, type ExtractOptions, type ExtractSummary } from "./extract.js";
import { SiteForgeException } from "./errors.js";

export type ExtractionJobStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed";

export interface ExtractionJob {
  jobId: string;
  status: ExtractionJobStatus;
  createdAt: string;
  updatedAt: string;
  url: string;
  outDir: string;
  result?: ExtractSummary;
  error?: { code: string; message: string; hint?: string };
}

const jobs = new Map<string, ExtractionJob>();

function jobsDir(outDir: string): string {
  return path.join(outDir, "jobs");
}

function createJobId(): string {
  return `job_${Date.now().toString(36)}_${randomBytes(3).toString("hex")}`;
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function persistJob(job: ExtractionJob): Promise<void> {
  const dir = jobsDir(job.outDir);
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, `${job.jobId}.json`),
    JSON.stringify(job, null, 2),
    "utf8",
  );
}

async function loadJobFromDisk(
  outDir: string,
  jobId: string,
): Promise<ExtractionJob | null> {
  const p = path.join(jobsDir(outDir), `${jobId}.json`);
  if (!(await exists(p))) return null;
  return JSON.parse(await readFile(p, "utf8")) as ExtractionJob;
}

/**
 * Start extract asynchronously; returns jobId immediately.
 */
export async function extractPagePhased(
  options: ExtractOptions & { url: string },
): Promise<{
  ok: true;
  jobId: string;
  status: ExtractionJobStatus;
  statusPath: string;
}> {
  const outDir = options.outDir ?? ".siteforge";
  const jobId = createJobId();
  const now = new Date().toISOString();
  const job: ExtractionJob = {
    jobId,
    status: "queued",
    createdAt: now,
    updatedAt: now,
    url: options.url,
    outDir,
  };
  jobs.set(jobId, job);
  await persistJob(job);

  void (async () => {
    job.status = "running";
    job.updatedAt = new Date().toISOString();
    await persistJob(job);
    try {
      const result = await extractPage(options);
      job.status = "completed";
      job.result = result;
      job.updatedAt = new Date().toISOString();
      await persistJob(job);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: string }).code)
          : "EXTRACT_FAILED";
      const hint =
        err && typeof err === "object" && "hint" in err
          ? String((err as { hint?: string }).hint ?? "")
          : undefined;
      job.status = "failed";
      job.error = { code, message, hint: hint || undefined };
      job.updatedAt = new Date().toISOString();
      await persistJob(job);
    }
  })();

  return {
    ok: true,
    jobId,
    status: job.status,
    statusPath: path.join(jobsDir(outDir), `${jobId}.json`),
  };
}

/**
 * Poll phased extraction job status.
 */
export async function getExtractionStatus(
  outDir: string,
  jobId: string,
): Promise<ExtractionJob> {
  const mem = jobs.get(jobId);
  if (mem) return mem;
  const disk = await loadJobFromDisk(outDir, jobId);
  if (!disk) {
    throw new SiteForgeException(
      "SOURCE_NOT_FOUND",
      `Extraction job not found: ${jobId}`,
      "Call extract_page_phased first",
    );
  }
  return disk;
}
