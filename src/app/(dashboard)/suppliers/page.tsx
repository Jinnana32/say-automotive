import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TableRowActionsMenu,
  TableRowActionsMenuLink,
} from "@/components/shared/table-row-actions-menu";
import { listSuppliers } from "@/features/suppliers/queries/supplier-queries";

export const dynamic = "force-dynamic";

type SuppliersPageProps = {
  searchParams: Promise<{
    search?: string;
  }>;
};

export default async function SuppliersPage({ searchParams }: SuppliersPageProps) {
  const { search = "" } = await searchParams;
  const suppliers = await listSuppliers(search);

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

      <Card className="border-border/70 shadow-sm">
        <CardContent className="space-y-4 p-6">
          <form className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              type="search"
              name="search"
              defaultValue={search}
              placeholder="Search by supplier, contact person, or contact number"
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit">Search</Button>
          </form>

          {suppliers.length === 0 ? (
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
            <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
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
                  {suppliers.map((supplier) => (
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
                      <TableCell className="text-right">
                        <TableRowActionsMenu label={`Supplier actions for ${supplier.supplierName}`}>
                          <TableRowActionsMenuLink
                            href={`/suppliers/${supplier.id}/edit`}
                            label="Edit supplier"
                          />
                        </TableRowActionsMenu>
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
