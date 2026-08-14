import { describe, expect, it } from "vitest";
import { clampPage } from "./clampPage";

describe("clampPage", () => {
  it("stays within the available pages", () => {
    expect(clampPage(4, 2)).toBe(2);
    expect(clampPage(0, 5)).toBe(1);
    expect(clampPage(3, 0)).toBe(1);
    expect(clampPage(2, 8)).toBe(2);
  });
});
