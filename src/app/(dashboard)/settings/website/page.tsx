import Link from "next/link";

import { MetricGrid } from "@/components/shared/metric-grid";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/dates";
import { getWebsiteManagementOverview } from "@/features/website/queries/website-queries";
import { getWebsitePostCategoryLabel, getWebsiteQuoteRequestTone } from "@/features/website/utils";

export const dynamic = "force-dynamic";

export default async function WebsiteSettingsPage() {
  const overview = await getWebsiteManagementOverview();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Website"
        description="Public catalog merchandising, garage journal content, and website quote-request intake."
      />

      <MetricGrid className="xl:grid-cols-4">
        <StatCard title="Published products" value={String(overview.publishedProducts)} description="Visible in the public catalog" />
        <StatCard title="Featured products" value={String(overview.featuredProducts)} description="Highlighted on the homepage" />
        <StatCard title="Active posts" value={String(overview.activePosts)} description="Published garage journal entries" />
        <StatCard title="New requests" value={String(overview.newRequests)} description="Website quote requests needing follow-up" />
      </MetricGrid>

      <section className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Catalog merchandising"
          description="Public product visibility is managed directly on each product record."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/products">Open products</Link>
            </Button>
          }
        >
          <p className="text-sm text-muted-foreground">
            Use the website publishing fields on products to decide which tires and automotive items
            show publicly, what image they use, and whether they appear on the homepage.
          </p>
        </SectionCard>

        <SectionCard
          title="Garage journal"
          description="Owner posts, maintenance tips, and promotions."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/settings/website/journal">Manage posts</Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {overview.recentPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No journal posts yet. Create the first one from the management page.
              </p>
            ) : (
              overview.recentPosts.map((post) => (
                <div key={post.id} className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{post.title}</p>
                    <StatusBadge tone={post.status === "active" ? "success" : "neutral"}>
                      {post.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {getWebsitePostCategoryLabel(post.category)} · {formatDateTime(post.publishedAt ?? post.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard
          title="Website quote requests"
          description="Inbound leads from the public quote form."
          action={
            <Button asChild size="sm" variant="outline">
              <Link href="/quotations/website-requests">Open queue</Link>
            </Button>
          }
        >
          <div className="space-y-3">
            {overview.recentRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No website quote requests have been submitted yet.
              </p>
            ) : (
              overview.recentRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-border/70 bg-muted/15 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">
                      {request.firstName} {request.lastName}
                    </p>
                    <StatusBadge tone={getWebsiteQuoteRequestTone(request.status)}>
                      {request.status}
                    </StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.vehicleMake} {request.vehicleModel} · {request.serviceNeeded}
                  </p>
                </div>
              ))
            )}
          </div>
        </SectionCard>
      </section>
    </div>
  );
}
