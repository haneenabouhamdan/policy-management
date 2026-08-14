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
});
