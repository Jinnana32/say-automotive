import Link from "next/link";

import { AppImage } from "@/components/shared/app-image";
import { ArrowRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { websiteCardVariants } from "@/features/website/components/website-card-variants";
import type { WebsitePostListItem } from "@/features/website/types";
import { formatDate } from "@/lib/dates";
import { getWebsitePostCategoryLabel } from "@/features/website/utils";

export function WebsiteStoryCard({ post }: { post: WebsitePostListItem }) {
  return (
    <Card className={websiteCardVariants({ variant: "product" })}>
      {post.coverImageUrl ? (
        <AppImage
          src={post.coverImageUrl}
          alt={post.title}
          width={960}
          height={600}
          mode="content"
          fit="cover"
          className="aspect-[16/10] w-full"
        />
      ) : (
        <div className="aspect-[16/10] bg-[linear-gradient(135deg,_#102b84_0%,_#173c99_68%,_#ffd24a_100%)]" />
      )}

      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="border-transparent bg-[#fff1b8] text-[#10224d]">
            {getWebsitePostCategoryLabel(post.category)}
          </Badge>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6e7ca2]">
            {formatDate(post.publishedAt ?? post.createdAt)}
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-semibold leading-tight text-[#10224d] sm:text-[1.35rem]">
            {post.title}
          </h3>
          <p className="text-sm leading-6 text-[#4d5f7f]">{post.excerpt}</p>
        </div>

        <Link
          href={`/garage-journal#${post.slug}`}
          className="inline-flex items-center gap-2 rounded-full bg-[#ffd24a] px-4 py-2 text-sm font-semibold text-[#10224d] transition hover:bg-[#ffdc72]"
        >
          Read update
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}
