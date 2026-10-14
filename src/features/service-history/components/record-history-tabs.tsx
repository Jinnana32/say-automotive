"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RecordHistoryTabs({
  overview,
  serviceHistory,
  documents,
  vehicles,
  overviewDescription,
  serviceHistoryDescription,
  documentsDescription,
  vehiclesDescription,
  defaultTab = "service-history",
}: {
  overview?: React.ReactNode;
  serviceHistory: React.ReactNode;
  documents: React.ReactNode;
  vehicles?: React.ReactNode;
  overviewDescription?: string;
  serviceHistoryDescription: string;
  documentsDescription: string;
  vehiclesDescription?: string;
  defaultTab?: "overview" | "vehicles" | "service-history" | "documents";
}) {
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        {overview ? <TabsTrigger value="overview">Overview</TabsTrigger> : null}
        {vehicles ? <TabsTrigger value="vehicles">Vehicles</TabsTrigger> : null}
        <TabsTrigger value="service-history">Service history</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
      {overview ? (
        <TabsContent value="overview" className="space-y-4">
          {overviewDescription ? (
            <p className="text-sm text-muted-foreground">{overviewDescription}</p>
          ) : null}
          {overview}
        </TabsContent>
      ) : null}
      {vehicles ? (
        <TabsContent value="vehicles" className="space-y-4">
          <p className="text-sm text-muted-foreground">{vehiclesDescription}</p>
          {vehicles}
        </TabsContent>
      ) : null}
      <TabsContent value="service-history" className="space-y-4">
        <p className="text-sm text-muted-foreground">{serviceHistoryDescription}</p>
        {serviceHistory}
      </TabsContent>
      <TabsContent value="documents" className="space-y-4">
        <p className="text-sm text-muted-foreground">{documentsDescription}</p>
        {documents}
      </TabsContent>
    </Tabs>
  );
}
