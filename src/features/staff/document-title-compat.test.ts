import { describe, expect, it } from "vitest";

import { isMissingStaffDocumentTitleColumnError } from "@/features/staff/document-title-compat";

describe("isMissingStaffDocumentTitleColumnError", () => {
  it("matches the pre-migration database error", () => {
    expect(
      isMissingStaffDocumentTitleColumnError({
        message: "column staff.document_title does not exist",
      }),
    ).toBe(true);
  });

  it("ignores unrelated errors", () => {
    expect(
      isMissingStaffDocumentTitleColumnError({
        message: "permission denied for table staff",
      }),
    ).toBe(false);
    expect(isMissingStaffDocumentTitleColumnError(null)).toBe(false);
  });
});
