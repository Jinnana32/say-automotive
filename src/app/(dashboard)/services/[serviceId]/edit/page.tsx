import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { ServiceForm } from "@/features/services/components/service-form";
import { mapServiceRowToFormValues } from "@/features/services/mappers";
import { getServiceById } from "@/features/services/queries/service-queries";
import { requireStaffCapability } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

type EditServicePageProps = {
  params: Promise<{
    serviceId: string;
  }>;
};

export default async function EditServicePage({ params }: EditServicePageProps) {
  await requireStaffCapability("services:write");

  const { serviceId } = await params;
  const service = await getServiceById(serviceId);

  if (!service) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${service.name}`}
        description="Update the reusable labor entry without exposing raw database types to the form layer."
      />
      <ServiceForm mode="edit" initialValues={mapServiceRowToFormValues(service)} />
    </div>
  );
}
