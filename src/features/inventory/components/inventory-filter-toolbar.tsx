"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type {
  InventoryMovementType,
  InventoryStockFilterState,
} from "@/features/inventory/types";
import { formatInventoryMovementType } from "@/features/inventory/utils";

type InventoryFilterToolbarProps = {
  search: string;
  stockState: InventoryStockFilterState;
  movementType: InventoryMovementType | "";
};

export function InventoryFilterToolbar({
  search,
  stockState,
  movementType,
}: InventoryFilterToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(search);
  const [stockStateValue, setStockStateValue] =
    useState<InventoryStockFilterState>(stockState);
  const [movementTypeValue, setMovementTypeValue] =
    useState<InventoryMovementType | "">(movementType);

  const hasActiveFilters = useMemo(
    () =>
      searchValue.trim().length > 0 ||
      stockStateValue !== "all" ||
      movementTypeValue !== "",
    [movementTypeValue, searchValue, stockStateValue],
  );

  const updateRoute = useCallback(
    (nextFilters: {
      search: string;
      stockState: InventoryStockFilterState;
      movementType: InventoryMovementType | "";
    }) => {
      const params = new URLSearchParams();

      if (nextFilters.search.trim().length > 0) {
        params.set("search", nextFilters.search.trim());
      }

      if (nextFilters.stockState !== "all") {
        params.set("stockState", nextFilters.stockState);
      }

      if (nextFilters.movementType !== "") {
        params.set("movementType", nextFilters.movementType);
      }

      const query = params.toString();
      const href = query.length > 0 ? `${pathname}?${query}` : pathname;

      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [pathname, router],
  );

  useEffect(() => {
    if (searchValue === search) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      updateRoute({
        search: searchValue,
        stockState: stockStateValue,
        movementType: movementTypeValue,
      });
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [movementTypeValue, search, searchValue, stockStateValue, updateRoute]);

  return (
    <FilterBar className="lg:grid lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
      <SearchInput
        type="search"
        name="search"
        value={searchValue}
        onChange={(event) => {
          setSearchValue(event.target.value);
        }}
        placeholder="Search product name, SKU, or barcode"
      />
      <NativeSelect
        name="stockState"
        value={stockStateValue}
        onChange={(event) => {
          const nextValue = event.target.value as InventoryStockFilterState;
          setStockStateValue(nextValue);
          updateRoute({
            search: searchValue,
            stockState: nextValue,
            movementType: movementTypeValue,
          });
        }}
      >
        <option value="all">All stock states</option>
        <option value="low">Low stock</option>
        <option value="out">No stock</option>
      </NativeSelect>
      <NativeSelect
        name="movementType"
        value={movementTypeValue}
        onChange={(event) => {
          const nextValue = event.target.value as InventoryMovementType | "";
          setMovementTypeValue(nextValue);
          updateRoute({
            search: searchValue,
            stockState: stockStateValue,
            movementType: nextValue,
          });
        }}
      >
        <option value="">All movement types</option>
        <option value="stock_in">{formatInventoryMovementType("stock_in")}</option>
        <option value="adjustment">{formatInventoryMovementType("adjustment")}</option>
        <option value="damaged">{formatInventoryMovementType("damaged")}</option>
        <option value="service_usage">{formatInventoryMovementType("service_usage")}</option>
        <option value="pos_sale">{formatInventoryMovementType("pos_sale")}</option>
        <option value="return">{formatInventoryMovementType("return")}</option>
      </NativeSelect>
      <Button
        type="button"
        variant="secondary"
        disabled={!hasActiveFilters || isPending}
        onClick={() => {
          setSearchValue("");
          setStockStateValue("all");
          setMovementTypeValue("");
          updateRoute({
            search: "",
            stockState: "all",
            movementType: "",
          });
        }}
      >
        Reset
      </Button>
    </FilterBar>
  );
}
