import { describe, expect, it } from "vitest";

import { buildPreparedByProfile } from "@/lib/auth/prepared-by";

describe("buildPreparedByProfile", () => {
  it("uses the current staff display name and title-cased role", () => {
    expect(
      buildPreparedByProfile({
        displayName: "Nia Grace Ariete",
        email: "nia@example.com",
        role: "admin",
      }),
    ).toEqual({
      name: "Nia Grace Ariete",
      title: "Admin",
    });
  });

  it("falls back to the authenticated email when the staff display name is blank", () => {
    expect(
      buildPreparedByProfile({
        displayName: "   ",
        email: "owner@sayautocare.com",
        role: "owner",
      }),
    ).toEqual({
      name: "owner@sayautocare.com",
      title: "Owner",
    });
  });
});
