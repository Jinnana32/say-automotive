import Link from "next/link";

import { DataTableCard } from "@/components/shared/data-table-card";
import { DataTableScroll } from "@/components/shared/data-table-scroll";
import { EmptyState } from "@/components/shared/empty-state";
import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceStatusBadge, PaymentMethodBadge } from "@/features/invoices/components/invoice-status-badge";
import { PosTerminal } from "@/features/pos/components/pos-terminal";
import { listRecentPosSales, getPosTerminalData } from "@/features/pos/queries/pos-queries";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  const [terminal, recentSales] = await Promise.all([getPosTerminalData(), listRecentPosSales()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Point of Sale"
        description="Direct parts sales with immediate stock, invoice, and payment recording."
        actions={
          <Button asChild variant="outline">
            <Link href="/invoices">Review invoices</Link>
          </Button>
        }
      />

      <MetricGrid className="xl:grid-cols-4">
        <StatCard
          title="Sellable products"
          value={String(terminal.products.length)}
          description="Products available in the POS catalog"
        />
        <StatCard
          title="Customer options"
          value={String(terminal.customers.length)}
          description="Saved customers plus walk-in support"
        />
        <StatCard
          title="Default tax"
          value={`${terminal.config.defaultTaxRate}%`}
          description="Applied to direct sales totals"
        />
        <StatCard
          title="Payment policy"
          value={terminal.config.allowPartialPayments ? "Flexible" : "Full only"}
          description={terminal.config.enableBarcodeSupport ? "Barcode-enabled checkout" : "Manual product lookup"}
          tone={terminal.config.allowPartialPayments ? "warning" : "success"}
        />
      </MetricGrid>

      <PosTerminal terminal={terminal} />

      <DataTableCard
        title="Recent completed sales"
        description="Latest POS transactions and their invoice/payment state."
      >
          {recentSales.length === 0 ? (
            <EmptyState
              title="No POS sales yet"
              description="Completed sales will appear here once the first checkout is processed."
            />
          ) : (
            <DataTableScroll>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sale</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-semibold">{sale.saleNumber}</TableCell>
                      <TableCell>{sale.customerName}</TableCell>
                      <TableCell>{sale.invoiceNumber ?? "No invoice"}</TableCell>
                      <TableCell>
                        {sale.invoiceStatus ? <InvoiceStatusBadge status={sale.invoiceStatus} /> : "N/A"}
                      </TableCell>
                      <TableCell>
                        {sale.paymentMethod ? (
                          <PaymentMethodBadge method={sale.paymentMethod} />
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell>{formatCurrency(sale.totalAmount)}</TableCell>
                      <TableCell>{formatDateTime(sale.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {sale.invoiceId ? (
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/invoices/${sale.invoiceId}`}>Open invoice</Link>
                          </Button>
                        ) : (
                          "N/A"
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
