"use client";

import { BusinessProfileForm } from "@/features/settings/components/business-profile-form";
import { OperationalRulesForm } from "@/features/settings/components/operational-rules-form";
import type { BusinessSettingsValues } from "@/features/settings/types";

export function SettingsPageTabs({
  settings,
}: {
  settings: BusinessSettingsValues;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <BusinessProfileForm initialValues={settings} />
      <OperationalRulesForm initialValues={settings} />
    </div>
  );
}
