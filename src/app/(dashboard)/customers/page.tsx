import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { FormStatusMessage } from "@/components/shared/form-status";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { TableCellLink } from "@/components/shared/table-cell-link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerRowActions } from "@/features/customers/components/customer-row-actions";
import { listCustomers } from "@/features/customers/queries/customer-queries";
import { requireAuthenticatedStaff } from "@/lib/auth/session";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

type CustomersPageProps = {
  searchParams: Promise<{
    search?: string;
    error?: string;
  }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const { search = "", error } = await searchParams;
  const [customers, session] = await Promise.all([listCustomers(search), requireAuthenticatedStaff()]);
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
        title="Customer directory"
        description={`${customers.length} record${customers.length === 1 ? "" : "s"} in the workshop database.`}
        toolbar={
          <form>
            <FilterBar className="md:grid md:grid-cols-[minmax(0,1fr)_auto_auto]">
              <SearchInput
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search customer, mobile number, or email"
              />
              <Button type="submit">Apply</Button>
              <Button asChild type="button" variant="ghost">
                <Link href="/customers">Reset</Link>
              </Button>
            </FilterBar>
          </form>
        }
      >
        {customers.length === 0 ? (
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  {canManageCustomers ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <TableCellLink href={`/customers/${customer.id}`}>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground transition-colors group-hover:text-primary">
                            {customer.displayName}
                          </p>
                          <p className="text-xs text-muted-foreground">{customer.email ?? "No email"}</p>
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
                        {customer.contactNumber ?? "No contact number"}
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
                      <TableCellLink href={`/customers/${customer.id}`} className="text-foreground">
                        {formatDate(customer.createdAt)}
                      </TableCellLink>
                    </TableCell>
                    {canManageCustomers ? (
                      <TableCell className="text-right">
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
          </div>
        )}
      </DataTableCard>
    </div>
  );
}
