import Link from "next/link";

import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { BusinessProfileForm } from "@/features/settings/components/business-profile-form";
import { DocumentSequenceForm } from "@/features/settings/components/document-sequence-form";
import { OperationalRulesForm } from "@/features/settings/components/operational-rules-form";
import { getSettingsPageData } from "@/features/settings/queries/settings-queries";
import { formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settingsPage = await getSettingsPageData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Operational rules, business identity, and numbering controls."
      />

      <MetricGrid className="xl:grid-cols-4">
        <StatCard title="Active branch" value={settingsPage.branchName} description="Current operating branch" />
        <StatCard
          title="Default tax"
          value={`${settingsPage.settings.defaultTaxRate}%`}
          description="Applied by default to billing documents"
        />
        <StatCard
          title="Release policy"
          value={settingsPage.settings.requireFullPaymentBeforeRelease ? "Strict" : "Flexible"}
          description="Vehicle release enforcement"
          badge={settingsPage.settings.allowReleaseWithBalance ? "Balance allowed" : "No balance release"}
          tone={settingsPage.settings.allowReleaseWithBalance ? "warning" : "success"}
        />
        <StatCard
          title="Audit entries"
          value={String(settingsPage.recentAuditEntries.length)}
          description="Recent settings changes shown below"
        />
      </MetricGrid>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <BusinessProfileForm initialValues={settingsPage.settings} />
        <OperationalRulesForm initialValues={settingsPage.settings} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        {settingsPage.documentSequences.map((sequence) => (
          <DocumentSequenceForm key={sequence.key} sequence={sequence} />
        ))}
      </section>

      <SectionCard
        title="Reference catalogs"
        description="Manage internal operational lookup data without crowding the main settings screen."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/settings/timekeeping">Timekeeping calendar</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/settings/vehicle-lookups">Vehicle lookups</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/settings/website">Website</Link>
            </Button>
          </div>
        }
      >
        <p className="text-sm text-muted-foreground">
          Vehicle lookups and website-facing content are managed on dedicated pages so the main
          settings screen stays operational instead of bloated.
        </p>
      </SectionCard>

      <SectionCard
        title="Recent settings activity"
        description="Configuration changes that affect billing, release, POS, and numbering behavior."
      >
        <div className="space-y-3">
          {settingsPage.recentAuditEntries.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No settings-related audit entries have been recorded yet.
            </p>
          ) : (
            settingsPage.recentAuditEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-muted/15 px-4 py-3"
              >
                <div className="space-y-1">
                  <p className="font-medium">{entry.action}</p>
                  <p className="text-sm text-muted-foreground">{formatDateTime(entry.createdAt)}</p>
                </div>
                <StatusBadge tone="info">{entry.entityType.replaceAll("_", " ")}</StatusBadge>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}
