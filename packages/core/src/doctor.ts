import { checkPlaywrightChromium } from "./browser.js";

export interface DoctorCheck {
  name: string;
  ok: boolean;
  message: string;
}

export interface DoctorReport {
  ok: boolean;
  checks: DoctorCheck[];
  versions: {
    node: string;
    platform: string;
    siteforge: string;
  };
}

export async function runDoctor(
  packageVersion = "0.1.0",
): Promise<DoctorReport> {
  const checks: DoctorCheck[] = [];

  checks.push({
    name: "node",
    ok: true,
    message: `Node ${process.version}`,
  });

  const major = Number(process.versions.node.split(".")[0]);
  if (major < 20) {
    checks[0] = {
      name: "node",
      ok: false,
      message: `Node ${process.version} — require >= 20`,
    };
  }

  const chromium = await checkPlaywrightChromium();
  checks.push({
    name: "playwright-chromium",
    ok: chromium.ok,
    message: chromium.message,
  });

  checks.push({
    name: "cwd",
    ok: true,
    message: process.cwd(),
  });

  return {
    ok: checks.every((c) => c.ok),
    checks,
    versions: {
      node: process.version,
      platform: `${process.platform} ${process.arch}`,
      siteforge: packageVersion,
    },
  };
}
