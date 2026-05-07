import { PayrollPageContent } from "@/features/payroll/components/payroll-page-content";
import { getPayrollPageData } from "@/features/payroll/queries/payroll-queries";
import { resolvePayrollPageFilters } from "@/features/payroll/utils";

export const dynamic = "force-dynamic";

type PayrollPageProps = {
  searchParams: Promise<{
    staffSearch?: string;
    periodStatus?: string;
  }>;
};

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
  const filters = resolvePayrollPageFilters(await searchParams);
  const data = await getPayrollPageData(filters);

  return <PayrollPageContent data={data} />;
}
