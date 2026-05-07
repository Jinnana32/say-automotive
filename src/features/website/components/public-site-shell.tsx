import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { websiteCardVariants } from "@/features/website/components/website-card-variants";
import type { WebsiteShellData } from "@/features/website/types";
import { cn } from "@/lib/utils";

export function PublicSiteShell({
  shellData,
  children,
}: {
  shellData: WebsiteShellData;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f3f5fa] text-[#10224d]">
      <header className="sticky top-0 z-20 border-b border-[#d6deef] bg-white/96 shadow-[0_12px_30px_rgba(9,26,79,0.08)] backdrop-blur">
        <div className="h-1 w-full bg-[linear-gradient(90deg,#ffd24a_0%,#0f2d83_38%,#173c99_100%)]" />
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/say-auto-care-logo.jpeg"
              alt="SAY Auto Care"
              width={150}
              height={128}
              className="h-12 w-auto rounded-sm object-contain sm:h-[52px]"
              priority
            />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-base font-semibold uppercase tracking-[0.12em] text-[#173c99]">
                SAY Auto Care
              </p>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#5c6a8a]">
                Pinoy craftsmanship. American precision.
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] font-medium text-[#223255]">
            <Link href="/" className="transition hover:text-[#173c99]">
              Home
            </Link>
            <Link href="/catalog" className="transition hover:text-[#173c99]">
              Catalog
            </Link>
            <Link href="/garage-journal" className="transition hover:text-[#173c99]">
              Shop Updates
            </Link>
            <Link href="/contact" className="transition hover:text-[#173c99]">
              Contact Us
            </Link>
            <Button asChild variant="yellowPrimary" size="pill" className="h-10 px-5">
              <Link href="/get-quote">Service Quote</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>{children}</main>

      <footer className="bg-[linear-gradient(135deg,#091a4f_0%,#143c9b_100%)] text-white">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-10 sm:px-6 sm:py-12 md:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Image
                src="/say-auto-care-logo.jpeg"
                alt="SAY Auto Care"
                width={140}
                height={119}
                className="h-10 w-auto rounded-sm object-contain"
              />
              <div>
                <p className="text-base font-semibold uppercase tracking-[0.12em] text-white">
                  {shellData.businessName}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#ffd24a]">
                  Tires, parts, and preventive maintenance
                </p>
              </div>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-[#d8e3ff]">
              Browse featured products, request service quotations, and keep up with shop updates
              from SAY Auto Care in one simple customer-facing website.
            </p>
          </div>

          <div className="grid gap-4 text-sm text-[#d8e3ff] sm:grid-cols-2">
            <div className={cn(websiteCardVariants({ variant: "footer" }), "space-y-2 text-[#d8e3ff]")}>
              <p className="font-semibold uppercase tracking-[0.12em] text-[#ffd24a]">
                Quick links
              </p>
              <div className="flex flex-col gap-2">
                <Link href="/catalog" className="font-medium text-white transition hover:text-[#ffd24a]">
                  Browse products
                </Link>
                <Link
                  href="/garage-journal"
                  className="font-medium text-white transition hover:text-[#ffd24a]"
                >
                  Shop updates
                </Link>
                <Link
                  href="/get-quote"
                  className="font-medium text-white transition hover:text-[#ffd24a]"
                >
                  Service quote
                </Link>
              </div>
            </div>

            <div className={cn(websiteCardVariants({ variant: "footer" }), "space-y-2 text-[#d8e3ff]")}>
              <p className="font-semibold uppercase tracking-[0.12em] text-[#ffd24a]">
                Visit or contact
              </p>
              <p>{shellData.address ?? `${shellData.branchName}, Philippines`}</p>
              <p>{shellData.contactNumber ?? "Please call the shop for the latest contact details."}</p>
              <Link href="/contact" className="font-medium text-white transition hover:text-[#ffd24a]">
                Contact page
              </Link>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex w-full max-w-7xl justify-end px-4 py-3 sm:px-6 lg:px-8">
            <Link
              href="/login"
              className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/45 transition hover:text-white/75 focus:text-white/75"
            >
              Staff login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
