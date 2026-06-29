import { notFound } from "next/navigation";

import { JobOrderDetailPage } from "@/features/job-orders/components/job-order-detail-page";
import {
  getJobOrderById,
  getJobOrderMechanicOptions,
} from "@/features/job-orders/queries/job-order-queries";
import { canDeleteJobOrdersByRole, resolveJobOrderDetailTab } from "@/features/job-orders/utils";
import { requireAuthenticatedStaff } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type JobOrderDetailRouteProps = {
  params: Promise<{
    jobOrderId: string;
  }>;
  searchParams: Promise<{
    tab?: string;
  }>;
};

export default async function JobOrderDetailRoute({ params, searchParams }: JobOrderDetailRouteProps) {
  const { jobOrderId } = await params;
  const { tab } = await searchParams;
  const [jobOrder, mechanics, session] = await Promise.all([
    getJobOrderById(jobOrderId),
    getJobOrderMechanicOptions(),
    requireAuthenticatedStaff(),
  ]);

  if (!jobOrder) {
    notFound();
  }

  const assignedMechanicIds = new Set(jobOrder.mechanics.map((mechanic) => mechanic.staffId));
  const availableMechanics = mechanics.filter(
    (mechanic) => !assignedMechanicIds.has(mechanic.id),
  );

  return (
    <JobOrderDetailPage
      jobOrder={jobOrder}
      availableMechanics={availableMechanics}
      activeTab={resolveJobOrderDetailTab(tab)}
      canDeleteJobOrder={canDeleteJobOrdersByRole(session.role) && jobOrder.canDelete}
    />
  );
}
