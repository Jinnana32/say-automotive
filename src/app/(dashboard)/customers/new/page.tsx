import { PageHeader } from "@/components/shared/page-header";
import { CustomerForm } from "@/features/customers/components/customer-form";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
  await requireStaffCapability("customers:write");

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Customer"
        description="Create the customer record first, then attach vehicles and future operational documents to it."
      />
      <CustomerForm
        mode="create"
        initialValues={{
          customerType: "individual",
          firstName: "",
          lastName: "",
          companyName: "",
          contactNumber: "",
          email: "",
          address: "",
          notes: "",
          status: "active",
        }}
      />
    </div>
  );
}
