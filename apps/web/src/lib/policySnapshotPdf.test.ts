import { describe, expect, it } from "vitest";
import {
  SNAPSHOT_DISCLAIMER,
  buildPolicySnapshotPdf,
  emptyFieldPlaceholder,
  isAttributeEmpty,
  policySnapshotFilename,
} from "./policySnapshotPdf";

const schema = {
  sections: [
    {
      id: "trip",
      title: "Trip details",
      fields: [
        {
          key: "regions",
          label: "Regions",
          type: "multiselect" as const,
          required: true,
          options: ["UAE", "GCC"],
        },
        {
          key: "maxTripDays",
          label: "Max trip days",
          type: "number" as const,
          required: true,
          min: 1,
          max: 365,
        },
        {
          key: "medicalCover",
          label: "Medical cover amount",
          type: "number" as const,
          required: true,
          min: 0,
        },
        {
          key: "notes",
          label: "Notes",
          type: "text" as const,
        },
        {
          key: "photo",
          label: "Destination photo",
          type: "image" as const,
        },
      ],
    },
  ],
};

describe("policy snapshot PDF", () => {
  it("lays out a schedule with summary, values, and blanks", () => {
    const pdf = new TextDecoder().decode(
      buildPolicySnapshotPdf({
        tenantName: "Atom Coverholder",
        policy: {
          name: "UAE Weekend Cover",
          status: "DRAFT",
          schemaVersion: 1,
          createdAt: "2026-08-14T10:00:00.000Z",
          updatedAt: "2026-08-14T11:00:00.000Z",
          type: { name: "Travel", schemaVersion: 1 },
        },
        schema,
        attributes: {
          regions: ["UAE"],
          medicalCover: 50000,
          notes: "Cover excludes winter sports.\nClaims in 48 hours.",
          photo: "https://images.example.com/dubai.jpg",
        },
        exportedAt: new Date("2026-08-14T12:00:00.000Z"),
        exportedBy: "maya.hassan@atomcover.com",
      }),
    );

    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("Policy working copy");
    expect(pdf).toContain(SNAPSHOT_DISCLAIMER);
    expect(pdf).toContain("UAE Weekend Cover");
    expect(pdf).toContain("Summary");
    expect(pdf).toContain("Product");
    expect(pdf).toContain("Travel");
    expect(pdf).toContain("Trip details");
    expect(pdf).toContain("Regions");
    expect(pdf).toContain("UAE");
    expect(pdf).toContain("50,000");
    expect(pdf).toContain("14 Aug 2026, 12:00 UTC");
    expect(pdf).toContain(emptyFieldPlaceholder(true));
    expect(pdf).toContain("Page 1 of 1");
    expect(pdf).toContain("Notes");
    expect(pdf).toContain("Cover excludes winter sports.");
    expect(pdf).toContain("Claims in 48 hours.");
    expect(pdf).toContain("Image on file");
    expect(pdf).not.toContain("https://images.example.com/dubai.jpg");
    expect(pdf).not.toContain("data:image");
    expect(pdf).not.toContain("undefined");
  });

  it("names the file as product, policy, status, and date", () => {
    expect(
      policySnapshotFilename({
        name: "UAE Weekend Cover",
        product: "Travel",
        status: "ACTIVE",
        exportedAt: new Date("2026-08-14T12:00:00.000Z"),
      }),
    ).toBe("Travel - UAE Weekend Cover - ACTIVE - 2026-08-14.pdf");
  });

  it("treats empty arrays and blank strings as empty", () => {
    expect(isAttributeEmpty([])).toBe(true);
    expect(isAttributeEmpty("  ")).toBe(true);
    expect(isAttributeEmpty(["UAE"])).toBe(false);
  });
});
