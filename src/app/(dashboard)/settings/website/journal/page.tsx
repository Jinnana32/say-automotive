import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { SectionCard } from "@/components/shared/section-card";
import { formatDateTime } from "@/lib/dates";
import { toggleWebsitePostStatusAction } from "@/features/website/actions/website-actions";
import { listWebsitePosts } from "@/features/website/queries/website-queries";
import { getWebsitePostCategoryLabel } from "@/features/website/utils";

export const dynamic = "force-dynamic";

export default async function WebsiteJournalManagementPage() {
  const posts = await listWebsitePosts();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Garage Journal"
        description="Manage the owner’s public work updates, maintenance tips, and promotions."
        actions={
          <Button asChild>
            <Link href="/settings/website/journal/new">New post</Link>
          </Button>
        }
      />

      <div className="space-y-4">
        {posts.length === 0 ? (
          <SectionCard title="No posts yet" description="Create the first public journal post for the website.">
            <Button asChild>
              <Link href="/settings/website/journal/new">Create post</Link>
            </Button>
          </SectionCard>
        ) : (
          posts.map((post) => (
            <SectionCard
              key={post.id}
              title={post.title}
              description={`${getWebsitePostCategoryLabel(post.category)} · ${formatDateTime(post.publishedAt ?? post.createdAt)}`}
              action={
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/settings/website/journal/${post.id}/edit`}>Edit</Link>
                  </Button>
                  <form action={toggleWebsitePostStatusAction}>
                    <input type="hidden" name="postId" value={post.id} />
                    <input
                      type="hidden"
                      name="nextStatus"
                      value={post.status === "active" ? "inactive" : "active"}
                    />
                    <Button size="sm" type="submit" variant="ghost">
                      {post.status === "active" ? "Archive" : "Publish"}
                    </Button>
                  </form>
                </div>
              }
            >
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <StatusBadge tone={post.status === "active" ? "success" : "neutral"}>
                    {post.status}
                  </StatusBadge>
                  {post.isFeatured ? <StatusBadge tone="info">featured</StatusBadge> : null}
                </div>
                <p className="text-sm text-muted-foreground">{post.excerpt}</p>
              </div>
            </SectionCard>
          ))
        )}
      </div>
    </div>
  );
}
