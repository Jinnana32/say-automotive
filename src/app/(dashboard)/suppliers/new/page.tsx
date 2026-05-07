import { PageHeader } from "@/components/shared/page-header";
import { SupplierForm } from "@/features/suppliers/components/supplier-form";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function NewSupplierPage() {
  await requireStaffCapability("suppliers:write");

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Supplier"
        description="Create supplier records that can later be linked to products and stock receiving."
      />
      <SupplierForm
        mode="create"
        initialValues={{
          supplierName: "",
          contactPerson: "",
          contactNumber: "",
          email: "",
          address: "",
          paymentTerms: "",
          notes: "",
          status: "active",
        }}
      />
    </div>
  );
}
