import { PageHeader } from "@/components/shared/page-header";
import { StaffForm } from "@/features/staff/components/staff-form";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function NewStaffPage() {
  await requireStaffCapability("staff:write");

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Staff Record"
        description="Creating a mechanic also provisions an attendance portal login automatically."
      />
      <StaffForm
        mode="create"
        initialValues={{
          staffCode: "",
          firstName: "",
          lastName: "",
          documentTitle: "",
          role: "mechanic",
          isPayrollEligible: true,
          contactNumber: "",
          address: "",
          sssNumber: "",
          philhealthNumber: "",
          tinNumber: "",
          emergencyContactName: "",
          emergencyContactNumber: "",
          status: "active",
          portalLoginEmail: "",
        }}
      />
    </div>
  );
}
