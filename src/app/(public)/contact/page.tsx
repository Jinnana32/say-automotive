import Link from "next/link";

import { ClipboardCheck, MapPin, PhoneCall } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ContactCard } from "@/features/website/components/contact-card";
import { CTASection } from "@/features/website/components/cta-section";
import { PageHeader } from "@/features/website/components/page-header";
import { SectionContainer } from "@/features/website/components/section-container";
import { getWebsiteShellData } from "@/features/website/queries/website-queries";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const shellData = await getWebsiteShellData();

  return (
    <div className="bg-[#f3f5fa]">
      <SectionContainer tone="navy" spacing="hero" className="pb-16 sm:pb-20">
        <PageHeader
          eyebrow="Contact"
          title="GET IN TOUCH WITH SAY AUTO CARE."
          description="Need a service quote, product inquiry, or workshop assistance? Send us a message or visit the shop and we’ll help you with the next step."
          inverse
          titleTag="h1"
          size="hero"
          actions={
            <>
              <Button asChild variant="yellowPrimary" size="pill">
                <Link href="/get-quote">Service quote</Link>
              </Button>
              <Button asChild variant="outlineLight" size="pill">
                <Link href="/catalog">Browse products</Link>
              </Button>
            </>
          }
        />
      </SectionContainer>

      <SectionContainer tone="muted" spacing="compact" className="-mt-10 pt-0 sm:-mt-12">
        <div className="grid gap-5 lg:grid-cols-2">
          <ContactCard
            icon={MapPin}
            eyebrow="Business details"
            title="VISIT OR CALL THE SHOP."
            description="For service inquiries, parts availability, and appointment concerns, contact SAY Auto Care Center directly."
          >
            <div className="space-y-4 text-sm leading-7 text-[#5b6783]">
              <p>
                <span className="font-semibold text-[#10224d]">Shop:</span> {shellData.businessName}
              </p>
              <p>
                <span className="font-semibold text-[#10224d]">Branch:</span>{" "}
                {shellData.branchName}
              </p>
              <p>
                <span className="font-semibold text-[#10224d]">Address:</span>{" "}
                {shellData.address ?? "Please contact the shop for the latest address details."}
              </p>
              <p>
                <span className="font-semibold text-[#10224d]">Phone:</span>{" "}
                {shellData.contactNumber ?? "Please contact the shop for the latest number."}
              </p>
              {shellData.email ? (
                <p>
                  <span className="font-semibold text-[#10224d]">Email:</span>{" "}
                  {shellData.email}
                </p>
              ) : null}
            </div>
          </ContactCard>

          <ContactCard
            icon={ClipboardCheck}
            eyebrow="Best next step"
            title="REQUEST A SERVICE QUOTE OR ASK ABOUT THE NEXT STEP."
            description="Use the service form for maintenance, repairs, diagnostics, and inspection concerns. For products, you can also call or visit the shop directly."
            action={
              <Button asChild variant="bluePrimary" size="pill">
                <Link href="/get-quote">Open the service form</Link>
              </Button>
            }
          >
            <div className="space-y-3 text-sm leading-7 text-[#5b6783]">
              <p>
                Share your vehicle make, model, and concern when you need service advice or a
                workshop quotation.
              </p>
              <p>
                For tires, batteries, oils, and other catalog items, use this page or the phone
                number above to check availability before coming to the shop.
              </p>
            </div>
          </ContactCard>
        </div>
      </SectionContainer>

      <CTASection
        eyebrow="Prefer to talk directly?"
        title="CALL, VISIT, OR SEND A SERVICE REQUEST."
        description="Choose the contact method that works best for you. We can help with service concerns, product availability, and workshop assistance."
        actions={
          <>
            <Button asChild variant="yellowPrimary" size="pill">
              <Link href="/get-quote">Service quote</Link>
            </Button>
            <Button asChild variant="outlineLight" size="pill">
              <Link href="/catalog">Browse catalog</Link>
            </Button>
          </>
        }
        aside={
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffd24a] text-[#10224d]">
                <PhoneCall className="h-4 w-4" />
              </div>
              <p className="mt-4 text-base font-semibold text-white">
                Call the shop
              </p>
              <p className="mt-2 text-sm leading-6 text-[#d8e3ff]">
                {shellData.contactNumber ?? "Please contact the shop for the latest number."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/10 p-4 backdrop-blur">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffd24a] text-[#10224d]">
                <MapPin className="h-4 w-4" />
              </div>
              <p className="mt-4 text-base font-semibold text-white">
                Visit the branch
              </p>
              <p className="mt-2 text-sm leading-6 text-[#d8e3ff]">
                {shellData.address ?? "Please contact the shop for the latest address details."}
              </p>
            </div>
          </div>
        }
      />
    </div>
  );
}
