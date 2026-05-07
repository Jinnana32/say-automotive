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
      <SectionContainer tone="navy" spacing="hero" className="pb-20">
        <PageHeader
          eyebrow="Contact"
          title="GET IN TOUCH WITH SAY AUTO CARE."
          description="The contact page should feel like part of the same brand system: dark hero, clear next step, and solid information cards instead of plain text dropped on white."
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

      <SectionContainer tone="muted" spacing="compact" className="-mt-12 pt-0">
        <div className="grid gap-5 lg:grid-cols-2">
          <ContactCard
            icon={MapPin}
            eyebrow="Business details"
            title="VISIT OR CALL THE SHOP."
            description="Keep the essential information visible in one strong contact block so customers do not have to hunt for it."
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
                <span className="font-semibold text-[#10224d]">Contact:</span>{" "}
                {shellData.contactNumber ?? "Please contact the shop for the latest number."}
              </p>
            </div>
          </ContactCard>

          <ContactCard
            icon={ClipboardCheck}
            eyebrow="Best next step"
            title="USE THE SERVICE FORM FOR MAINTENANCE, REPAIRS, AND INSPECTIONS."
            description="For catalog items, call or visit the shop. The form is best used for actual workshop service requests."
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
        title="KEEP THE CONTACT PATH CLEAR, VISIBLE, AND EASY TO ACT ON."
        description="Strong public website sections matter, but the practical outcome is simple: customers should always know how to ask for service help or product availability."
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
