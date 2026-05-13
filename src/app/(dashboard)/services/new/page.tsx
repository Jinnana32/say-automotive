import { PageHeader } from "@/components/shared/page-header";
import { ServiceForm } from "@/features/services/components/service-form";
import { requireStaffCapability } from "@/lib/auth/session";
import { formatMoneyInputValue } from "@/lib/currency";

export const dynamic = "force-dynamic";

export default async function NewServicePage() {
  await requireStaffCapability("services:write");

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Service"
        description="Add reusable labor and service catalog entries before building quotations and invoices."
      />
      <ServiceForm
        mode="create"
        initialValues={{
          name: "",
          category: "",
          description: "",
          laborPrice: formatMoneyInputValue(0),
          estimatedDurationMinutes: "",
          status: "active",
        }}
      />
    </div>
  );
}
