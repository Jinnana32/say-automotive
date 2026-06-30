import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { QuotationForm } from "@/features/quotations/components/quotation-form";
import { getQuotationReviseContext } from "@/features/quotations/queries/quotation-revise-queries";
import { getQuotationFormOptions } from "@/features/quotations/queries/quotation-queries";

export const dynamic = "force-dynamic";

type ReviseQuotationPageProps = {
  params: Promise<{
    quotationId: string;
  }>;
};

export default async function ReviseQuotationPage({ params }: ReviseQuotationPageProps) {
  const { quotationId } = await params;
  const [reviseContext, options] = await Promise.all([
    getQuotationReviseContext(quotationId),
    getQuotationFormOptions(),
  ]);

  if (!reviseContext) {
    notFound();
  }

  if (!reviseContext.canRevise) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`Revise ${reviseContext.quotation.quotationNumber}`}
          description="This approved quotation cannot be revised in its current state."
        />
        <div className="rounded-xl border border-border/70 bg-muted/20 p-4 text-sm text-muted-foreground">
          {reviseContext.blockReason ?? "Revise is not available for this quotation."}
        </div>
        <Button asChild variant="outline">
          <Link href={`/quotations/${quotationId}`}>Back to quotation</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Revise ${reviseContext.quotation.quotationNumber}`}
        description="Load the latest linked job order lines, update prices or items, then save to sync the customer quotation and shop work order."
      />
      <QuotationForm mode="revise" options={options} initialValues={reviseContext.initialValues} />
    </div>
  );
}
