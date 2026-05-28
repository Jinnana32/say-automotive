"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
}) {
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const baseId = React.useId();
  const currentValue = value ?? internalValue;

  const setValue = React.useCallback(
    (nextValue: string) => {
      if (value === undefined) {
        setInternalValue(nextValue);
      }

      onValueChange?.(nextValue);
    },
    [onValueChange, value],
  );

  return (
    <TabsContext.Provider value={{ value: currentValue, setValue, baseId }}>
      <div className={cn("space-y-4", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-2 overflow-x-auto rounded-2xl border border-slate-200/80 bg-slate-100/90 p-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "value"> & {
  value: string;
}) {
  const context = useTabsContext();
  const isActive = context.value === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${context.baseId}-trigger-${value}`}
      aria-controls={`${context.baseId}-content-${value}`}
      aria-selected={isActive}
      data-state={isActive ? "active" : "inactive"}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-transparent px-4 py-2 text-sm font-medium transition-[background-color,color,box-shadow,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B1F4D]/30 focus-visible:ring-offset-2",
        isActive
          ? "border-[#0B1F4D] bg-[#0B1F4D] text-white shadow-[0_10px_24px_-18px_rgba(11,31,77,0.9)]"
          : "text-slate-600 hover:bg-white/80 hover:text-[#0B1F4D]",
        className,
      )}
      onClick={() => context.setValue(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value: string;
}) {
  const context = useTabsContext();
  const isActive = context.value === value;

  return (
    <div
      role="tabpanel"
      id={`${context.baseId}-content-${value}`}
      aria-labelledby={`${context.baseId}-trigger-${value}`}
      hidden={!isActive}
      className={cn(!isActive && "hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
}

function useTabsContext() {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs components must be used within <Tabs />");
  }

  return context;
}
