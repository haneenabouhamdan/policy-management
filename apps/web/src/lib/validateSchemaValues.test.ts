import { describe, expect, it } from "vitest";
import { validateSchemaValues } from "./validateSchemaValues";
import type { PolicyTypeSchema } from "../types/api";

const schema: PolicyTypeSchema = {
  sections: [
    {
      id: "trip",
      title: "Trip",
      fields: [
        {
          key: "regions",
          label: "Regions",
          type: "multiselect",
          required: true,
          options: ["UAE", "EU"],
        },
        {
          key: "days",
          label: "Days",
          type: "number",
          required: true,
          min: 1,
          max: 30,
        },
      ],
    },
  ],
};

describe("validateSchemaValues", () => {
  it("accepts a complete form", () => {
    expect(
      validateSchemaValues(schema, { regions: ["UAE"], days: 7 }),
    ).toEqual({});
  });

  it("flags required and out-of-range values", () => {
    expect(validateSchemaValues(schema, {})).toMatchObject({
      regions: "Required",
      days: "Required",
    });
    expect(validateSchemaValues(schema, { regions: ["UAE"], days: 99 })).toEqual(
      { days: "Must be at most 30" },
    );
  });

  it("rejects values outside the product options", () => {
    expect(
      validateSchemaValues(schema, { regions: ["Mars"], days: 3 }),
    ).toEqual({ regions: "Choose valid options" });
  });

  it("rejects a required image that is not a URL or upload", () => {
    const withImage: PolicyTypeSchema = {
      sections: [
        {
          id: "docs",
          title: "Documents",
          fields: [
            {
              key: "photo",
              label: "Photo",
              type: "image",
              required: true,
            },
          ],
        },
      ],
    };
    expect(validateSchemaValues(withImage, {})).toEqual({ photo: "Required" });
    expect(validateSchemaValues(withImage, { photo: "file.pdf" })).toEqual({
      photo: "Upload an image or paste a URL",
    });
    expect(
      validateSchemaValues(withImage, {
        photo: "https://images.example.com/risk.jpg",
      }),
    ).toEqual({});
    expect(
      validateSchemaValues(withImage, { photo: "data:text/plain;base64,aaa" }),
    ).toEqual({ photo: "Upload an image or paste a URL" });
  });

  it("rejects overlong strings, bad dates, and non-numbers", () => {
    const mixed: PolicyTypeSchema = {
      sections: [
        {
          id: "meta",
          title: "Meta",
          fields: [
            { key: "title", label: "Title", type: "string", required: true },
            { key: "notes", label: "Notes", type: "text" },
            { key: "start", label: "Start", type: "date", required: true },
            { key: "flag", label: "Flag", type: "boolean" },
          ],
        },
      ],
    };

    expect(
      validateSchemaValues(mixed, {
        title: "a".repeat(201),
        start: "01-02-2026",
        flag: "yes",
      }),
    ).toMatchObject({
      title: "Must be at most 200 characters",
      start: "Use YYYY-MM-DD",
      flag: "Must be yes or no",
    });
    expect(
      validateSchemaValues(schema, { regions: ["UAE"], days: "7" }),
    ).toEqual({ days: "Must be a number" });
    expect(
      validateSchemaValues(mixed, {
        title: "OK",
        start: "2026-08-19",
        flag: true,
      }),
    ).toEqual({});
  });
});
