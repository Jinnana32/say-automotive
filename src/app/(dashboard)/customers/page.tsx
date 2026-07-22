import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableScroll } from "@/components/shared/data-table-scroll";
import { DataTableFilters } from "@/components/shared/data-table-filters";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { EmptyState } from "@/components/shared/empty-state";
import { FormStatusMessage } from "@/components/shared/form-status";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerRowActions } from "@/features/customers/components/customer-row-actions";
import { listCustomers } from "@/features/customers/queries/customer-queries";
import type { CustomerListItem } from "@/features/customers/types";
import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { formatDate } from "@/lib/dates";
import { paginateItems } from "@/lib/pagination";

export const dynamic = "force-dynamic";

type CustomersPageProps = {
  searchParams: Promise<{
    search?: string;
    status?: "active" | "inactive" | "";
    page?: string;
    error?: string;
  }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const { search = "", status = "active", page, error } = await searchParams;
  const [customers, session] = await Promise.all([
    listCustomers(search, { status }),
    requireAuthenticatedStaff(),
  ]);
  const pagination = paginateItems(customers, page);
  const canManageCustomers = session.capabilities.includes("customers:write");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Customer records used across quotations, job orders, and service history."
        actions={canManageCustomers ? (
          <Button asChild>
            <Link href="/customers/new">New customer</Link>
          </Button>
        ) : null}
      />

      <FormStatusMessage message={error} />

      <DataTableCard
        toolbar={
          <DataTableFilters
            key={`${search}:${status}`}
            className="lg:grid lg:grid-cols-[minmax(0,1fr)_200px]"
            search={{
              value: search,
              placeholder: "Search customer, mobile number, or email",
            }}
            filters={[
              {
                type: "select",
                name: "status",
                value: status,
                options: [
                  { value: "active", label: "Active" },
                  { value: "inactive", label: "Inactive / merged" },
                  { value: "", label: "All statuses" },
                ],
              },
            ]}
          />
        }
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
            title="No customers found"
            description="Add the first customer to start linking vehicles and workshop documents."
            action={canManageCustomers ? (
              <Button asChild>
                <Link href="/customers/new">Create customer</Link>
              </Button>
            ) : null}
          />
        ) : (
          <DataTableScroll minWidthClassName="min-w-[52rem]">
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[34%]">Customer</TableHead>
                  <TableHead className="w-[12%]">Type</TableHead>
                  <TableHead className="w-[24%]">Contact</TableHead>
                  <TableHead className="w-[12%]">Status</TableHead>
                  <TableHead className="w-[12%]">Created</TableHead>
                  {canManageCustomers ? <TableHead className="w-14 text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <TableCellLink href={`/customers/${customer.id}`}>
                        <div className="min-w-0 space-y-1">
                          <p className="truncate font-medium text-foreground transition-colors group-hover:text-primary">
                            {customer.displayName}
                          </p>
                          {customer.email ? (
                            <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
                          ) : null}
                        </div>
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink
                        href={`/customers/${customer.id}`}
                        className="capitalize text-foreground"
                      >
                        {customer.customerType.replace("_", " ")}
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/customers/${customer.id}`} className="text-foreground">
                        <span className="block truncate">
                          {formatCustomerContactNumbers(customer)}
                        </span>
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/customers/${customer.id}`}>
                        <StatusBadge tone={customer.status === "active" ? "success" : "neutral"}>
                          {customer.status}
                        </StatusBadge>
                      </TableCellLink>
                    </TableCell>
                    <TableCell>
                      <TableCellLink href={`/customers/${customer.id}`} className="whitespace-nowrap text-foreground">
                        {formatDate(customer.createdAt)}
                      </TableCellLink>
                    </TableCell>
                    {canManageCustomers ? (
                      <TableCell className="w-14 text-right">
                        <CustomerRowActions
                          customerId={customer.id}
                          customerLabel={customer.displayName}
                        />
                      </TableCell>
                    ) : null}
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

function formatCustomerContactNumbers(customer: CustomerListItem) {
  if (!customer.contactNumber && !customer.contactNumberSecondary) {
    return "—";
  }

  if (customer.contactNumber && customer.contactNumberSecondary) {
    return `${customer.contactNumber} · ${customer.contactNumberSecondary}`;
  }

  return customer.contactNumber ?? customer.contactNumberSecondary ?? "—";
}
