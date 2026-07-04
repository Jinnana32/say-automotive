"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { JobOrderDetailTab } from "@/features/job-orders/types";
import { resolveJobOrderDetailTab } from "@/features/job-orders/utils";

export function JobOrderDetailTabs({
  activeTab,
  overview,
  billing,
  workItems,
  partsUsage,
  mechanics,
}: {
  activeTab: JobOrderDetailTab;
  overview: React.ReactNode;
  billing: React.ReactNode;
  workItems: React.ReactNode;
  partsUsage: React.ReactNode;
  mechanics: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const currentTab = resolveJobOrderDetailTab(searchParams.get("tab") ?? activeTab);

  function handleTabChange(nextTab: string) {
    const resolvedTab = nextTab as JobOrderDetailTab;

    startTransition(() => {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.set("tab", resolvedTab);
      router.replace(`${pathname}?${nextParams.toString()}`, { scroll: false });
    });
  }

  return (
    <Tabs
      value={currentTab}
      onValueChange={handleTabChange}
      defaultValue={activeTab}
      className="min-w-0 space-y-4"
    >
      <TabsList className="w-full justify-start">
        <TabsTrigger value="overview" className="px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm lg:min-h-10 lg:px-4">
          Overview
        </TabsTrigger>
        <TabsTrigger value="billing" className="px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm lg:min-h-10 lg:px-4">
          Billing
        </TabsTrigger>
        <TabsTrigger value="work-items" className="px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm lg:min-h-10 lg:px-4">
          Work Items
        </TabsTrigger>
        <TabsTrigger value="parts-usage" className="px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm lg:min-h-10 lg:px-4">
          Parts Usage
        </TabsTrigger>
        <TabsTrigger value="mechanics" className="px-2.5 py-1.5 text-xs sm:px-3 sm:py-2 sm:text-sm lg:min-h-10 lg:px-4">
          Mechanics
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">{overview}</TabsContent>
      <TabsContent value="billing">{billing}</TabsContent>
      <TabsContent value="work-items">{workItems}</TabsContent>
      <TabsContent value="parts-usage">{partsUsage}</TabsContent>
      <TabsContent value="mechanics">{mechanics}</TabsContent>
    </Tabs>
  );
}
