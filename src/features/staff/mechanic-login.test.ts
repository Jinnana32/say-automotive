import { describe, expect, it } from "vitest";

import {
  buildMechanicLoginEmailCandidates,
  buildMechanicTemporaryPassword,
  pickAvailableMechanicLoginEmail,
  slugifyStaffLoginName,
} from "@/features/staff/mechanic-login";

describe("slugifyStaffLoginName", () => {
  it("normalizes names for login slugs", () => {
    expect(slugifyStaffLoginName("De la Cruz")).toBe("delacruz");
    expect(slugifyStaffLoginName("O'Brien")).toBe("obrien");
  });
});

describe("buildMechanicLoginEmailCandidates", () => {
  it("prefers last name only before first.last duplicates", () => {
    expect(buildMechanicLoginEmailCandidates("Juan", "Delacruz")).toEqual([
      "delacruz@sayautocare.com",
      "juan.delacruz@sayautocare.com",
      "juan.delacruz2@sayautocare.com",
      "juan.delacruz3@sayautocare.com",
      "juan.delacruz4@sayautocare.com",
      "juan.delacruz5@sayautocare.com",
      "juan.delacruz6@sayautocare.com",
      "juan.delacruz7@sayautocare.com",
      "juan.delacruz8@sayautocare.com",
      "juan.delacruz9@sayautocare.com",
      "juan.delacruz10@sayautocare.com",
    ]);
  });
});

describe("buildMechanicTemporaryPassword", () => {
  it("uses last name and current year", () => {
    expect(buildMechanicTemporaryPassword("Delacruz", 2026)).toBe("delacruz@2026");
  });
});

describe("pickAvailableMechanicLoginEmail", () => {
  it("returns the first unused candidate", () => {
    expect(
      pickAvailableMechanicLoginEmail("Juan", "Delacruz", new Set(["delacruz@sayautocare.com"])),
    ).toBe("juan.delacruz@sayautocare.com");
  });

  it("returns null when all candidates are taken", () => {
    const taken = new Set(buildMechanicLoginEmailCandidates("Juan", "Delacruz"));

    expect(pickAvailableMechanicLoginEmail("Juan", "Delacruz", taken)).toBeNull();
  });
});
