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
    <Tabs value={currentTab} onValueChange={handleTabChange} defaultValue={activeTab} className="space-y-4">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
        <TabsTrigger value="work-items">Work Items</TabsTrigger>
        <TabsTrigger value="parts-usage">Parts Usage</TabsTrigger>
        <TabsTrigger value="mechanics">Mechanics</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">{overview}</TabsContent>
      <TabsContent value="billing">{billing}</TabsContent>
      <TabsContent value="work-items">{workItems}</TabsContent>
      <TabsContent value="parts-usage">{partsUsage}</TabsContent>
      <TabsContent value="mechanics">{mechanics}</TabsContent>
    </Tabs>
  );
}
