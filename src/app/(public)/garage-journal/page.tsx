import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CTASection } from "@/features/website/components/cta-section";
import { PageHeader } from "@/features/website/components/page-header";
import { SectionContainer } from "@/features/website/components/section-container";
import { WebsiteStoryCard } from "@/features/website/components/website-story-card";
import { listPublishedWebsitePosts } from "@/features/website/queries/website-queries";
import { getWebsitePostCategoryLabel } from "@/features/website/utils";
import { formatDate } from "@/lib/dates";

export const dynamic = "force-dynamic";

export default async function GarageJournalPage() {
  const posts = await listPublishedWebsitePosts();

  return (
    <div className="bg-[#f3f5fa]">
      <SectionContainer tone="navy" spacing="hero" className="pb-20">
        <PageHeader
          eyebrow="Garage journal"
          title="SHOP UPDATES THAT FEEL LIKE REAL WORK, NOT GENERIC CONTENT."
          description="The reference design uses strong sectioning and obvious hierarchy. This page applies that to the owner’s update style so recent work, promos, and tips feel more intentional."
          inverse
          titleTag="h1"
          size="hero"
          actions={
            <Button asChild variant="yellowPrimary" size="pill">
              <Link href="/get-quote">Service quote</Link>
            </Button>
          }
        />
      </SectionContainer>

      <SectionContainer tone="muted" spacing="compact" className="-mt-8 pt-0">
        <PageHeader
          eyebrow="Latest highlights"
          title="RECENT POSTS FROM THE SHOP."
          description="Short featured cards create a cleaner first pass through the journal before customers read the full updates below."
          align="left"
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {posts.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-sm leading-7 text-[#5b6783] shadow-[0_22px_48px_rgba(7,18,57,0.12)] ring-1 ring-[#dbe3f5]">
              Publish your first shop update or maintenance tip to start building this section.
            </div>
          ) : (
            posts.map((post) => <WebsiteStoryCard key={post.id} post={post} />)
          )}
        </div>
      </SectionContainer>

      {posts.length > 0 ? (
        <SectionContainer tone="navy">
          <PageHeader
            eyebrow="Full updates"
            title="READ THE DETAILS, PROMOS, AND MAINTENANCE NOTES."
            description="Longer updates now live inside clearer, grouped reading cards so the page keeps its contrast and structure instead of dissolving into one plain white list."
            align="left"
            inverse
          />

          <div className="mt-8 space-y-5">
            {posts.map((post) => (
              <article
                key={post.id}
                id={post.slug}
                className="rounded-2xl bg-white p-6 text-[#10224d] shadow-[0_22px_44px_rgba(7,18,57,0.18)] sm:p-7"
              >
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-[#fff1b8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#10224d]">
                      {getWebsitePostCategoryLabel(post.category)}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e7ca2]">
                      {formatDate(post.publishedAt ?? post.createdAt)}
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold leading-tight text-[#10224d] sm:text-[1.7rem]">
                    {post.title}
                  </h2>
                  <p className="whitespace-pre-line text-sm leading-7 text-[#4d5f7f]">
                    {post.content}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </SectionContainer>
      ) : null}

      <CTASection
        eyebrow="Need service or parts?"
        title="USE THE JOURNAL AS A TRUST SIGNAL, THEN POINT VISITORS TO THE RIGHT NEXT STEP."
        description="For service work, open the quote form. For products, browse the catalog and contact the shop directly."
        actions={
          <>
            <Button asChild variant="yellowPrimary" size="pill">
              <Link href="/get-quote">Open service form</Link>
            </Button>
            <Button asChild variant="outlineLight" size="pill">
              <Link href="/catalog">Browse products</Link>
            </Button>
          </>
        }
      />
    </div>
  );
}
