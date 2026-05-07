import Link from "next/link";

import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import {
  VehicleLookupOptionSection,
  VehicleMakeLookupSection,
  VehicleModelLookupSection,
} from "@/features/vehicles/components/vehicle-lookup-forms";
import { getVehicleLookupPageData } from "@/features/vehicles/queries/vehicle-lookup-queries";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function VehicleLookupsPage() {
  await requireStaffCapability("settings:read");
  const data = await getVehicleLookupPageData();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vehicle lookups"
        description="Internal make, model, and dropdown reference data for vehicle registration."
        actions={
          <Button asChild variant="outline">
            <Link href="/settings">Back to settings</Link>
          </Button>
        }
      />

      <MetricGrid className="xl:grid-cols-5">
        <StatCard title="Active makes" value={String(data.summary.activeMakes)} description="Available make suggestions" />
        <StatCard title="Active models" value={String(data.summary.activeModels)} description="Available model suggestions" />
        <StatCard title="Transmission options" value={String(data.summary.transmissionOptions)} description="Internal dropdown values" />
        <StatCard title="Fuel type options" value={String(data.summary.fuelTypeOptions)} description="Internal dropdown values" />
        <StatCard title="Color options" value={String(data.summary.colorOptions)} description="Internal dropdown values" />
      </MetricGrid>

      <SectionCard
        title="Seed importer"
        description="Use the one-time importer to fetch PH-relevant makes and models from vPIC, then keep the data internal."
      >
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            The importer filters toward road-going vehicle types, writes a JSON seed file, and `--apply` requires a Supabase service role key.
          </p>
          <code className="block rounded-xl border border-border/70 bg-muted/15 px-4 py-3 text-sm text-foreground">
            node scripts/import-vpic-vehicle-lookups.mjs --apply
          </code>
        </div>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <VehicleMakeLookupSection makes={data.makes} />
        <VehicleModelLookupSection makes={data.makes} models={data.models} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {data.optionGroups.map((group) => (
          <VehicleLookupOptionSection key={group.lookupType} group={group} />
        ))}
      </div>
    </div>
  );
}
