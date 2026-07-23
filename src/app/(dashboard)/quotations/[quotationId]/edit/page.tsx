import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { QuotationForm } from "@/features/quotations/components/quotation-form";
import { mapQuotationDetailToFormValues } from "@/features/quotations/mappers";
import { getQuotationById, getQuotationFormOptionsForQuotation } from "@/features/quotations/queries/quotation-queries";

export const dynamic = "force-dynamic";

type EditQuotationPageProps = {
  params: Promise<{
    quotationId: string;
  }>;
};

export default async function EditQuotationPage({ params }: EditQuotationPageProps) {
  const { quotationId } = await params;
  const quotation = await getQuotationById(quotationId);

  if (!quotation || quotation.status === "approved") {
    notFound();
  }

  const options = await getQuotationFormOptionsForQuotation(quotation);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${quotation.quotationNumber}`}
        description="Keep editing limited to non-approved quotations so the later job order stays authoritative."
      />
      <QuotationForm
        mode="edit"
        options={options}
        initialValues={mapQuotationDetailToFormValues(quotation)}
        partyContext={{
          customerName: quotation.customerName,
          vehicleLabel: quotation.vehicleLabel,
        }}
      />
    </div>
  );
}
