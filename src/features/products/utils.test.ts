import { describe, expect, it, vi } from "vitest";

import { excludeCurrentProductId } from "@/features/products/utils";

describe("excludeCurrentProductId", () => {
  it("skips the neq filter when there is no current product id", () => {
    const query = {
      neq: vi.fn(),
    };

    const result = excludeCurrentProductId(query, "");

    expect(query.neq).not.toHaveBeenCalled();
    expect(result).toBe(query);
  });

  it("applies the neq filter when editing an existing product", () => {
    const nextQuery = { key: "next" };
    const query = {
      neq: vi.fn().mockReturnValue(nextQuery),
    };

    const result = excludeCurrentProductId(query, " product-uuid ");

    expect(query.neq).toHaveBeenCalledWith("id", "product-uuid");
    expect(result).toBe(nextQuery);
  });
});
