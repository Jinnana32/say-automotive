"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BusinessProfileForm } from "@/features/settings/components/business-profile-form";
import { DocumentSequenceForm } from "@/features/settings/components/document-sequence-form";
import { OperationalRulesForm } from "@/features/settings/components/operational-rules-form";
import type { BusinessSettingsValues, SettingsDocumentSequence } from "@/features/settings/types";

export function SettingsPageTabs({
  settings,
  documentSequences,
}: {
  settings: BusinessSettingsValues;
  documentSequences: SettingsDocumentSequence[];
}) {
  return (
    <Tabs defaultValue="general" className="space-y-5">
      <TabsList className="w-full justify-start">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <BusinessProfileForm initialValues={settings} />
          <OperationalRulesForm initialValues={settings} />
        </div>
      </TabsContent>

      <TabsContent value="documents" className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-2">
          {documentSequences.map((sequence) => (
            <DocumentSequenceForm key={sequence.key} sequence={sequence} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
