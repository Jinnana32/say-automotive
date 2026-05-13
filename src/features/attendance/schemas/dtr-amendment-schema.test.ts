import { describe, expect, it } from "vitest";

import {
  dtrAmendmentFormSchema,
  dtrAmendmentReviewSchema,
} from "@/features/attendance/schemas/dtr-amendment-schema";

describe("dtrAmendment schemas", () => {
  it("rejects mismatched missed time requests", () => {
    const result = dtrAmendmentFormSchema.safeParse({
      attendanceDate: "2026-05-13",
      targetLogType: "time_out",
      amendmentType: "missed_time_in",
      requestedTime: "08:00",
      reason: "Forgot to punch in",
    });

    expect(result.success).toBe(false);
  });

  it("requires a final time when approving", () => {
    const result = dtrAmendmentReviewSchema.safeParse({
      amendmentId: "7f835cb0-7154-4b71-b30b-f4eecb8f067f",
      decision: "approved",
      finalTime: "",
      adminNote: "",
    });

    expect(result.success).toBe(false);
  });
});
