import { PageHeader } from "@/components/shared/page-header";
import { WebsitePostForm } from "@/features/website/components/website-post-form";

export default function NewWebsiteJournalPostPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Journal Post"
        description="Create a public owner update, maintenance tip, or promotion."
      />
      <WebsitePostForm
        mode="create"
        initialValues={{
          title: "",
          slug: "",
          excerpt: "",
          content: "",
          coverImageUrl: "",
          category: "shop_update",
          isFeatured: false,
          status: "active",
        }}
      />
    </div>
  );
}
