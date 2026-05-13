"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";
import { createProductAction, updateProductAction } from "@/features/products/actions/product-actions";
import type { ProductFormValues, ReferenceOption } from "@/features/products/types";
import { MONEY_INPUT_STEP } from "@/lib/currency";

export function ProductForm({
  mode,
  initialValues,
  categories,
  brands,
  suppliers,
  units,
}: {
  mode: "create" | "edit";
  initialValues: ProductFormValues;
  categories: ReferenceOption[];
  brands: ReferenceOption[];
  suppliers: ReferenceOption[];
  units: ReferenceOption[];
}) {
  const [state, formAction] = useActionState(
    mode === "create" ? createProductAction : updateProductAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues(initialValues);

  return (
    <form action={formAction} className="space-y-6">
      {initialValues.productId ? <input type="hidden" name="productId" value={initialValues.productId} /> : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Product record" : "Edit product"}</CardTitle>
          <CardDescription>
            Products store catalog and pricing data. Inventory quantity stays in stock tables and
            should not be edited here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormStatusMessage message={state.message} />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Product name</Label>
              <Input id="name" name="name" value={values.name} onChange={(event) => updateFormValue("name", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productType">Product type</Label>
              <select
                id="productType"
                name="productType"
                value={values.productType}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => updateFormValue("productType", event.target.value as ProductFormValues["productType"])}
              >
                <option value="part">Part</option>
                <option value="fluid">Fluid</option>
                <option value="consumable">Consumable</option>
                <option value="accessory">Accessory</option>
                <option value="tool">Tool</option>
              </select>
              <FieldError errors={state.fieldErrors} name="productType" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" value={values.sku} onChange={(event) => updateFormValue("sku", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="sku" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input id="barcode" name="barcode" value={values.barcode} onChange={(event) => updateFormValue("barcode", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="barcode" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitId">Base unit</Label>
              <select
                id="unitId"
                name="unitId"
                value={values.unitId}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => updateFormValue("unitId", event.target.value)}
              >
                <option value="">Select unit</option>
                {units.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError errors={state.fieldErrors} name="unitId" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <SelectField name="categoryId" label="Category" value={values.categoryId} options={categories} onChange={(value) => updateFormValue("categoryId", value)} />
            <SelectField name="brandId" label="Brand" value={values.brandId} options={brands} onChange={(value) => updateFormValue("brandId", value)} />
            <SelectField name="supplierId" label="Supplier" value={values.supplierId} options={suppliers} onChange={(value) => updateFormValue("supplierId", value)} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="partNumber">Part number</Label>
              <Input id="partNumber" name="partNumber" value={values.partNumber} onChange={(event) => updateFormValue("partNumber", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="partNumber" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="oemNumber">OEM number</Label>
              <Input id="oemNumber" name="oemNumber" value={values.oemNumber} onChange={(event) => updateFormValue("oemNumber", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="oemNumber" />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            <NumberField name="costPrice" label="Cost price" value={values.costPrice} errors={state.fieldErrors} onChange={(value) => updateFormValue("costPrice", value)} step={MONEY_INPUT_STEP} />
            <NumberField name="sellingPrice" label="Selling price" value={values.sellingPrice} errors={state.fieldErrors} onChange={(value) => updateFormValue("sellingPrice", value)} step={MONEY_INPUT_STEP} />
            <NumberField name="reorderLevel" label="Reorder level" value={values.reorderLevel} errors={state.fieldErrors} onChange={(value) => updateFormValue("reorderLevel", value)} step={MONEY_INPUT_STEP} />
            <NumberField name="warrantyDurationDays" label="Warranty days" value={values.warrantyDurationDays} errors={state.fieldErrors} onChange={(value) => updateFormValue("warrantyDurationDays", value)} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shelfLocation">Shelf location</Label>
              <Input id="shelfLocation" name="shelfLocation" value={values.shelfLocation} onChange={(event) => updateFormValue("shelfLocation", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="shelfLocation" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                value={values.status}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => updateFormValue("status", event.target.value as ProductFormValues["status"])}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <FieldError errors={state.fieldErrors} name="status" />
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
            <div className="space-y-1">
              <h3 className="font-semibold">Website merchandising</h3>
              <p className="text-sm text-muted-foreground">
                Publish selected products to the public website without creating a separate catalog.
              </p>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3">
                <input
                  type="checkbox"
                  name="websiteVisible"
                  checked={values.websiteVisible}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  onChange={(event) => updateFormValue("websiteVisible", event.target.checked)}
                />
                <span className="space-y-1">
                  <span className="block font-medium">Show on public website</span>
                  <span className="block text-sm text-muted-foreground">
                    Published products appear in the public catalog and homepage showcases.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3">
                <input
                  type="checkbox"
                  name="websiteFeatured"
                  checked={values.websiteFeatured}
                  className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  onChange={(event) => updateFormValue("websiteFeatured", event.target.checked)}
                />
                <span className="space-y-1">
                  <span className="block font-medium">Feature on homepage</span>
                  <span className="block text-sm text-muted-foreground">
                    Use this for hero merchandising like tires, batteries, and fast-moving items.
                  </span>
                </span>
              </label>
            </div>

            <FieldError errors={state.fieldErrors} name="websiteFeatured" />

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="websiteSlug">Website slug</Label>
                <Input
                  id="websiteSlug"
                  name="websiteSlug"
                  value={values.websiteSlug}
                  placeholder="auto-generated-from-name"
                  onChange={(event) => updateFormValue("websiteSlug", event.target.value)}
                />
                <FieldError errors={state.fieldErrors} name="websiteSlug" />
              </div>

              <NumberField
                name="websiteSortOrder"
                label="Website sort order"
                value={values.websiteSortOrder}
                errors={state.fieldErrors}
                onChange={(value) => updateFormValue("websiteSortOrder", value)}
              />
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="websiteBadge">Website badge</Label>
                <Input
                  id="websiteBadge"
                  name="websiteBadge"
                  value={values.websiteBadge}
                  placeholder="Best seller, Tire package, New arrival"
                  onChange={(event) => updateFormValue("websiteBadge", event.target.value)}
                />
                <FieldError errors={state.fieldErrors} name="websiteBadge" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="websiteImageUrl">Feature image URL</Label>
                <Input
                  id="websiteImageUrl"
                  name="websiteImageUrl"
                  value={values.websiteImageUrl}
                  placeholder="https://..."
                  onChange={(event) => updateFormValue("websiteImageUrl", event.target.value)}
                />
                <FieldError errors={state.fieldErrors} name="websiteImageUrl" />
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <Label htmlFor="websiteShortDescription">Public short description</Label>
              <Textarea
                id="websiteShortDescription"
                name="websiteShortDescription"
                value={values.websiteShortDescription}
                placeholder="Short website copy focused on fitment, quality, or value."
                onChange={(event) => updateFormValue("websiteShortDescription", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="websiteShortDescription" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={values.description} onChange={(event) => updateFormValue("description", event.target.value)} />
            <FieldError errors={state.fieldErrors} name="description" />
          </div>

          <div className="flex flex-wrap gap-3">
            <SubmitButton pendingLabel={mode === "create" ? "Creating..." : "Saving..."}>
              {mode === "create" ? "Create product" : "Save changes"}
            </SubmitButton>
            <Button asChild variant="outline" type="button">
              <Link href="/products">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function SelectField({
  name,
  label,
  value,
  options,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  options: ReferenceOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        value={value}
        className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">None</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberField({
  name,
  label,
  value,
  errors,
  onChange,
  step,
}: {
  name: string;
  label: string;
  value: string;
  errors?: Record<string, string[] | undefined>;
  onChange: (value: string) => void;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type="number" step={step} inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} />
      <FieldError errors={errors} name={name} />
    </div>
  );
}
