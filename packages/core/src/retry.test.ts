import { describe, expect, it } from "vitest";
import { withRetry } from "./retry.js";

describe("withRetry", () => {
  it("returns on first success", async () => {
    const v = await withRetry(async () => 42, { attempts: 3 });
    expect(v).toBe(42);
  });

  it("retries then succeeds", async () => {
    let n = 0;
    const v = await withRetry(
      async () => {
        n++;
        if (n < 3) throw new Error("ETIMEDOUT");
        return "ok";
      },
      { attempts: 4, baseDelayMs: 1 },
    );
    expect(v).toBe("ok");
    expect(n).toBe(3);
  });

  it("does not retry non-matching errors", async () => {
    let n = 0;
    await expect(
      withRetry(
        async () => {
          n++;
          throw new Error("validation failed");
        },
        { attempts: 3, baseDelayMs: 1 },
      ),
    ).rejects.toThrow("validation failed");
    expect(n).toBe(1);
  });
});
