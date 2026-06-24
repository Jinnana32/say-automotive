"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useState } from "react";

import {
  FieldError,
  FormRequiredFieldsNote,
  FormStatusMessage,
  fieldAriaProps,
  fieldControlClassName,
  fieldErrorId,
  formSelectClassName,
} from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { useFormValues } from "@/lib/use-form-values";
import { createProductAction, updateProductAction } from "@/features/products/actions/product-actions";
import { ProductImage } from "@/features/products/components/product-image";
import type { ProductFormValues, ReferenceOption } from "@/features/products/types";
import { MONEY_INPUT_STEP } from "@/lib/currency";

export function ProductForm({
  mode,
  initialValues,
  categories,
  brands,
  suppliers,
  units,
  branches,
  permissions,
  initialImagePreviewUrl = null,
}: {
  mode: "create" | "edit";
  initialValues: ProductFormValues;
  categories: ReferenceOption[];
  brands: ReferenceOption[];
  suppliers: ReferenceOption[];
  units: ReferenceOption[];
  branches: ReferenceOption[];
  permissions: {
    canMarkGlobal: boolean;
    canSelectOwningBranch: boolean;
  };
  initialImagePreviewUrl?: string | null;
}) {
  const [state, formAction] = useActionState(
    mode === "create" ? createProductAction : updateProductAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues(initialValues);
  const [uploadedImagePreviewUrl, setUploadedImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (uploadedImagePreviewUrl) {
        URL.revokeObjectURL(uploadedImagePreviewUrl);
      }
    };
  }, [uploadedImagePreviewUrl]);

  const resolvedPreviewImageUrl = useMemo(() => {
    if (uploadedImagePreviewUrl) {
      return uploadedImagePreviewUrl;
    }

    if (values.productImageUrl.trim()) {
      return values.productImageUrl.trim();
    }

    return initialValues.productImageUrl.trim() === values.productImageUrl.trim()
      ? initialImagePreviewUrl
      : null;
  }, [
    initialImagePreviewUrl,
    initialValues.productImageUrl,
    uploadedImagePreviewUrl,
    values.productImageUrl,
  ]);

  return (
    <form action={formAction} className="space-y-6">
      {initialValues.productId ? <input type="hidden" name="productId" value={initialValues.productId} /> : null}
      {!permissions.canSelectOwningBranch ? (
        <input type="hidden" name="owningBranchId" value={values.owningBranchId} />
      ) : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{mode === "create" ? "Product record" : "Edit product"}</CardTitle>
          <CardDescription>
            Products store catalog and pricing data. Inventory quantity stays in stock tables and
            should not be edited here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormRequiredFieldsNote />
          <FormStatusMessage message={state.message} />

          <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
            <div className="space-y-1">
              <h3 className="font-semibold">Catalog ownership</h3>
              <p className="text-sm text-muted-foreground">
                Branches own their own catalog items by default. Global items can be reused by
                other branches only when their branch settings allow it.
              </p>
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="owningBranchId">Owning branch</Label>
                <select
                  id="owningBranchId"
                  name="owningBranchId"
                  value={values.owningBranchId}
                  disabled={!permissions.canSelectOwningBranch}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-70"
                  onChange={(event) => updateFormValue("owningBranchId", event.target.value)}
                >
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.label}
                    </option>
                  ))}
                </select>
                <FieldError errors={state.fieldErrors} name="owningBranchId" />
              </div>

              <div className="space-y-2">
                <Label>Catalog visibility</Label>
                {permissions.canMarkGlobal ? (
                  <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-background px-4 py-3">
                    <input
                      type="checkbox"
                      name="shareGlobally"
                      checked={values.shareGlobally}
                      onChange={(event) => updateFormValue("shareGlobally", event.target.checked)}
                      className="mt-1 size-4 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/25"
                    />
                    <div className="space-y-1">
                      <p className="font-medium">Share globally</p>
                      <p className="text-sm text-muted-foreground">
                        When enabled, other branches can see this product if their global product
                        catalog setting is enabled.
                      </p>
                    </div>
                  </label>
                ) : (
                  <div className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-muted-foreground">
                    This product will stay branch-owned. Only owner and admin roles can share
                    catalog items globally.
                    <input type="hidden" name="shareGlobally" value="" />
                  </div>
                )}
                <FieldError errors={state.fieldErrors} name="shareGlobally" />
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name" required>Product name</Label>
              <Input
                id="name"
                name="name"
                value={values.name}
                className={fieldControlClassName(state.fieldErrors, "name")}
                {...fieldAriaProps({ errors: state.fieldErrors, name: "name", required: true, errorId: fieldErrorId("name") })}
                onChange={(event) => updateFormValue("name", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="name" id={fieldErrorId("name")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="productType" required>Product type</Label>
              <select
                id="productType"
                name="productType"
                value={values.productType}
                className={formSelectClassName(state.fieldErrors, "productType")}
                {...fieldAriaProps({ errors: state.fieldErrors, name: "productType", required: true, errorId: fieldErrorId("productType") })}
                onChange={(event) => updateFormValue("productType", event.target.value as ProductFormValues["productType"])}
              >
                <option value="part">Part</option>
                <option value="fluid">Fluid</option>
                <option value="consumable">Consumable</option>
                <option value="accessory">Accessory</option>
                <option value="tool">Tool</option>
              </select>
              <FieldError errors={state.fieldErrors} name="productType" id={fieldErrorId("productType")} />
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
              <Label htmlFor="unitId" required>Base unit</Label>
              <select
                id="unitId"
                name="unitId"
                value={values.unitId}
                className={formSelectClassName(state.fieldErrors, "unitId")}
                {...fieldAriaProps({ errors: state.fieldErrors, name: "unitId", required: true, errorId: fieldErrorId("unitId") })}
                onChange={(event) => updateFormValue("unitId", event.target.value)}
              >
                <option value="">Select unit</option>
                {units.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError errors={state.fieldErrors} name="unitId" id={fieldErrorId("unitId")} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <SelectField
              name="categoryId"
              label="Category"
              value={values.categoryId}
              options={categories}
              errors={state.fieldErrors}
              onChange={(value) => updateFormValue("categoryId", value)}
            />
            <SelectField
              name="brandId"
              label="Brand"
              value={values.brandId}
              options={brands}
              errors={state.fieldErrors}
              onChange={(value) => updateFormValue("brandId", value)}
            />
            <SelectField
              name="supplierId"
              label="Supplier"
              value={values.supplierId}
              options={suppliers}
              errors={state.fieldErrors}
              onChange={(value) => updateFormValue("supplierId", value)}
            />
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
            <NumberField name="costPrice" label="Cost price" value={values.costPrice} errors={state.fieldErrors} onChange={(value) => updateFormValue("costPrice", value)} step={MONEY_INPUT_STEP} required />
            <NumberField name="sellingPrice" label="Selling price" value={values.sellingPrice} errors={state.fieldErrors} onChange={(value) => updateFormValue("sellingPrice", value)} step={MONEY_INPUT_STEP} required />
            <NumberField name="reorderLevel" label="Reorder level" value={values.reorderLevel} errors={state.fieldErrors} onChange={(value) => updateFormValue("reorderLevel", value)} step={MONEY_INPUT_STEP} required />
            <NumberField name="warrantyDurationDays" label="Warranty days" value={values.warrantyDurationDays} errors={state.fieldErrors} onChange={(value) => updateFormValue("warrantyDurationDays", value)} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shelfLocation">Shelf location</Label>
              <Input id="shelfLocation" name="shelfLocation" value={values.shelfLocation} onChange={(event) => updateFormValue("shelfLocation", event.target.value)} />
              <FieldError errors={state.fieldErrors} name="shelfLocation" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" required>Status</Label>
              <select
                id="status"
                name="status"
                value={values.status}
                className={formSelectClassName(state.fieldErrors, "status")}
                {...fieldAriaProps({ errors: state.fieldErrors, name: "status", required: true, errorId: fieldErrorId("status") })}
                onChange={(event) => updateFormValue("status", event.target.value as ProductFormValues["status"])}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <FieldError errors={state.fieldErrors} name="status" id={fieldErrorId("status")} />
            </div>
          </div>

          <div className="grid gap-6 rounded-2xl border border-border/70 bg-muted/20 p-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold">Product photo</h3>
                <p className="text-sm text-muted-foreground">
                  Use a real product shot for faster lookup in POS and catalog maintenance.
                </p>
              </div>
              <ProductImage
                src={resolvedPreviewImageUrl}
                alt={values.name || "Product photo preview"}
                className="aspect-square w-full max-w-[220px]"
                imageClassName="aspect-square"
              />
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="productImage">Upload photo</Label>
                <Input
                  id="productImage"
                  name="productImage"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;

                    if (uploadedImagePreviewUrl) {
                      URL.revokeObjectURL(uploadedImagePreviewUrl);
                    }

                    setUploadedImagePreviewUrl(file ? URL.createObjectURL(file) : null);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, or WEBP up to 5 MB. Uploading a file overrides the external image URL.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="productImageUrl">External image URL</Label>
                <Input
                  id="productImageUrl"
                  name="productImageUrl"
                  value={values.productImageUrl}
                  placeholder="https://..."
                  onChange={(event) => updateFormValue("productImageUrl", event.target.value)}
                />
                <FieldError errors={state.fieldErrors} name="productImageUrl" />
              </div>
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
                required
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
              <Label htmlFor="websiteShortDescription" required={values.websiteVisible}>
                Public short description
              </Label>
              <Textarea
                id="websiteShortDescription"
                name="websiteShortDescription"
                value={values.websiteShortDescription}
                placeholder="Short website copy focused on fitment, quality, or value."
                className={fieldControlClassName(state.fieldErrors, "websiteShortDescription")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "websiteShortDescription",
                  required: values.websiteVisible,
                  errorId: fieldErrorId("websiteShortDescription"),
                })}
                onChange={(event) => updateFormValue("websiteShortDescription", event.target.value)}
              />
              <FieldError errors={state.fieldErrors} name="websiteShortDescription" id={fieldErrorId("websiteShortDescription")} />
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
  errors,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  options: ReferenceOption[];
  errors?: Record<string, string[] | undefined>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        value={value}
        className={formSelectClassName(errors, name)}
        {...fieldAriaProps({
          errors,
          name,
          required: false,
          errorId: fieldErrorId(name),
        })}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">None</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <FieldError errors={errors} name={name} id={fieldErrorId(name)} />
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
  required,
}: {
  name: string;
  label: string;
  value: string;
  errors?: Record<string, string[] | undefined>;
  onChange: (value: string) => void;
  step?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} required={required}>{label}</Label>
      <Input
        id={name}
        name={name}
        type="number"
        step={step}
        inputMode="decimal"
        value={value}
        className={fieldControlClassName(errors, name)}
        {...fieldAriaProps({
          errors,
          name,
          required: required ?? false,
          errorId: fieldErrorId(name),
        })}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError errors={errors} name={name} id={fieldErrorId(name)} />
    </div>
  );
}
