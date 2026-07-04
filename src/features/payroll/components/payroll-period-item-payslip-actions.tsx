"use client";

import { Download, Printer } from "lucide-react";

import { IconActionLink } from "@/components/shared/icon-action";
import type { PayrollPeriodItemSummary } from "@/features/payroll/types";

export function PayrollPeriodItemPayslipActions({
  periodId,
  item,
}: {
  periodId: string;
  item: PayrollPeriodItemSummary;
}) {
  const printHref = `/payroll/${periodId}/payslip/${item.id}/print`;
  const pdfHref = `/api/payroll/${periodId}/payslip/${item.id}/pdf`;

  return (
    <div className="flex items-center justify-end gap-1">
      <IconActionLink
        href={printHref}
        label={`Print payslip for ${item.fullName}`}
        icon={Printer}
      />
      <IconActionLink
        href={pdfHref}
        label={`Download payslip PDF for ${item.fullName}`}
        icon={Download}
      />
    </div>
  );
}
