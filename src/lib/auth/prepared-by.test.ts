import { describe, expect, it } from "vitest";

import { buildPreparedByProfile } from "@/lib/auth/prepared-by";

describe("buildPreparedByProfile", () => {
  it("uses the customer-facing document title when one is set", () => {
    expect(
      buildPreparedByProfile({
        displayName: "Nia Grace Ariete",
        email: "nia@example.com",
        role: "admin",
        documentTitle: "Shop Manager",
      }),
    ).toEqual({
      name: "Nia Grace Ariete",
      title: "Shop Manager",
    });
  });

  it("falls back to the formatted internal role when no document title is set", () => {
    expect(
      buildPreparedByProfile({
        displayName: "Henrick Say",
        email: "henrick@sayautocare.com",
        role: "owner",
        documentTitle: "   ",
      }),
    ).toEqual({
      name: "Henrick Say",
      title: "Owner",
    });
  });

  it("falls back to the authenticated email when the staff display name is blank", () => {
    expect(
      buildPreparedByProfile({
        displayName: "   ",
        email: "owner@sayautocare.com",
        role: "owner",
        documentTitle: null,
      }),
    ).toEqual({
      name: "owner@sayautocare.com",
      title: "Owner",
    });
  });
});
