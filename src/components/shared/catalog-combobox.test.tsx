import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { CatalogCombobox } from "@/components/shared/catalog-combobox";
import type { CatalogComboboxOption } from "@/lib/catalog/combobox-options";

const OPTIONS: CatalogComboboxOption[] = [
  {
    id: "product-1",
    label: "Engine Oil 5W-30",
    meta: "SKU EO-530",
    price: 850,
    searchText: "Engine Oil 5W-30 EO-530",
  },
  {
    id: "service-1",
    label: "Oil Change",
    meta: "Category · Maintenance",
    price: 1200,
    searchText: "Oil Change Maintenance",
  },
];

describe("CatalogCombobox", () => {
  it("filters options, selects an item, and calls onSelect", () => {
    const handleSelect = vi.fn();

    function TestHarness() {
      const [value, setValue] = useState("");

      return (
        <CatalogCombobox
          id="catalog-item"
          value={value}
          onValueChange={setValue}
          onSelect={handleSelect}
          options={OPTIONS}
          placeholder="Search products or services"
        />
      );
    }

    render(<TestHarness />);

    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "oil change" } });

    expect(screen.getByRole("option", { name: /Oil Change/i })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: /Engine Oil/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: /Oil Change/i }));

    expect(screen.getByRole("textbox")).toHaveValue("Oil Change");
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "service-1",
        label: "Oil Change",
      }),
    );
  });

  it("auto-selects a single visible match on Enter", () => {
    function TestHarness() {
      const [value, setValue] = useState("");

      return (
        <CatalogCombobox
          id="catalog-item"
          value={value}
          onValueChange={setValue}
          options={OPTIONS}
        />
      );
    }

    render(<TestHarness />);

    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "Engine Oil" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(screen.getByRole("textbox")).toHaveValue("Engine Oil 5W-30");
  });

  it("keeps the create dialog open after closing the dropdown", () => {
    function TestHarness() {
      const [value, setValue] = useState("");

      return (
        <CatalogCombobox
          id="catalog-item"
          value={value}
          onValueChange={setValue}
          options={OPTIONS}
          createAction={{
            label: "Create New Product",
            renderDialog: ({ open, onOpenChange }) =>
              open ? (
                <div role="dialog" aria-label="Create product">
                  <input aria-label="Product name" />
                  <button type="button" onClick={() => onOpenChange(false)}>
                    Close
                  </button>
                </div>
              ) : null,
          }}
        />
      );
    }

    render(<TestHarness />);

    const input = screen.getByRole("textbox");
    fireEvent.focus(input);
    fireEvent.click(screen.getByRole("button", { name: /Create New Product/i }));

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    const dialog = screen.getByRole("dialog", { name: /Create product/i });
    const nameInput = screen.getByRole("textbox", { name: /Product name/i });

    fireEvent.mouseDown(nameInput);
    fireEvent.click(nameInput);
    fireEvent.change(nameInput, { target: { value: "Brake Pads" } });

    expect(dialog).toBeInTheDocument();
    expect(nameInput).toHaveValue("Brake Pads");
  });

  it("shows an unlinked hint when draft text is present without a catalog id", () => {
    render(
      <CatalogCombobox
        id="catalog-item"
        value=""
        onValueChange={() => undefined}
        options={OPTIONS}
        draftLabel="Relay"
      />,
    );

    expect(screen.getByRole("textbox")).toHaveValue("Relay");
    expect(
      screen.getByText(/Typed text alone is not saved/i),
    ).toBeInTheDocument();
  });
});
