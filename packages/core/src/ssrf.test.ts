import { describe, expect, it } from "vitest";
import {
  assertSafeHttpUrl,
  isPrivateNetworkUrl,
} from "./ssrf.js";
import { SiteForgeException } from "./errors.js";

describe("SSRF guard", () => {
  it("allows public https", () => {
    expect(() => assertSafeHttpUrl("https://example.com")).not.toThrow();
  });

  it("allows localhost by default", () => {
    expect(() => assertSafeHttpUrl("http://localhost:3000")).not.toThrow();
    expect(() => assertSafeHttpUrl("http://127.0.0.1:8080")).not.toThrow();
  });

  it("blocks private IPs when localhost not allowed", () => {
    expect(() =>
      assertSafeHttpUrl("http://192.168.1.10/", { allowLocalhost: false }),
    ).toThrow(/PRIVATE_NETWORK_BLOCKED|Blocked private IP/);
    try {
      assertSafeHttpUrl("http://10.0.0.5/", { allowLocalhost: false });
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(SiteForgeException);
      expect((e as SiteForgeException).code).toBe("PRIVATE_NETWORK_BLOCKED");
    }
  });

  it("blocks metadata host", () => {
    expect(() =>
      assertSafeHttpUrl("http://metadata.google.internal/computeMetadata/v1"),
    ).toThrow(SiteForgeException);
  });

  it("blocks when allowLocalhost=false", () => {
    expect(() =>
      assertSafeHttpUrl("http://127.0.0.1/", { allowLocalhost: false }),
    ).toThrow(SiteForgeException);
  });

  it("isPrivateNetworkUrl helper", () => {
    expect(isPrivateNetworkUrl("http://10.0.0.5/")).toBe(true);
    expect(isPrivateNetworkUrl("https://example.com")).toBe(false);
  });
});
