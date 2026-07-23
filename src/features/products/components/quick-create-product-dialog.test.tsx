import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QuickCreateProductDialog } from "@/features/products/components/quick-create-product-dialog";
import type { ProductFormOptionsData } from "@/features/products/types";

vi.mock("@/features/products/actions/product-actions", () => ({
  createInlineProductAction: vi.fn(async () => ({
    status: "idle",
  })),
}));

const productFormOptions: ProductFormOptionsData = {
  categories: [{ id: "cat-1", label: "Brakes" }],
  brands: [{ id: "brand-1", label: "Bosch" }],
  suppliers: [{ id: "supplier-1", label: "Main Supplier" }],
  units: [{ id: "unit-1", label: "Piece (pc)" }],
  branches: [{ id: "branch-1", label: "Main Branch" }],
  permissions: {
    canMarkGlobal: false,
    canSelectOwningBranch: false,
  },
  defaultBranchId: "branch-1",
};

describe("QuickCreateProductDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses preloaded form options without fetching again", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    render(
      <QuickCreateProductDialog
        initialOptions={productFormOptions}
        onCreated={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Add new product/i }));

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/Base unit/i)).not.toBeDisabled();
    expect(screen.getByRole("option", { name: "Piece (pc)" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/Brand/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/Supplier/i)).not.toBeDisabled();
  });

  it("shows a no-units fallback without blocking optional selects", () => {
    render(
      <QuickCreateProductDialog
        initialOptions={{
          ...productFormOptions,
          units: [],
          categories: [],
          brands: [],
          suppliers: [],
        }}
        onCreated={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Add new product/i }));

    expect(screen.getByLabelText(/Base unit/i)).toBeDisabled();
    expect(
      screen.getByRole("option", { name: "No units available" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Category/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/Brand/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/Supplier/i)).not.toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Create product" }),
    ).toBeDisabled();
  });

  it("prefills the product name when initialName is provided", () => {
    render(
      <QuickCreateProductDialog
        open
        showTrigger={false}
        initialName="Relay"
        initialOptions={productFormOptions}
        onCreated={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/Product name/i)).toHaveValue("Relay");
  });
});
