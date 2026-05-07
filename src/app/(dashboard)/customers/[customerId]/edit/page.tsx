import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { mapCustomerDetailToFormValues } from "@/features/customers/mappers";
import { getCustomerById } from "@/features/customers/queries/customer-queries";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type EditCustomerPageProps = {
  params: Promise<{
    customerId: string;
  }>;
};

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  await requireStaffCapability("customers:write");

  const { customerId } = await params;
  const customer = await getCustomerById(customerId);

  if (!customer) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${customer.displayName}`}
        description="Update this customer without leaking database row shapes into the UI layer."
      />
      <CustomerForm mode="edit" initialValues={mapCustomerDetailToFormValues(customer)} />
    </div>
  );
}
