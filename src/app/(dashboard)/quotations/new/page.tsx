import { PageHeader } from "@/components/shared/page-header";
import { QuotationCreateFlow } from "@/features/quotations/components/quotation-create-flow";
import { getQuotationCreateFlowOptions } from "@/features/quotations/queries/quotation-queries";
import {
  createQuotationItem,
  resolveQuotationCreateFlowSelection,
} from "@/features/quotations/utils";

export const dynamic = "force-dynamic";

type NewQuotationPageProps = {
  searchParams: Promise<{
    customerId?: string;
    vehicleId?: string;
  }>;
};

export default async function NewQuotationPage({
  searchParams,
}: NewQuotationPageProps) {
  const { customerId, vehicleId } = await searchParams;
  const options = await getQuotationCreateFlowOptions();
  const selection = resolveQuotationCreateFlowSelection({
    requestedCustomerId: customerId,
    requestedVehicleId: vehicleId,
    customers: options.customers,
    vehicles: options.vehicles,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Quotation"
        description="Guided intake keeps customer and vehicle setup inside the quotation flow before you build the estimate."
      />
      <QuotationCreateFlow
        options={options}
        initialValues={{
          customerId: selection.customerId,
          vehicleId: selection.vehicleId,
          natureOfRepair: "",
          inspectionNotes: "",
          status: "draft",
          discount: "0",
          tax: "0",
          items: [createQuotationItem()],
        }}
      />
    </div>
  );
}
