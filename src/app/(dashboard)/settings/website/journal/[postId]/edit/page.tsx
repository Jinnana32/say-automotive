import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { WebsitePostForm } from "@/features/website/components/website-post-form";
import { getWebsitePostById } from "@/features/website/queries/website-queries";

type EditWebsiteJournalPostPageProps = {
  params: Promise<{
    postId: string;
  }>;
};

export default async function EditWebsiteJournalPostPage({
  params,
}: EditWebsiteJournalPostPageProps) {
  const { postId } = await params;
  const post = await getWebsitePostById(postId);

  if (!post) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${post.title}`}
        description="Update public journal content without leaving the dashboard."
      />
      <WebsitePostForm mode="edit" initialValues={post} />
    </div>
  );
}
