import { describe, expect, it } from "vitest";
import {
  SiteForgeException,
  assertHttpUrl,
  isHttpUrl,
  toErrorShape,
} from "./errors.js";

describe("URL validation", () => {
  it("accepts http(s)", () => {
    expect(isHttpUrl("https://example.com")).toBe(true);
    expect(isHttpUrl("http://localhost:3000")).toBe(true);
    expect(isHttpUrl("ftp://x")).toBe(false);
    expect(isHttpUrl("not-a-url")).toBe(false);
  });

  it("assertHttpUrl throws INVALID_URL", () => {
    try {
      assertHttpUrl("javascript:alert(1)");
      expect.fail("should throw");
    } catch (e) {
      expect(e).toBeInstanceOf(SiteForgeException);
      expect((e as SiteForgeException).code).toBe("INVALID_URL");
    }
  });
});

describe("toErrorShape", () => {
  it("maps timeout messages", () => {
    const shape = toErrorShape(new Error("Navigation timeout of 30000 ms exceeded"));
    expect(shape.code).toBe("TIMEOUT");
    expect(shape.ok).toBe(false);
  });
});
