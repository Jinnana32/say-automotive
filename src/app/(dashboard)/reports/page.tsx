import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InventoryMovementTypeBadge } from "@/features/inventory/components/inventory-status-badge";
import { getReportsPageData } from "@/features/reports/queries/report-queries";
import type { ReportWindow } from "@/features/reports/types";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";

export const dynamic = "force-dynamic";

type ReportsPageProps = {
  searchParams: Promise<{
    window?: ReportWindow;
  }>;
};

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { window = "30d" } = await searchParams;
  const reports = await getReportsPageData(window);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Operational and financial reporting should read directly from quotations, job orders, invoices, payments, POS sales, and the inventory ledger."
        actions={
          <form className="flex items-center gap-3">
            <select
              name="window"
              defaultValue={window}
              className="flex h-11 rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
            <Button type="submit">Apply window</Button>
          </form>
        }
      />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Period performance</h2>
          <p className="text-sm text-muted-foreground">
            Revenue and workflow throughput for the selected reporting window.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reports.performanceMetrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={formatMetric(metric.value, metric.kind)}
              helper={metric.helper}
            />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Current operational snapshot</h2>
          <p className="text-sm text-muted-foreground">
            Live status indicators that should be reviewed regardless of the selected time window.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {reports.operationalMetrics.map((metric) => (
            <MetricCard
              key={metric.label}
              label={metric.label}
              value={formatMetric(metric.value, metric.kind)}
              helper={metric.helper}
            />
          ))}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Status breakdowns</CardTitle>
            <CardDescription>
              Compare quotation and job-order states to spot operational bottlenecks.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <h3 className="font-medium">Quotations</h3>
              {reports.quotationStatusBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No quotations in this window.</p>
              ) : (
                reports.quotationStatusBreakdown.map((item) => (
                  <BreakdownRow key={item.label} label={item.label} value={String(item.count)} />
                ))
              )}
            </div>
            <div className="space-y-3">
              <h3 className="font-medium">Job orders</h3>
              {reports.jobOrderStatusBreakdown.length === 0 ? (
                <p className="text-sm text-muted-foreground">No job orders found.</p>
              ) : (
                reports.jobOrderStatusBreakdown.map((item) => (
                  <BreakdownRow key={item.label} label={item.label} value={String(item.count)} />
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Payment method mix</CardTitle>
            <CardDescription>
              Review how customers are settling invoices in the current reporting window.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.paymentMethodBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No payments have been collected in the selected window.
              </p>
            ) : (
              reports.paymentMethodBreakdown.map((item) => (
                <BreakdownRow
                  key={item.label}
                  label={`${item.label} (${item.count})`}
                  value={formatCurrency(item.amount)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Unpaid invoices</CardTitle>
            <CardDescription>
              Outstanding receivables that still block collection closure or vehicle release.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reports.unpaidInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No unpaid invoices at the moment.</p>
            ) : (
              <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.unpaidInvoices.map((invoice) => (
                      <TableRow key={invoice.invoiceId}>
                        <TableCell className="font-semibold">{invoice.invoiceNumber}</TableCell>
                        <TableCell>{invoice.customerName}</TableCell>
                        <TableCell>{invoice.status.replaceAll("_", " ")}</TableCell>
                        <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                        <TableCell>{formatCurrency(invoice.balance)}</TableCell>
                        <TableCell>{formatDateTime(invoice.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/invoices/${invoice.invoiceId}`}>Open invoice</Link>
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

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Recent stock movements</CardTitle>
            <CardDescription>
              Keep the stock ledger visible while reviewing financial and operational performance.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.recentStockMovements.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stock movements recorded yet.</p>
            ) : (
              reports.recentStockMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="rounded-[1.25rem] border border-border/70 bg-muted/20 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <p className="font-medium">{movement.productName}</p>
                      <div className="flex items-center gap-3">
                        <InventoryMovementTypeBadge type={movement.movementType} />
                        <span className="text-sm text-muted-foreground">
                          Qty {movement.quantity.toFixed(4).replace(/\.?0+$/, "")}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(movement.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardContent className="p-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
        {helper ? <p className="mt-2 text-xs text-muted-foreground">{helper}</p> : null}
      </CardContent>
    </Card>
  );
}

function BreakdownRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
      <p className="capitalize text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function formatMetric(value: number, kind: "count" | "currency" | "quantity") {
  if (kind === "currency") {
    return formatCurrency(value);
  }

  if (kind === "quantity") {
    return value.toFixed(4).replace(/\.?0+$/, "");
  }

  return String(Math.round(value));
}
