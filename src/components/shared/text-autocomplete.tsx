"use client";

import { useDeferredValue, useEffect, useId, useRef, useState, type ComponentProps } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type TextAutocompleteOption = {
  value: string;
  label?: string;
  meta?: string;
};

export function TextAutocomplete({
  id,
  name,
  value,
  onValueChange,
  options,
  placeholder,
  emptyMessage = "No matching suggestions. You can keep typing a custom value.",
  helperText,
  disabled,
  className,
  inputClassName,
  inputProps,
}: {
  id: string;
  name: string;
  value: string;
  onValueChange: (value: string) => void;
  options: TextAutocompleteOption[];
  placeholder?: string;
  emptyMessage?: string;
  helperText?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  inputProps?: Omit<
    ComponentProps<typeof Input>,
    "id" | "name" | "value" | "disabled" | "placeholder" | "autoComplete" | "className" | "onChange" | "onFocus" | "onKeyDown"
  >;
}) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const deferredValue = useDeferredValue(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const visibleOptions = getVisibleOptions(deferredValue, options);
  const activeOption =
    activeIndex >= 0 && activeIndex < visibleOptions.length ? visibleOptions[activeIndex] : null;

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function handleSelect(option: TextAutocompleteOption) {
    onValueChange(option.value);
    setIsOpen(false);
  }

  return (
    <div
      ref={containerRef}
      className={cn("space-y-2", className)}
      onBlurCapture={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
          setIsOpen(false);
        }
      }}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          name={name}
          value={value}
          disabled={disabled}
          placeholder={placeholder}
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
            const nextValue = event.target.value;
            const nextVisibleOptions = getVisibleOptions(nextValue, options);

            onValueChange(nextValue);
            setIsOpen(true);
            setActiveIndex(nextVisibleOptions.length > 0 ? 0 : -1);
          }}
          onKeyDown={(event) => {
            if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
              setIsOpen(true);
              setActiveIndex(visibleOptions.length > 0 ? 0 : -1);
              return;
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

            if (event.key === "Enter" && activeOption) {
              event.preventDefault();
              handleSelect(activeOption);
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
          {visibleOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</div>
          ) : (
            <div className="max-h-64 overflow-y-auto py-1">
              {visibleOptions.map((option, index) => {
                const isActive = index === activeIndex;
                const isSelected = option.value.trim().toLowerCase() === value.trim().toLowerCase();

                return (
                  <button
                    key={`${option.value}-${index}`}
                    id={`${listboxId}-${index}`}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={cn(
                      "flex w-full items-start justify-between gap-3 px-3 py-2 text-left text-sm transition-colors",
                      isActive ? "bg-muted/70" : "hover:bg-muted/50",
                    )}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option)}
                  >
                    <span className="space-y-0.5">
                      <span className="block font-medium text-foreground">
                        {option.label ?? option.value}
                      </span>
                      {option.meta ? (
                        <span className="block text-xs text-muted-foreground">{option.meta}</span>
                      ) : null}
                    </span>
                    {isSelected ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export type { TextAutocompleteOption };

function getVisibleOptions(value: string, options: TextAutocompleteOption[]) {
  const normalizedQuery = value.trim().toLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) => {
        const haystack = [option.value, option.label, option.meta]
          .filter(Boolean)
          .join(" ")
          .trim()
          .toLowerCase();

        return haystack.includes(normalizedQuery);
      })
    : options;

  return filteredOptions.slice(0, 8);
}
