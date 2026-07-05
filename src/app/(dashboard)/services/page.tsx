import Link from 'next/link';
import { Pencil } from 'lucide-react';

import { DataTableCard } from '@/components/shared/data-table-card';
import { DataTableScroll } from '@/components/shared/data-table-scroll';
import { DataTableFilters } from '@/components/shared/data-table-filters';
import { DataTablePagination } from '@/components/shared/data-table-pagination';
import { EmptyState } from '@/components/shared/empty-state';
import { IconActionLink } from '@/components/shared/icon-action';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/currency';
import { listServices } from '@/features/services/queries/service-queries';
import { paginateItems } from '@/lib/pagination';

export const dynamic = 'force-dynamic';

type ServicesPageProps = {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
};

export default async function ServicesPage({
  searchParams,
}: ServicesPageProps) {
  const { search = '', page } = await searchParams;
  const services = await listServices(search);
  const pagination = paginateItems(services, page);

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

      <DataTableCard
        title="Service catalog"
        description={`${pagination.totalItems} service${pagination.totalItems === 1 ? '' : 's'} matched.`}
        toolbar={
          <DataTableFilters
            key={search}
            className="md:grid md:grid-cols-[minmax(0,1fr)]"
            search={{
              value: search,
              placeholder: 'Search by service name or category',
            }}
          />
        }
        contentClassName="p-0"
        footer={
          <DataTablePagination
            page={pagination.page}
            pageSize={pagination.pageSize}
            totalItems={pagination.totalItems}
            totalPages={pagination.totalPages}
            startItem={pagination.startItem}
            endItem={pagination.endItem}
          />
        }
      >
        {pagination.totalItems === 0 ? (
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
          <DataTableScroll>
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
                {pagination.items.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-semibold">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {service.description ?? 'No description'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{service.category ?? 'Uncategorized'}</TableCell>
                    <TableCell>{formatCurrency(service.laborPrice)}</TableCell>
                    <TableCell>
                      {service.estimatedDurationMinutes
                        ? `${service.estimatedDurationMinutes} min`
                        : 'Not set'}
                    </TableCell>
                    <TableCell className="capitalize">
                      {service.status}
                    </TableCell>
                    <TableCell className="w-14 text-right">
                      {service.canManage ? (
                        <IconActionLink
                          href={`/services/${service.id}/edit`}
                          label={`Edit service ${service.name}`}
                          icon={Pencil}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          View only
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DataTableScroll>
        )}
      </DataTableCard>
    </div>
  );
}
