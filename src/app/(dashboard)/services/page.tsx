import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { listServices } from "@/features/services/queries/service-queries";

export const dynamic = "force-dynamic";

type ServicesPageProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const { search = "" } = await searchParams;
  const services = await listServices(search);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Services"
        description="Maintain labor and service catalog entries that will feed quotations, job orders, and invoices."
        actions={
          <Button asChild>
            <Link href="/services/new">New service</Link>
          </Button>
        }
      />

      <Card className="border-border/70 shadow-sm">
        <CardContent className="space-y-4 p-6">
          <form className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search by service name or category"
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit">Search</Button>
          </form>

          {services.length === 0 ? (
            <EmptyState
              title="No services found"
              description="Create service catalog entries before assembling quotations or billing labor."
              action={
                <Button asChild>
                  <Link href="/services/new">Create service</Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Labor price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-semibold">{service.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {service.description ?? "No description"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{service.category ?? "Uncategorized"}</TableCell>
                      <TableCell>{formatCurrency(service.laborPrice)}</TableCell>
                      <TableCell>
                        {service.estimatedDurationMinutes
                          ? `${service.estimatedDurationMinutes} min`
                          : "Not set"}
                      </TableCell>
                      <TableCell className="capitalize">{service.status}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/services/${service.id}/edit`}>Edit</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
