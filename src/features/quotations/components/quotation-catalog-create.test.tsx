import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { CatalogCombobox } from "@/components/shared/catalog-combobox";
import { QuickCreateProductDialog } from "@/features/products/components/quick-create-product-dialog";
import { getQuotationLineCatalogDraftLabel } from "@/features/quotations/line-item-catalog";
import type { QuotationFormItem } from "@/features/quotations/types";
import { createQuotationItem } from "@/features/quotations/utils";
import type { ProductFormOptionsData } from "@/features/products/types";

vi.mock("@/features/products/actions/product-actions", () => ({
  createInlineProductAction: vi.fn(async () => ({
    status: "idle",
  })),
}));

const productFormOptions: ProductFormOptionsData = {
  categories: [{ id: "cat-1", label: "Electrical" }],
  brands: [{ id: "brand-1", label: "Generic" }],
  suppliers: [{ id: "supplier-1", label: "Main Supplier" }],
  units: [{ id: "unit-1", label: "Piece (pc)" }],
  branches: [{ id: "branch-1", label: "Main Branch" }],
  permissions: {
    canMarkGlobal: false,
    canSelectOwningBranch: false,
  },
  defaultBranchId: "branch-1",
};

function QuotationProductLineHarness({
  initialItem,
}: {
  initialItem: QuotationFormItem;
}) {
  const [item, setItem] = useState(initialItem);
  const [productOptions, setProductOptions] = useState<
    Array<{ id: string; label: string; sku: string | null; unitPrice: number }>
  >([]);

  return (
    <div>
      <CatalogCombobox
        id={`product-${item.key}`}
        value={item.productId}
        options={productOptions.map((product) => ({
          id: product.id,
          label: product.label,
          meta: product.sku ? `SKU ${product.sku}` : null,
          price: product.unitPrice,
          searchText: product.label,
        }))}
        placeholder="Search products"
        draftLabel={getQuotationLineCatalogDraftLabel(item)}
        invalid={!item.productId}
        onValueChange={(nextProductId) => {
          const selected = productOptions.find((product) => product.id === nextProductId);
          setItem((current) => ({
            ...current,
            productId: nextProductId,
            serviceId: "",
            description: selected?.label ?? current.description,
            unitPrice: selected ? String(selected.unitPrice) : current.unitPrice,
          }));
        }}
        createAction={{
          label: "Create New Product",
          renderDialog: ({ open, onOpenChange, suggestedName }) => (
            <QuickCreateProductDialog
              open={open}
              onOpenChange={onOpenChange}
              showTrigger={false}
              initialName={suggestedName}
              initialOptions={productFormOptions}
              onCreated={(product) => {
                setProductOptions((current) => [
                  ...current,
                  {
                    id: product.id,
                    label: product.label,
                    sku: product.sku,
                    unitPrice: product.unitPrice,
                  },
                ]);
                setItem((current) => ({
                  ...current,
                  itemType: "product",
                  productId: product.id,
                  serviceId: "",
                  description: product.label,
                  unitPrice: String(product.unitPrice),
                }));
              }}
            />
          ),
        }}
      />
      <p data-testid="linked-product-id">{item.productId || "unlinked"}</p>
      <p data-testid="line-description">{item.description}</p>
    </div>
  );
}

function QuotationProductLineLinkHarness() {
  const [item, setItem] = useState(
    createQuotationItem({
      key: "line-3",
      itemType: "product",
      description: "Relay",
      productId: "",
    }),
  );
  const [productOptions, setProductOptions] = useState<
    Array<{ id: string; label: string; sku: string | null; unitPrice: number }>
  >([]);

  return (
    <>
      <CatalogCombobox
        id={`product-${item.key}`}
        value={item.productId}
        options={productOptions.map((product) => ({
          id: product.id,
          label: product.label,
          meta: product.sku ? `SKU ${product.sku}` : null,
          price: product.unitPrice,
          searchText: product.label,
        }))}
        placeholder="Search products"
        draftLabel={getQuotationLineCatalogDraftLabel(item)}
        onValueChange={(nextProductId) => {
          const selected = productOptions.find((product) => product.id === nextProductId);
          setItem((current) => ({
            ...current,
            productId: nextProductId,
            description: selected?.label ?? current.description,
          }));
        }}
        createAction={{
          label: "Create New Product",
          renderDialog: ({ open, onOpenChange, suggestedName }) =>
            open ? (
              <div role="dialog" aria-label="Create product">
                <p data-testid="suggested-name">{suggestedName}</p>
                <button
                  type="button"
                  onClick={() => {
                    setProductOptions([
                      {
                        id: "product-relay",
                        label: "Relay",
                        sku: null,
                        unitPrice: 175,
                      },
                    ]);
                    setItem((current) => ({
                      ...current,
                      productId: "product-relay",
                      description: "Relay",
                      unitPrice: "175",
                    }));
                    onOpenChange(false);
                  }}
                >
                  Confirm create
                </button>
              </div>
            ) : null,
        }}
      />
      <p data-testid="linked-product-id">{item.productId || "unlinked"}</p>
    </>
  );
}

describe("quotation catalog create product flow", () => {
  it("opens the create dialog from a legacy unlinked line and prefills the typed name", () => {
    render(
      <QuotationProductLineHarness
        initialItem={createQuotationItem({
          key: "line-3",
          itemType: "product",
          description: "Relay",
          productId: "",
        })}
      />,
    );

    expect(screen.getByPlaceholderText("Search products")).toHaveValue("Relay");

    fireEvent.focus(screen.getByPlaceholderText("Search products"));
    fireEvent.click(screen.getByRole("button", { name: /Create New Product/i }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByLabelText(/Product name/i)).toHaveValue("Relay");
  });

  it("keeps the create dialog open while editing fields inside it", () => {
    render(
      <QuotationProductLineHarness
        initialItem={createQuotationItem({
          key: "line-3",
          itemType: "product",
          description: "Relay",
          productId: "",
        })}
      />,
    );

    fireEvent.focus(screen.getByPlaceholderText("Search products"));
    fireEvent.click(screen.getByRole("button", { name: /Create New Product/i }));

    const nameInput = screen.getByLabelText(/Product name/i);
    fireEvent.change(nameInput, { target: { value: "Relay 12V" } });
    fireEvent.mouseDown(screen.getByLabelText(/Selling price/i));
    fireEvent.click(screen.getByLabelText(/Selling price/i));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(nameInput).toHaveValue("Relay 12V");
  });

  it("passes the current typed name to the create dialog and links the line after create", () => {
    render(<QuotationProductLineLinkHarness />);

    const input = screen.getByPlaceholderText("Search products");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Relay" } });
    fireEvent.click(screen.getByRole("button", { name: /Create New Product/i }));

    expect(screen.getByTestId("suggested-name")).toHaveTextContent("Relay");

    fireEvent.click(screen.getByRole("button", { name: "Confirm create" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("linked-product-id")).toHaveTextContent("product-relay");
    expect(screen.getByPlaceholderText("Search products")).toHaveValue("Relay");
  });
});
