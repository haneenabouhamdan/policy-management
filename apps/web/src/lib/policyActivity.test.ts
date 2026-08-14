import { describe, expect, it } from "vitest";
import type { PolicyEvent, PolicyTypeSchema } from "../types/api";
import { activityChanges, activityTitle } from "./policyActivity";

const schema: PolicyTypeSchema = {
  sections: [
    {
      id: "trip",
      title: "Trip",
      fields: [
        {
          key: "medicalCover",
          label: "Medical cover amount",
          type: "number",
        },
        {
          key: "regions",
          label: "Regions",
          type: "multiselect",
        },
        {
          key: "destinationPhoto",
          label: "Destination / itinerary photo",
          type: "image",
        },
        {
          key: "scheduleWording",
          label: "Schedule of cover",
          type: "text",
        },
      ],
    },
  ],
};

function event(partial: Partial<PolicyEvent> & Pick<PolicyEvent, "type">): PolicyEvent {
  return {
    id: "evt-1",
    policyId: "policy-1",
    actorEmail: "maya.hassan@atomcover.com",
    createdAt: "2026-08-14T12:00:00.000Z",
    payload: {},
    ...partial,
  };
}

describe("policy activity", () => {
  it("lists renamed and changed fields on update", () => {
    const changes = activityChanges(
      event({
        type: "UPDATED",
        payload: {
          from: {
            name: "UAE Weekend Cover",
            schemaVersion: 1,
            attributes: {
              medicalCover: 50000,
              regions: ["UAE"],
              destinationPhoto: "",
            },
          },
          to: {
            name: "UAE Long Weekend Cover",
            schemaVersion: 2,
            attributes: {
              medicalCover: 75000,
              regions: ["UAE", "GCC"],
              destinationPhoto: "https://images.example.com/dubai.jpg",
              scheduleWording: "Emergency medical expenses while travelling in the UAE.",
            },
          },
        },
      }),
      schema,
    );

    expect(activityTitle(event({ type: "UPDATED" }))).toBe("Updated");
    expect(changes).toEqual([
      {
        label: "Name",
        from: "UAE Weekend Cover",
        to: "UAE Long Weekend Cover",
      },
      { label: "Schema version", from: "1", to: "2" },
      {
        label: "Medical cover amount",
        from: "50,000",
        to: "75,000",
      },
      { label: "Regions", from: "UAE", to: "UAE, GCC" },
      {
        label: "Destination / itinerary photo",
        from: "—",
        to: "Image on file",
      },
      {
        label: "Schedule of cover",
        from: "—",
        to: "Emergency medical expenses while travelling in the UAE.",
      },
    ]);
  });

  it("does not list unchanged attributes", () => {
    expect(
      activityChanges(
        event({
          type: "UPDATED",
          payload: {
            from: {
              name: "Same",
              schemaVersion: 1,
              attributes: { medicalCover: 50000 },
            },
            to: {
              name: "Same",
              schemaVersion: 1,
              attributes: { medicalCover: 50000 },
            },
          },
        }),
        schema,
      ),
    ).toEqual([]);
  });

  it("summarizes created and status events", () => {
    expect(
      activityTitle(
        event({ type: "CREATED", payload: { duplicatedFrom: "p1" } }),
      ),
    ).toBe("Created as a copy");
    expect(
      activityChanges(
        event({
          type: "CREATED",
          payload: { name: "UAE Weekend Cover", schemaVersion: 1 },
        }),
      ),
    ).toEqual([
      { label: "Name", from: "—", to: "UAE Weekend Cover" },
      { label: "Schema version", from: "—", to: "1" },
    ]);
    expect(
      activityTitle(
        event({
          type: "STATUS_CHANGED",
          payload: { from: "DRAFT", to: "ACTIVE" },
        }),
      ),
    ).toBe("Status DRAFT → ACTIVE");
    expect(
      activityChanges(
        event({
          type: "STATUS_CHANGED",
          payload: { from: "DRAFT", to: "ACTIVE", reason: "Bound" },
        }),
      ),
    ).toEqual([]);
  });
});
