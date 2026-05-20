"use client";

import { useState } from "react";
import { useActionState } from "react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { completePosSaleAction } from "@/features/pos/actions/pos-actions";
import type { PosCartItem, PosTerminalData } from "@/features/pos/types";
import { PAYMENT_METHOD_OPTIONS, type PaymentMethod } from "@/features/invoices/types";
import { ProductImage } from "@/features/products/components/product-image";
import { QuickCreateProductDialog } from "@/features/products/components/quick-create-product-dialog";
import {
  addProductToCart,
  calculatePosSubtotal,
  calculatePosTax,
  calculatePosTotal,
  removeCartItem,
  serializePosItems,
  setCartItemQuantity,
  toNumericInput,
} from "@/features/pos/utils";
import {
  formatCurrency,
  formatMoneyInputValue,
  MONEY_INPUT_STEP,
} from "@/lib/currency";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import {
  TableRowActionsMenu,
  TableRowActionsMenuButton,
} from "@/components/shared/table-row-actions-menu";

export function PosTerminal({ terminal }: { terminal: PosTerminalData }) {
  const [state, formAction] = useActionState(completePosSaleAction, INITIAL_FORM_ACTION_STATE);
  const [search, setSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [discount, setDiscount] = useState(formatMoneyInputValue(0));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentTouched, setPaymentTouched] = useState(false);
  const [items, setItems] = useState<PosCartItem[]>([]);
  const [productCatalog, setProductCatalog] = useState(terminal.products);

  const subtotal = calculatePosSubtotal(items);
  const discountValue = toNumericInput(discount);
  const tax = calculatePosTax({
    subtotal,
    discount: discountValue,
    taxRate: terminal.config.defaultTaxRate,
  });
  const total = calculatePosTotal({ subtotal, discount: discountValue, tax });
  const resolvedPaymentAmount =
    terminal.config.allowPartialPayments && paymentTouched
      ? paymentAmount
      : formatMoneyInputValue(total);
  const filteredProducts = productCatalog.filter((product) => {
    const needle = search.trim().toLowerCase();

    if (!needle) {
      return true;
    }

    return [product.name, product.sku ?? "", product.barcode ?? ""]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="itemsJson" value={serializePosItems(items)} />

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{terminal.config.branchCode}</Badge>
              <Badge variant="secondary">
                {terminal.config.enableBarcodeSupport ? "Barcode ready" : "Manual search"}
              </Badge>
            </div>
            <CardTitle>POS product catalog</CardTitle>
            <CardDescription>
              Search parts by name, SKU, or barcode and add them to the checkout cart. Inventory is
              only deducted when the sale is completed.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="productSearch">Search products</Label>
                {terminal.permissions.canCreateProducts ? (
                  <QuickCreateProductDialog
                    triggerLabel="Add new product"
                    onCreated={(product) => {
                      setProductCatalog((current) => [
                        ...current,
                        {
                          id: product.id,
                          name: product.label,
                          sku: product.sku,
                          barcode: product.barcode,
                          imageUrl: product.productImageUrl,
                          unitLabel: product.unitLabel,
                          sellingPrice: product.unitPrice,
                          availableQuantity: 0,
                          reorderLevel: product.reorderLevel,
                          shelfLocation: product.shelfLocation,
                          isLowStock: true,
                        },
                      ]);
                      setSearch(product.label);
                    }}
                  />
                ) : null}
              </div>
              <Input
                id="productSearch"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={
                  terminal.config.enableBarcodeSupport
                    ? "Search by name, SKU, or barcode"
                    : "Search by name or SKU"
                }
              />
            </div>

            <div className="space-y-3">
              {filteredProducts.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No matching products found.
                </p>
              ) : (
                filteredProducts.map((product) => {
                  const inCart = items.find((item) => item.productId === product.id);
                  const addDisabled =
                    product.availableQuantity <= 0 ||
                    (inCart ? inCart.quantity >= product.availableQuantity : false);

                  return (
                    <div
                      key={product.id}
                      className="flex flex-col gap-4 rounded-[1.25rem] border border-border/70 bg-muted/20 p-4 md:flex-row md:items-start md:justify-between"
                    >
                      <div className="flex gap-4">
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          className="hidden size-16 shrink-0 md:flex"
                          fallbackLabel="Photo"
                        />
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{product.name}</p>
                            {product.isLowStock ? <Badge variant="warning">Low stock</Badge> : null}
                            {product.availableQuantity <= 0 ? (
                              <Badge variant="destructive">Out of stock</Badge>
                            ) : null}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {product.sku ?? "No SKU"}
                            {product.barcode ? ` · ${product.barcode}` : ""}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {product.unitLabel} · Shelf {product.shelfLocation ?? "Not set"} · Available{" "}
                            {product.availableQuantity}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <p className="font-semibold">{formatCurrency(product.sellingPrice)}</p>
                        <Button
                          type="button"
                          onClick={() => setItems((current) => addProductToCart(current, product))}
                          disabled={addDisabled}
                        >
                          {product.availableQuantity <= 0 ? "No stock" : "Add"}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Checkout</CardTitle>
              <CardDescription>
                Completing this sale creates the sales record, stock movements, invoice, and
                payment in one transaction.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormStatusMessage message={state.message} />

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customerId">Customer</Label>
                  <select
                    id="customerId"
                    name="customerId"
                    value={customerId}
                    onChange={(event) => setCustomerId(event.target.value)}
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Walk-in customer</option>
                    {terminal.customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.label}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={state.fieldErrors} name="customerId" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Discount amount</Label>
                  <Input
                    id="discount"
                    name="discount"
                    inputMode="decimal"
                    type="number"
                    step={MONEY_INPUT_STEP}
                    value={discount}
                    onChange={(event) => setDiscount(event.target.value)}
                  />
                  <FieldError errors={state.fieldErrors} name="discount" />
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.25rem] border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                          Add products from the catalog to start a POS sale.
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.sku ?? "No SKU"} · Available {item.availableQuantity}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="w-[160px]">
                            <Input
                              inputMode="decimal"
                              type="number"
                              step={MONEY_INPUT_STEP}
                              value={String(item.quantity)}
                              onChange={(event) => {
                                if (event.target.value === "") {
                                  return;
                                }

                                const nextQuantity = Number(event.target.value);

                                if (!Number.isFinite(nextQuantity)) {
                                  return;
                                }

                                setItems((current) =>
                                  setCartItemQuantity(current, item.productId, nextQuantity),
                                );
                              }}
                            />
                          </TableCell>
                          <TableCell>{formatCurrency(item.quantity * item.unitPrice)}</TableCell>
                          <TableCell className="text-right">
                            <TableRowActionsMenu label={`Cart actions for ${item.name}`}>
                              <TableRowActionsMenuButton
                                label="Remove item"
                                tone="destructive"
                                onSelect={() =>
                                  setItems((current) => removeCartItem(current, item.productId))
                                }
                              />
                            </TableRowActionsMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <FieldError errors={state.fieldErrors} name="items" />
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle>Payment and totals</CardTitle>
              <CardDescription>
                Tax uses the branch default rate of {terminal.config.defaultTaxRate}%.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 rounded-[1.25rem] border border-border/70 bg-muted/20 p-4 text-sm">
                <SummaryRow label="Subtotal" value={formatCurrency(subtotal)} />
                <SummaryRow label="Discount" value={formatCurrency(discountValue)} />
                <SummaryRow
                  label={`Tax (${terminal.config.defaultTaxRate}%)`}
                  value={formatCurrency(tax)}
                />
                <SummaryRow label="Total" value={formatCurrency(total)} emphasized />
              </div>

              <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                {terminal.config.allowPartialPayments
                  ? "Partial payments are enabled for this branch."
                  : "Partial payments are disabled. POS checkout must settle the full sale total."}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="paymentAmount">Payment amount</Label>
                  <Input
                    id="paymentAmount"
                    name="paymentAmount"
                    inputMode="decimal"
                    type="number"
                    step={MONEY_INPUT_STEP}
                    value={resolvedPaymentAmount}
                    readOnly={!terminal.config.allowPartialPayments}
                    onChange={(event) => {
                      setPaymentTouched(true);
                      setPaymentAmount(event.target.value);
                    }}
                  />
                  <FieldError errors={state.fieldErrors} name="paymentAmount" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment method</Label>
                  <select
                    id="paymentMethod"
                    name="paymentMethod"
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(event.target.value as PaymentMethod)
                    }
                    className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <FieldError errors={state.fieldErrors} name="paymentMethod" />
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference number</Label>
                  <Input id="referenceNumber" name="referenceNumber" />
                  <FieldError errors={state.fieldErrors} name="referenceNumber" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Sale notes</Label>
                  <Textarea id="notes" name="notes" />
                  <FieldError errors={state.fieldErrors} name="notes" />
                </div>
              </div>

              {terminal.config.receiptFooter ? (
                <div className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                  Receipt footer: {terminal.config.receiptFooter}
                </div>
              ) : null}

              <div className="flex justify-end">
                <SubmitButton
                  pendingLabel="Completing sale..."
                  disabled={items.length === 0 || total <= 0}
                >
                  Complete sale
                </SubmitButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </form>
  );
}

function SummaryRow({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <p className={emphasized ? "font-semibold" : "text-muted-foreground"}>{label}</p>
      <p className={emphasized ? "text-base font-semibold" : "font-medium"}>{value}</p>
    </div>
  );
}
