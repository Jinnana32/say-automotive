"use client";

import { useActionState } from "react";
import { CarFront, type LucideIcon, MapPin, UserRound, Wrench } from "lucide-react";

import { FieldError, FormStatusMessage } from "@/components/shared/form-status";
import { SubmitButton } from "@/components/shared/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitWebsiteQuoteRequestAction } from "@/features/website/actions/website-actions";
import { websiteCardVariants } from "@/features/website/components/website-card-variants";
import type {
  WebsiteQuoteFormOptionData,
  WebsiteQuoteRequestFormValues,
} from "@/features/website/types";
import { INITIAL_FORM_ACTION_STATE } from "@/lib/forms";
import { cn } from "@/lib/utils";
import { useFormValues } from "@/lib/use-form-values";

const FIELD_CLASS_NAME =
  "h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] placeholder:text-slate-400 focus-visible:border-brand-red/70 focus-visible:ring-brand-red/20";

const SELECT_CLASS_NAME = cn(
  "flex h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] outline-none transition focus:border-brand-red/70 focus:ring-2 focus:ring-brand-red/20",
);

export function QuoteRequestForm({
  options,
  initialValues,
}: {
  options: WebsiteQuoteFormOptionData;
  initialValues: WebsiteQuoteRequestFormValues;
}) {
  const [state, formAction] = useActionState(
    submitWebsiteQuoteRequestAction,
    INITIAL_FORM_ACTION_STATE,
  );
  const { values, updateFormValue } = useFormValues(initialValues);
  const availableModels = options.vehicleModels.filter(
    (model) => model.makeName === values.vehicleMake,
  );

  return (
    <form action={formAction} className="space-y-5 sm:space-y-6">
      <FormStatusMessage message={state.message} />

      <FormSectionCard>
        <SectionHeading
          icon={UserRound}
          title="Personal information"
          description="We use this to prepare the quotation and reach you with follow-up questions."
        />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Field
            name="firstName"
            label="First name"
            value={values.firstName}
            errors={state.fieldErrors}
            onChange={(value) => updateFormValue("firstName", value)}
          />
          <Field
            name="lastName"
            label="Last name"
            value={values.lastName}
            errors={state.fieldErrors}
            onChange={(value) => updateFormValue("lastName", value)}
          />
          <Field
            name="contactNumber"
            label="Contact number"
            value={values.contactNumber}
            errors={state.fieldErrors}
            onChange={(value) => updateFormValue("contactNumber", value)}
          />
          <Field
            name="email"
            label="Email"
            value={values.email}
            errors={state.fieldErrors}
            onChange={(value) => updateFormValue("email", value)}
          />
        </div>
      </FormSectionCard>

      <FormSectionCard>
        <SectionHeading
          icon={MapPin}
          title="Location information"
          description="Your location helps the shop coordinate the inquiry and recommend the best next step."
        />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <Field
            name="province"
            label="Province"
            value={values.province}
            errors={state.fieldErrors}
            onChange={(value) => updateFormValue("province", value)}
          />
          <Field
            name="city"
            label="City"
            value={values.city}
            errors={state.fieldErrors}
            onChange={(value) => updateFormValue("city", value)}
          />
          <Field
            name="barangay"
            label="Barangay"
            value={values.barangay}
            errors={state.fieldErrors}
            onChange={(value) => updateFormValue("barangay", value)}
          />
        </div>
      </FormSectionCard>

      <FormSectionCard>
        <SectionHeading
          icon={CarFront}
          title="Vehicle information"
          description="The more exact this is, the easier it is for the shop to assess the service request properly."
        />
        <div className="mt-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="vehicleMake" className="text-sm font-medium text-slate-800">
                Vehicle make
              </Label>
              <select
                id="vehicleMake"
                name="vehicleMake"
                value={values.vehicleMake}
                className={SELECT_CLASS_NAME}
                onChange={(event) => {
                  const nextMake = event.target.value;
                  updateFormValue("vehicleMake", nextMake);
                  if (
                    !availableModels.some(
                      (model) =>
                        model.makeName === nextMake && model.name === values.vehicleModel,
                    )
                  ) {
                    updateFormValue("vehicleModel", "");
                  }
                }}
              >
                <option value="">Select make</option>
                {options.vehicleMakes.map((make) => (
                  <option key={make.id} value={make.name}>
                    {make.name}
                  </option>
                ))}
              </select>
              <FieldError errors={state.fieldErrors} name="vehicleMake" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleModel" className="text-sm font-medium text-slate-800">
                Vehicle model
              </Label>
              <select
                id="vehicleModel"
                name="vehicleModel"
                value={values.vehicleModel}
                className={SELECT_CLASS_NAME}
                onChange={(event) => updateFormValue("vehicleModel", event.target.value)}
              >
                <option value="">Select model</option>
                {availableModels.map((model) => (
                  <option key={model.id} value={model.name}>
                    {model.name}
                  </option>
                ))}
              </select>
              <FieldError errors={state.fieldErrors} name="vehicleModel" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Field
              name="vehicleYear"
              label="Year"
              value={values.vehicleYear}
              errors={state.fieldErrors}
              onChange={(value) => updateFormValue("vehicleYear", value)}
            />
            <div className="space-y-2">
              <Label htmlFor="transmission" className="text-sm font-medium text-slate-800">
                Transmission
              </Label>
              <select
                id="transmission"
                name="transmission"
                value={values.transmission}
                className={SELECT_CLASS_NAME}
                onChange={(event) => updateFormValue("transmission", event.target.value)}
              >
                <option value="">Select transmission</option>
                {options.transmissions.map((transmission) => (
                  <option key={transmission} value={transmission}>
                    {transmission}
                  </option>
                ))}
              </select>
              <FieldError errors={state.fieldErrors} name="transmission" />
            </div>
            <Field
              name="mileage"
              label="Mileage"
              value={values.mileage}
              errors={state.fieldErrors}
              onChange={(value) => updateFormValue("mileage", value)}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              name="engineSize"
              label="Engine size"
              value={values.engineSize}
              errors={state.fieldErrors}
              onChange={(value) => updateFormValue("engineSize", value)}
            />
            <Field
              name="oilRequirementLiters"
              label="Liters of oil"
              value={values.oilRequirementLiters}
              errors={state.fieldErrors}
              onChange={(value) => updateFormValue("oilRequirementLiters", value)}
            />
          </div>
        </div>
      </FormSectionCard>

      <FormSectionCard>
        <SectionHeading
          icon={Wrench}
          title="Service details"
          description="Keep this close to how the customer would explain the service concern over Messenger or phone."
        />
        <div className="mt-5 space-y-4">
          <div className="space-y-2 xl:max-w-[55%]">
            <Label htmlFor="serviceNeeded" className="text-sm font-medium text-slate-800">
              Service needed
            </Label>
            <select
              id="serviceNeeded"
              name="serviceNeeded"
              value={values.serviceNeeded}
              className={SELECT_CLASS_NAME}
              onChange={(event) => updateFormValue("serviceNeeded", event.target.value)}
            >
              <option value="">Select service</option>
              {options.services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
            <FieldError errors={state.fieldErrors} name="serviceNeeded" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerConcern" className="text-sm font-medium text-slate-800">
              Let us know your car concern
            </Label>
            <Textarea
              id="customerConcern"
              name="customerConcern"
              value={values.customerConcern}
              rows={6}
              className="min-h-[152px] rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 shadow-[inset_0_1px_2px_rgba(15,23,42,0.03)] placeholder:text-slate-400 focus-visible:border-brand-red/70 focus-visible:ring-brand-red/20"
              onChange={(event) => updateFormValue("customerConcern", event.target.value)}
            />
            <FieldError errors={state.fieldErrors} name="customerConcern" />
          </div>
        </div>
      </FormSectionCard>

      <div
        className={cn(
          "rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,#07172d_0%,#0b2144_52%,#12305f_100%)] p-5 text-white shadow-[0_24px_56px_rgba(2,11,24,0.28)] sm:p-6 md:p-7",
        )}
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffd24a]">
              Ready to send
            </p>
            <h2 className="text-xl font-semibold text-white">Submit your quotation request</h2>
            <p className="max-w-2xl text-sm leading-6 text-[#d8e3ff]">
              We&apos;ll review the details, check the relevant product or service requirements, and
              follow up with the next step.
            </p>
          </div>
          <SubmitButton
            pendingLabel="Sending request..."
            variant="yellowPrimary"
            size="pill"
            className="h-12 w-full min-w-[200px] text-sm md:w-auto"
          >
            Send request
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}

function FormSectionCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_20px_48px_rgba(2,11,24,0.10)] sm:p-6 md:p-7",
        className,
      )}
    >
      {children}
    </section>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
        <Icon className="h-4 w-4" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
    </div>
  );
}

function Field({
  name,
  label,
  value,
  errors,
  onChange,
}: {
  name: string;
  label: string;
  value: string;
  errors?: Record<string, string[] | undefined>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="text-sm font-medium text-slate-800">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        value={value}
        className={FIELD_CLASS_NAME}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldError errors={errors} name={name} />
    </div>
  );
}
