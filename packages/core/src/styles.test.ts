import { describe, expect, it } from "vitest";
import {
  COMPUTED_STYLE_PROPS,
  COMPUTED_STYLE_PROP_COUNT,
} from "./styles.js";

describe("COMPUTED_STYLE_PROPS", () => {
  it("includes at least 30 properties", () => {
    expect(COMPUTED_STYLE_PROP_COUNT).toBeGreaterThanOrEqual(30);
    expect(COMPUTED_STYLE_PROPS.length).toBe(COMPUTED_STYLE_PROP_COUNT);
  });

  it("has unique names", () => {
    expect(new Set(COMPUTED_STYLE_PROPS).size).toBe(
      COMPUTED_STYLE_PROPS.length,
    );
  });

  it("covers key layout and typography props", () => {
    for (const key of [
      "display",
      "flexDirection",
      "fontSize",
      "backgroundColor",
      "color",
      "paddingTop",
    ]) {
      expect(COMPUTED_STYLE_PROPS).toContain(key);
    }
  });
});
