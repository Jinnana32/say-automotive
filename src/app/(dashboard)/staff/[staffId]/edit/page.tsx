import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { StaffForm } from "@/features/staff/components/staff-form";
import { mapStaffRowToFormValues } from "@/features/staff/mappers";
import { getStaffById } from "@/features/staff/queries/staff-queries";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type EditStaffPageProps = {
  params: Promise<{
    staffId: string;
  }>;
};

export default async function EditStaffPage({ params }: EditStaffPageProps) {
  await requireStaffCapability("staff:write");

  const { staffId } = await params;
  const staff = await getStaffById(staffId);

  if (!staff) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${staff.first_name} ${staff.last_name}`}
        description="Keep personnel data clean so later attendance and assignment logic has stable inputs."
      />
      <StaffForm mode="edit" initialValues={mapStaffRowToFormValues(staff)} />
    </div>
  );
}
