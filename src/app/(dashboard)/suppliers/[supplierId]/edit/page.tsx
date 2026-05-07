import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { SupplierForm } from "@/features/suppliers/components/supplier-form";
import { mapSupplierRowToFormValues } from "@/features/suppliers/mappers";
import { getSupplierById } from "@/features/suppliers/queries/supplier-queries";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type EditSupplierPageProps = {
  params: Promise<{
    supplierId: string;
  }>;
};

export default async function EditSupplierPage({ params }: EditSupplierPageProps) {
  await requireStaffCapability("suppliers:write");

  const { supplierId } = await params;
  const supplier = await getSupplierById(supplierId);

  if (!supplier) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${supplier.supplier_name}`}
        description="Update supplier data without pushing raw database types into UI components."
      />
      <SupplierForm mode="edit" initialValues={mapSupplierRowToFormValues(supplier)} />
    </div>
  );
}
