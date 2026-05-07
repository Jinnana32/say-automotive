import { PayrollPeriodDetail } from "@/features/payroll/components/payroll-period-detail";
import { getPayrollPeriodDetailData } from "@/features/payroll/queries/payroll-queries";

export const dynamic = "force-dynamic";

type PayrollPeriodPageProps = {
  params: Promise<{
    periodId: string;
  }>;
};

export default async function PayrollPeriodPage({ params }: PayrollPeriodPageProps) {
  const { periodId } = await params;
  const data = await getPayrollPeriodDetailData(periodId);

  return <PayrollPeriodDetail data={data} />;
}
