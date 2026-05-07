import { PageHeader } from "@/components/shared/page-header";
import { QuotationCreateFlow } from "@/features/quotations/components/quotation-create-flow";
import { getQuotationCreateFlowOptions } from "@/features/quotations/queries/quotation-queries";
import { createQuotationItem } from "@/features/quotations/utils";

export const dynamic = "force-dynamic";

export default async function NewQuotationPage() {
  const options = await getQuotationCreateFlowOptions();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Quotation"
        description="Guided intake keeps customer and vehicle setup inside the quotation flow before you build the estimate."
      />
      <QuotationCreateFlow
        options={options}
        initialValues={{
          customerId: "",
          vehicleId: "",
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
