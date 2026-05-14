import { PayrollPageContent } from "@/features/payroll/components/payroll-page-content";
import { getPayrollPageData } from "@/features/payroll/queries/payroll-queries";
import { resolvePayrollPageFilters } from "@/features/payroll/utils";

export const dynamic = "force-dynamic";

type PayrollPageProps = {
  searchParams: Promise<{
    periodSearch?: string;
    staffSearch?: string;
    periodStatus?: string;
    periodPage?: string;
    staffPage?: string;
  }>;
};

export default async function PayrollPage({ searchParams }: PayrollPageProps) {
  const resolvedSearchParams = await searchParams;
  const filters = resolvePayrollPageFilters(resolvedSearchParams);
  const data = await getPayrollPageData(filters);

  return (
    <PayrollPageContent
      data={data}
      periodPage={resolvedSearchParams.periodPage}
      staffPage={resolvedSearchParams.staffPage}
    />
  );
}
