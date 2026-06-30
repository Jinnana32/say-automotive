import { cache } from "react";

import { getJobOrderById } from "@/features/job-orders/queries/job-order-queries";
import { mapJobOrderDetailToReviseFormValues } from "@/features/quotations/mappers";
import { getQuotationById } from "@/features/quotations/queries/quotation-queries";
import type { QuotationDetail, QuotationFormValues } from "@/features/quotations/types";
import { canReviseQuotation } from "@/features/quotations/utils";

export type QuotationReviseContext = {
  quotation: QuotationDetail;
  initialValues: QuotationFormValues;
  canRevise: boolean;
  blockReason: string | null;
};

export const getQuotationReviseContext = cache(
  async (quotationId: string): Promise<QuotationReviseContext | null> => {
    const quotation = await getQuotationById(quotationId);

    if (!quotation) {
      return null;
    }

    if (!quotation.jobOrderId) {
      return {
        quotation,
        initialValues: {
          quotationId: quotation.id,
          customerId: quotation.customerId,
          vehicleId: quotation.vehicleId,
          natureOfRepair: quotation.natureOfRepair ?? "",
          inspectionNotes: quotation.inspectionNotes ?? "",
          status: "pending_approval",
          discount: "0",
          tax: "0",
          items: [],
        },
        canRevise: false,
        blockReason: "This quotation is not linked to a job order.",
      };
    }

    const jobOrder = await getJobOrderById(quotation.jobOrderId);

    if (!jobOrder) {
      return {
        quotation,
        initialValues: {
          quotationId: quotation.id,
          customerId: quotation.customerId,
          vehicleId: quotation.vehicleId,
          natureOfRepair: quotation.natureOfRepair ?? "",
          inspectionNotes: quotation.inspectionNotes ?? "",
          status: "pending_approval",
          discount: "0",
          tax: "0",
          items: [],
        },
        canRevise: false,
        blockReason: "The linked job order could not be loaded.",
      };
    }

    const hasActiveInvoice =
      Boolean(jobOrder.invoiceId) && jobOrder.invoiceStatus !== "cancelled";
    const canRevise = canReviseQuotation({
      status: quotation.status,
      jobOrderId: quotation.jobOrderId,
      jobOrderStatus: jobOrder.status,
      hasActiveInvoice,
    });

    let blockReason: string | null = null;

    if (!canRevise) {
      if (quotation.status !== "approved") {
        blockReason = "Only approved quotations can be revised.";
      } else if (hasActiveInvoice) {
        blockReason = "This quotation cannot be revised after an active invoice has been created.";
      } else if (
        ["completed", "ready_for_billing", "paid", "released", "cancelled"].includes(jobOrder.status)
      ) {
        blockReason = "This quotation cannot be revised while the linked job order is completed, billed, or released.";
      } else {
        blockReason = "This quotation cannot be revised right now.";
      }
    }

    return {
      quotation,
      initialValues: mapJobOrderDetailToReviseFormValues({ quotation, jobOrder }),
      canRevise,
      blockReason,
    };
  },
);
