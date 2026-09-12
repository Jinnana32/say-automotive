import { PageHeader } from "@/components/shared/page-header";
import { StaffForm } from "@/features/staff/components/staff-form";
import { listStaffScheduleCopyOptions } from "@/features/staff/queries/staff-schedule-copy-options";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function NewStaffPage() {
  await requireStaffCapability("staff:write");
  const scheduleCopyOptions = await listStaffScheduleCopyOptions();
  const defaultCopyScheduleFromStaffId = scheduleCopyOptions[0]?.staffId ?? "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Staff Record"
        description="Creating a mechanic also provisions an attendance portal login automatically. A work schedule is copied from another staff member and can be edited later."
      />
      <StaffForm
        mode="create"
        scheduleCopyOptions={scheduleCopyOptions}
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
          pagibigNumber: "",
          emergencyContactName: "",
          emergencyContactNumber: "",
          status: "active",
          portalLoginEmail: "",
          copyScheduleFromStaffId: defaultCopyScheduleFromStaffId,
        }}
      />
    </div>
  );
}
