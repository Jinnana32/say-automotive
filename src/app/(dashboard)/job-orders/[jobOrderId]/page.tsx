import { notFound } from "next/navigation";

import { JobOrderDetailPage } from "@/features/job-orders/components/job-order-detail-page";
import { getJobOrderById, getJobOrderFormOptions } from "@/features/job-orders/queries/job-order-queries";

export const dynamic = "force-dynamic";

type JobOrderDetailRouteProps = {
  params: Promise<{
    jobOrderId: string;
  }>;
};

export default async function JobOrderDetailRoute({ params }: JobOrderDetailRouteProps) {
  const { jobOrderId } = await params;
  const [jobOrder, formOptions] = await Promise.all([
    getJobOrderById(jobOrderId),
    getJobOrderFormOptions(),
  ]);

  if (!jobOrder) {
    notFound();
  }

  const assignedMechanicIds = new Set(jobOrder.mechanics.map((mechanic) => mechanic.staffId));
  const availableMechanics = formOptions.mechanics.filter(
    (mechanic) => !assignedMechanicIds.has(mechanic.id),
  );

  return (
    <JobOrderDetailPage
      jobOrder={jobOrder}
      formOptions={formOptions}
      availableMechanics={availableMechanics}
    />
  );
}
