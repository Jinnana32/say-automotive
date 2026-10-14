"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function RecordHistoryTabs({
  serviceHistory,
  documents,
  vehicles,
  serviceHistoryDescription,
  documentsDescription,
  vehiclesDescription,
  defaultTab = "service-history",
}: {
  serviceHistory: React.ReactNode;
  documents: React.ReactNode;
  vehicles?: React.ReactNode;
  serviceHistoryDescription: string;
  documentsDescription: string;
  vehiclesDescription?: string;
  defaultTab?: "vehicles" | "service-history" | "documents";
}) {
  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList>
        {vehicles ? <TabsTrigger value="vehicles">Vehicles</TabsTrigger> : null}
        <TabsTrigger value="service-history">Service history</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>
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
