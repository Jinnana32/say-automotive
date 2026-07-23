import { describe, expect, it } from "vitest";

import { buildQuotationSearchOrConditions } from "@/features/quotations/quotation-search";

describe("buildQuotationSearchOrConditions", () => {
  it("matches quotation snapshots and linked customer or vehicle ids", () => {
    const filter = buildQuotationSearchOrConditions({
      search: "coyoca",
      customerIds: ["11111111-1111-4111-8111-111111111111"],
      vehicleIds: ["22222222-2222-4222-8222-222222222222"],
    });

    expect(filter).toContain("quotation_number.ilike.%coyoca%");
    expect(filter).toContain("customer_name_snapshot.ilike.%coyoca%");
    expect(filter).toContain("vehicle_plate_number_snapshot.ilike.%coyoca%");
    expect(filter).toContain("vehicle_make_snapshot.ilike.%coyoca%");
    expect(filter).toContain("vehicle_model_snapshot.ilike.%coyoca%");
    expect(filter).toContain("customer_id.in.(11111111-1111-4111-8111-111111111111)");
    expect(filter).toContain("vehicle_id.in.(22222222-2222-4222-8222-222222222222)");
  });

  it("returns null for blank search input", () => {
    expect(buildQuotationSearchOrConditions({ search: "   " })).toBeNull();
  });

  it("escapes commas in search terms", () => {
    const filter = buildQuotationSearchOrConditions({
      search: "coyoca,main",
    });

    expect(filter).toContain("customer_name_snapshot.ilike.%coyoca\\,main%");
  });
});
