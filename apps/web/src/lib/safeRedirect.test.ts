import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safeRedirect";

describe("safeRedirectPath", () => {
  it("keeps in-app paths", () => {
    expect(safeRedirectPath("/policies/abc")).toBe("/policies/abc");
  });

  it("rejects protocol-relative and absolute URLs", () => {
    expect(safeRedirectPath("//evil.example")).toBe("/policies");
    expect(safeRedirectPath("https://evil.example")).toBe("/policies");
    expect(safeRedirectPath("/\\evil.example")).toBe("/policies");
  });

  it("falls back for missing values", () => {
    expect(safeRedirectPath(undefined)).toBe("/policies");
    expect(safeRedirectPath("policies")).toBe("/policies");
  });
});
