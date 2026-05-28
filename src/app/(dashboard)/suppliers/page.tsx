import Link from "next/link";
import { Pencil } from "lucide-react";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { IconActionLink } from "@/components/shared/icon-action";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listSuppliers } from "@/features/suppliers/queries/supplier-queries";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type SuppliersPageProps = {
  searchParams: Promise<{
    search?: string;
    page?: string;
  }>;
};

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const { search = "", page } = await searchParams;
  const suppliers = await listSuppliers(search);
  const pagination = paginateItems(suppliers, page);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Track supplier records for products, receiving, and later purchase-order workflows."
        actions={
          <Button asChild>
            <Link href="/suppliers/new">New supplier</Link>
          </Button>
        }
      />

      <DataTableCard
        title="Supplier directory"
        description={`${pagination.totalItems} supplier${pagination.totalItems === 1 ? "" : "s"} matched.`}
        toolbar={
          <DataTableFilters
            key={search}
            className="md:grid md:grid-cols-[minmax(0,1fr)]"
            search={{
              value: search,
              placeholder: "Search by supplier, contact person, or contact number",
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
              title="No suppliers found"
              description="Create supplier records now so product procurement references are clean later."
              action={
                <Button asChild>
                  <Link href="/suppliers/new">Create supplier</Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Payment terms</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagination.items.map((supplier) => (
                    <TableRow key={supplier.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-semibold">{supplier.supplierName}</p>
                          <p className="text-sm text-muted-foreground">{supplier.email ?? "No email"}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {supplier.contactPerson ?? "No contact person"}
                        <div className="text-sm text-muted-foreground">
                          {supplier.contactNumber ?? "No contact number"}
                        </div>
                      </TableCell>
                      <TableCell>{supplier.paymentTerms ?? "Not set"}</TableCell>
                      <TableCell className="capitalize">{supplier.status}</TableCell>
                      <TableCell className="w-14 text-right">
                        <IconActionLink
                          href={`/suppliers/${supplier.id}/edit`}
                          label={`Edit supplier ${supplier.supplierName}`}
                          icon={Pencil}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
      </DataTableCard>
    </div>
  );
}
