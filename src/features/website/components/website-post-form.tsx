"use client";

import Link from "next/link";
import { useActionState } from "react";

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
import {
  createWebsitePostAction,
  updateWebsitePostAction,
} from "@/features/website/actions/website-actions";
import type { WebsitePostFormValues } from "@/features/website/types";

export function WebsitePostForm({
  mode,
  initialValues,
}: {
  mode: "create" | "edit";
  initialValues: WebsitePostFormValues;
}) {
  const [state, formAction] = useActionState(
    mode === "create" ? createWebsitePostAction : updateWebsitePostAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues(initialValues);

  return (
    <form action={formAction} className="space-y-6">
      {values.postId ? <input type="hidden" name="postId" value={values.postId} /> : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>{mode === "create" ? "New journal post" : "Edit journal post"}</CardTitle>
          <CardDescription>
            Use this for owner work updates, promos, and maintenance tips that should appear on the
            public website.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FormRequiredFieldsNote />
          <FormStatusMessage message={state.message} />

          <div className="grid gap-6 md:grid-cols-2">
            <TextField
              name="title"
              label="Title"
              value={values.title}
              errors={state.fieldErrors}
              required
              onChange={(value) => updateFormValue("title", value)}
            />
            <TextField
              name="slug"
              label="Slug"
              value={values.slug}
              errors={state.fieldErrors}
              placeholder="auto-generated-from-title"
              onChange={(value) => updateFormValue("slug", value)}
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category" required>
                Category
              </Label>
              <select
                id="category"
                name="category"
                value={values.category}
                className={formSelectClassName(state.fieldErrors, "category")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "category",
                  required: true,
                  errorId: fieldErrorId("category"),
                })}
                onChange={(event) => updateFormValue("category", event.target.value as WebsitePostFormValues["category"])}
              >
                <option value="shop_update">Shop update</option>
                <option value="maintenance_tip">Maintenance tip</option>
                <option value="promo">Promo</option>
              </select>
              <FieldError errors={state.fieldErrors} name="category" id={fieldErrorId("category")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" required>
                Status
              </Label>
              <select
                id="status"
                name="status"
                value={values.status}
                className={formSelectClassName(state.fieldErrors, "status")}
                {...fieldAriaProps({
                  errors: state.fieldErrors,
                  name: "status",
                  required: true,
                  errorId: fieldErrorId("status"),
                })}
                onChange={(event) => updateFormValue("status", event.target.value as WebsitePostFormValues["status"])}
              >
                <option value="active">Published</option>
                <option value="inactive">Draft</option>
              </select>
              <FieldError errors={state.fieldErrors} name="status" id={fieldErrorId("status")} />
            </div>
          </div>

          <TextField
            name="coverImageUrl"
            label="Cover image URL"
            value={values.coverImageUrl}
            errors={state.fieldErrors}
            placeholder="https://..."
            onChange={(value) => updateFormValue("coverImageUrl", value)}
          />

          <div className="space-y-2">
            <Label htmlFor="excerpt" required>
              Excerpt
            </Label>
            <Textarea
              id="excerpt"
              name="excerpt"
              value={values.excerpt}
              rows={3}
              onChange={(event) => updateFormValue("excerpt", event.target.value)}
              className={fieldControlClassName(state.fieldErrors, "excerpt")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "excerpt",
                required: true,
                errorId: fieldErrorId("excerpt"),
              })}
            />
            <FieldError errors={state.fieldErrors} name="excerpt" id={fieldErrorId("excerpt")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" required>
              Content
            </Label>
            <Textarea
              id="content"
              name="content"
              value={values.content}
              rows={12}
              onChange={(event) => updateFormValue("content", event.target.value)}
              className={fieldControlClassName(state.fieldErrors, "content")}
              {...fieldAriaProps({
                errors: state.fieldErrors,
                name: "content",
                required: true,
                errorId: fieldErrorId("content"),
              })}
            />
            <FieldError errors={state.fieldErrors} name="content" id={fieldErrorId("content")} />
          </div>

          <label className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
            <input
              type="checkbox"
              name="isFeatured"
              checked={values.isFeatured}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-ring"
              onChange={(event) => updateFormValue("isFeatured", event.target.checked)}
            />
            <span className="space-y-1">
              <span className="block font-medium">Feature this post</span>
              <span className="block text-sm text-muted-foreground">
                Featured posts appear higher on the public homepage and journal page.
              </span>
            </span>
          </label>

          <div className="flex flex-wrap gap-3">
            <SubmitButton pendingLabel={mode === "create" ? "Saving..." : "Updating..."}>
              {mode === "create" ? "Create post" : "Save changes"}
            </SubmitButton>
            <Button asChild variant="outline" type="button">
              <Link href="/settings/website/journal">Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function TextField({
  name,
  label,
  value,
  errors,
  placeholder,
  required = false,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  errors?: Record<string, string[] | undefined>;
  placeholder?: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={fieldControlClassName(errors, name)}
        {...fieldAriaProps({
          errors,
          name,
          required,
          errorId: fieldErrorId(name),
        })}
      />
      <FieldError errors={errors} name={name} id={fieldErrorId(name)} />
    </div>
  );
}
