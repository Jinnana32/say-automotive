"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { NativeSelect } from "@/components/ui/native-select";

type SearchFieldConfig = {
  name?: string;
  value: string;
  placeholder: string;
  className?: string;
};

type SelectFilterConfig = {
  type: "select";
  name: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  className?: string;
};

type DateFilterConfig = {
  type: "date";
  name: string;
  value: string;
  className?: string;
};

type FilterConfig = SelectFilterConfig | DateFilterConfig;

export function DataTableFilters({
  search,
  filters = [],
  className,
  pageParamName = "page",
  debounceMs = 300,
}: {
  search: SearchFieldConfig;
  filters?: FilterConfig[];
  className?: string;
  pageParamName?: string;
  debounceMs?: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [searchValue, setSearchValue] = useState(search.value);
  const initialFilterValues = useMemo(
    () => Object.fromEntries(filters.map((filter) => [filter.name, filter.value])),
    [filters],
  );
  const [filterValues, setFilterValues] = useState<Record<string, string>>(initialFilterValues);
  const searchParamName = search.name ?? "search";

  const updateRoute = useCallback(
    (nextSearchValue: string, nextFilterValues: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      const trimmedSearch = nextSearchValue.trim();

      if (trimmedSearch) {
        params.set(searchParamName, trimmedSearch);
      } else {
        params.delete(searchParamName);
      }

      filters.forEach((filter) => {
        const nextValue = nextFilterValues[filter.name]?.trim() ?? "";

        if (nextValue) {
          params.set(filter.name, nextValue);
        } else {
          params.delete(filter.name);
        }
      });

      params.delete(pageParamName);

      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;

      startTransition(() => {
        router.replace(href, { scroll: false });
      });
    },
    [filters, pageParamName, pathname, router, searchParamName, searchParams],
  );

  useEffect(() => {
    if (searchValue === search.value) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      updateRoute(searchValue, filterValues);
    }, debounceMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [debounceMs, filterValues, search.value, searchValue, updateRoute]);

  return (
    <FilterBar className={className}>
      <SearchInput
        type="search"
        name={searchParamName}
        value={searchValue}
        onChange={(event) => setSearchValue(event.target.value)}
        placeholder={search.placeholder}
        className={search.className}
      />
      {filters.map((filter) =>
        filter.type === "select" ? (
          <NativeSelect
            key={filter.name}
            name={filter.name}
            value={filterValues[filter.name] ?? ""}
            className={filter.className}
            onChange={(event) => {
              const nextValues = {
                ...filterValues,
                [filter.name]: event.target.value,
              };

              setFilterValues(nextValues);
              updateRoute(searchValue, nextValues);
            }}
          >
            {filter.options.map((option) => (
              <option key={option.value || "__all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        ) : (
          <input
            key={filter.name}
            type="date"
            name={filter.name}
            value={filterValues[filter.name] ?? ""}
            className={
              filter.className ??
              "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm shadow-slate-950/[0.02] transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
            }
            onChange={(event) => {
              const nextValues = {
                ...filterValues,
                [filter.name]: event.target.value,
              };

              setFilterValues(nextValues);
              updateRoute(searchValue, nextValues);
            }}
          />
        ),
      )}
    </FilterBar>
  );
}
