import { describe, expect, it } from "vitest";
import { constraintHint } from "../components/schema/SchemaReadView";

describe("constraintHint", () => {
  it("joins required, min/max, and allowed values", () => {
    expect(
      constraintHint({
        key: "maxAge",
        label: "Maximum age",
        type: "number",
        required: true,
        min: 1,
        max: 99,
      }),
    ).toBe("Required · Min 1 · max 99");

    expect(
      constraintHint({
        key: "regions",
        label: "Regions",
        type: "multiselect",
        required: true,
        options: ["UAE", "GCC"],
      }),
    ).toBe("Required · Allowed: UAE, GCC");
  });
});
