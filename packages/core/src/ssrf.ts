import { SiteForgeException } from "./errors.js";

/**
 * Block private/link-local/metadata targets when SSRF guard is enabled.
 * Loopback is allowed only when allowLocalhost=true (default for local tools).
 */

const BLOCKED_HOSTNAMES = new Set([
  "metadata.google.internal",
  "metadata.google",
  "instance-data",
]);

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return null;
    const v = Number(p);
    if (v < 0 || v > 255) return null;
    n = (n << 8) + v;
  }
  return n >>> 0;
}

function isPrivateIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip);
  if (n === null) return false;
  // Use >>> 0 so comparisons stay in unsigned 32-bit space (JS bitwise is signed).
  const u = (mask: number) => (n & mask) >>> 0;
  // 10.0.0.0/8
  if (u(0xff000000) === 0x0a000000) return true;
  // 172.16.0.0/12
  if (u(0xfff00000) === 0xac100000) return true;
  // 192.168.0.0/16
  if (u(0xffff0000) === 0xc0a80000) return true;
  // 169.254.0.0/16 link-local
  if (u(0xffff0000) === 0xa9fe0000) return true;
  // 127.0.0.0/8 loopback
  if (u(0xff000000) === 0x7f000000) return true;
  // 0.0.0.0/8
  if (u(0xff000000) === 0x00000000) return true;
  // 100.64.0.0/10 CGNAT
  if (u(0xffc00000) === 0x64400000) return true;
  return false;
}

function isLoopbackHostname(host: string): boolean {
  const h = host.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]";
}

function isPrivateIpv6(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, "");
  if (h === "::1") return true;
  if (h.startsWith("fc") || h.startsWith("fd")) return true; // ULA
  if (h.startsWith("fe80:")) return true; // link-local
  return false;
}

export interface AssertPublicUrlOptions {
  /** Allow localhost / 127.0.0.1 (default true for CLI/local MCP) */
  allowLocalhost?: boolean;
  /** When false, skip SSRF checks entirely */
  enabled?: boolean;
}

/**
 * Validate URL is http(s) and not a private/metadata target when guard enabled.
 */
export function assertSafeHttpUrl(
  url: string,
  options: AssertPublicUrlOptions = {},
): void {
  const enabled = options.enabled ?? true;
  const allowLocalhost = options.allowLocalhost ?? true;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new SiteForgeException(
      "INVALID_URL",
      "Malformed URL",
      "Example: https://example.com",
    );
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SiteForgeException(
      "INVALID_URL",
      "URL must start with http:// or https://",
      "Example: https://example.com",
    );
  }

  if (!enabled) return;

  const host = parsed.hostname.toLowerCase();

  if (BLOCKED_HOSTNAMES.has(host)) {
    throw new SiteForgeException(
      "PRIVATE_NETWORK_BLOCKED",
      `Blocked metadata host: ${host}`,
      "SSRF guard refuses cloud metadata endpoints",
    );
  }

  if (isLoopbackHostname(host)) {
    if (!allowLocalhost) {
      throw new SiteForgeException(
        "PRIVATE_NETWORK_BLOCKED",
        `Blocked loopback host: ${host}`,
        "Pass allowLocalhost=true for local development",
      );
    }
    return;
  }

  // Literal IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    if (isPrivateIpv4(host)) {
      if (host.startsWith("127.") && allowLocalhost) return;
      throw new SiteForgeException(
        "PRIVATE_NETWORK_BLOCKED",
        `Blocked private IP: ${host}`,
        "SSRF guard blocks RFC1918 / link-local / CGNAT addresses",
      );
    }
    return;
  }

  if (host.includes(":")) {
    if (isPrivateIpv6(host)) {
      if ((host === "::1" || host === "[::1]") && allowLocalhost) return;
      throw new SiteForgeException(
        "PRIVATE_NETWORK_BLOCKED",
        `Blocked private IPv6: ${host}`,
        "SSRF guard blocks ULA / link-local IPv6",
      );
    }
  }
}

export function isPrivateNetworkUrl(
  url: string,
  options: AssertPublicUrlOptions = {},
): boolean {
  try {
    assertSafeHttpUrl(url, { ...options, allowLocalhost: false });
    return false;
  } catch (err) {
    if (
      err instanceof SiteForgeException &&
      err.code === "PRIVATE_NETWORK_BLOCKED"
    ) {
      return true;
    }
    return false;
  }
}
