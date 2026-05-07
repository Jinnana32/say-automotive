import { StatusBadge } from "@/components/shared/status-badge";
import type { PayrollPeriodStatus } from "@/features/payroll/types";
import { formatPayrollPeriodStatusLabel, getPayrollPeriodStatusTone } from "@/features/payroll/utils";

export function PayrollPeriodStatusBadge({ status }: { status: PayrollPeriodStatus }) {
  return (
    <StatusBadge tone={getPayrollPeriodStatusTone(status)}>
      {formatPayrollPeriodStatusLabel(status)}
    </StatusBadge>
  );
}
