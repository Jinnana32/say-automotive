"use client";

import {
  useDeferredValue,
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  filterCatalogOptions,
  findCatalogOption,
  formatCatalogOptionPrice,
  type CatalogComboboxOption,
} from "@/lib/catalog/combobox-options";
import { cn } from "@/lib/utils";

export function CatalogCombobox({
  id,
  name,
  value,
  onValueChange,
  onSelect,
  options,
  placeholder = "Search catalog items",
  emptyMessage = "No matching items found.",
  loadingMessage = "Loading catalog items...",
  helperText,
  disabled = false,
  loading = false,
  className,
  inputClassName,
  inputProps,
  createAction,
}: {
  id: string;
  name?: string;
  value: string;
  onValueChange: (value: string) => void;
  onSelect?: (option: CatalogComboboxOption) => void;
  options: CatalogComboboxOption[];
  placeholder?: string;
  emptyMessage?: string;
  loadingMessage?: string;
  helperText?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  inputClassName?: string;
  inputProps?: Omit<
    ComponentProps<typeof Input>,
    "id" | "value" | "disabled" | "placeholder" | "autoComplete" | "className" | "onChange" | "onFocus" | "onBlur" | "onKeyDown"
  >;
  createAction?: ReactNode;
}) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = findCatalogOption(options, value);
  const [query, setQuery] = useState(selectedOption?.label ?? "");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const deferredQuery = useDeferredValue(query);
  const visibleOptions = loading ? [] : filterCatalogOptions(deferredQuery, options);
  const activeOption =
    activeIndex >= 0 && activeIndex < visibleOptions.length ? visibleOptions[activeIndex] : null;

  useEffect(() => {
    setQuery(selectedOption?.label ?? "");
  }, [selectedOption?.label, value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function handleSelect(option: CatalogComboboxOption) {
    onValueChange(option.id);
    onSelect?.(option);
    setQuery(option.label);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  function tryAutoSelectSingleMatch(nextQuery: string) {
    const matches = filterCatalogOptions(nextQuery, options, 2);
    if (matches.length !== 1) {
      return false;
    }

    handleSelect(matches[0]);
    return true;
  }

  return (
    <div
      ref={containerRef}
      className={cn("space-y-2", className)}
      onBlurCapture={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);

          if (!value && query.trim()) {
            tryAutoSelectSingleMatch(query);
          }

          if (value) {
            setQuery(selectedOption?.label ?? "");
          }
        }
      }}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          value={query}
          disabled={disabled || loading}
          placeholder={loading ? loadingMessage : placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={isOpen}
          aria-activedescendant={activeOption ? `${listboxId}-${activeIndex}` : undefined}
          className={cn("pr-10 pl-9", inputClassName)}
          {...inputProps}
          onFocus={() => {
            setIsOpen(true);
            setActiveIndex(visibleOptions.length > 0 ? 0 : -1);
          }}
          onChange={(event) => {
            const nextQuery = event.target.value;
            const nextVisibleOptions = filterCatalogOptions(nextQuery, options);

            setQuery(nextQuery);
            setIsOpen(true);
            setActiveIndex(nextVisibleOptions.length > 0 ? 0 : -1);

            if (!nextQuery.trim()) {
              onValueChange("");
            }
          }}
          onKeyDown={(event) => {
            if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
              setIsOpen(true);
              setActiveIndex(visibleOptions.length > 0 ? 0 : -1);
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();

              if (activeOption) {
                handleSelect(activeOption);
                return;
              }

              if (tryAutoSelectSingleMatch(query)) {
                return;
              }
            }

            if (!visibleOptions.length) {
              if (event.key === "Escape") {
                setIsOpen(false);
              }
              return;
            }

            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((current) => {
                const normalizedIndex =
                  current >= 0 && current < visibleOptions.length ? current : -1;
                return (normalizedIndex + 1) % visibleOptions.length;
              });
            }

            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((current) => {
                const normalizedIndex =
                  current >= 0 && current < visibleOptions.length ? current : 0;
                return normalizedIndex <= 0 ? visibleOptions.length - 1 : normalizedIndex - 1;
              });
            }

            if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
        />
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>

      {helperText ? <p className="text-xs text-muted-foreground">{helperText}</p> : null}

      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          className="overflow-hidden rounded-xl border border-border bg-background shadow-lg shadow-slate-950/5"
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">{loadingMessage}</div>
          ) : visibleOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            <div className="max-h-72 overflow-y-auto py-1">
              {visibleOptions.map((option, index) => {
                const isActive = index === activeIndex;
                const isSelected = option.id === value;
                const priceLabel = formatCatalogOptionPrice(option.price);

                return (
                  <button
                    key={option.id}
                    id={`${listboxId}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors",
                      isActive ? "bg-muted/70" : "hover:bg-muted/50",
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option)}
                  >
                    <span className="min-w-0 space-y-0.5">
                      <span className="block truncate font-medium text-foreground">{option.label}</span>
                      {option.meta ? (
                        <span className="block truncate text-xs text-muted-foreground">{option.meta}</span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {priceLabel ? (
                        <span className="text-xs font-semibold text-foreground">{priceLabel}</span>
                      ) : null}
                      {isSelected ? <Check className="h-4 w-4 text-primary" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {createAction ? (
            <div className="border-t border-border/70 bg-muted/20 px-2 py-2">{createAction}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export type { CatalogComboboxOption };
