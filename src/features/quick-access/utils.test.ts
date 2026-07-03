import { describe, expect, it } from "vitest";

import {
  extractPlateCandidatesFromTextBlocks,
  getQuickAccessPlateTokens,
  isPossiblePlateMatch,
  looksLikeQuickAccessPlateLookup,
  normalizeQuickAccessPlate,
  resolveQuickAccessQuery,
  buildQuickAccessNoMatchRedirectPath,
} from "@/features/quick-access/utils";

describe("quick access plate helpers", () => {
  it("normalizes plate input to uppercase alphanumeric text", () => {
    expect(normalizeQuickAccessPlate("abc-1234")).toBe("ABC1234");
  });

  it("extracts likely plate candidates from OCR text blocks", () => {
    expect(extractPlateCandidatesFromTextBlocks(["plate abc 1234", "gate 4"])).toContain("ABC1234");
  });

  it("builds lookup tokens from the normalized plate query", () => {
    expect(getQuickAccessPlateTokens("abc-1234")).toEqual(["ABC", "1234"]);
  });

  it("supports fuzzy fallback matching for formatted plate numbers", () => {
    expect(isPossiblePlateMatch("ABC 1234", "abc1234")).toBe(true);
    expect(isPossiblePlateMatch("XYZ 9876", "abc1234")).toBe(false);
  });

  it("detects whether a quick access query should be treated as a plate lookup", () => {
    expect(looksLikeQuickAccessPlateLookup("ABC-1234")).toBe(true);
    expect(looksLikeQuickAccessPlateLookup("Juan Dela Cruz")).toBe(false);
  });

  it("resolves a generic quick access query into plate or customer lookup input", () => {
    expect(resolveQuickAccessQuery("abc-1234")).toEqual({
      plateQuery: "ABC1234",
      customerLastNameQuery: "",
    });

    expect(resolveQuickAccessQuery("Dela Cruz")).toEqual({
      plateQuery: "",
      customerLastNameQuery: "Dela Cruz",
    });
  });

  it("builds redirect paths for unmatched quick access lookups", () => {
    expect(
      buildQuickAccessNoMatchRedirectPath({
        plateQuery: "ABC1234",
        customerLastNameQuery: "",
        canCreateVehicle: true,
        canCreateQuotation: true,
      }),
    ).toBe("/vehicles/new?plateNumber=ABC1234");

    expect(
      buildQuickAccessNoMatchRedirectPath({
        plateQuery: "",
        customerLastNameQuery: "Villanueva",
        canCreateVehicle: true,
        canCreateQuotation: true,
      }),
    ).toBe("/quotations/new?lastName=Villanueva");

    expect(
      buildQuickAccessNoMatchRedirectPath({
        plateQuery: "",
        customerLastNameQuery: "Villanueva",
        canCreateVehicle: true,
        canCreateQuotation: false,
      }),
    ).toBeNull();
  });
});
