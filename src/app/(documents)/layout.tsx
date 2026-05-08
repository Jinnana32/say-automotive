import { requireAuthenticatedStaff } from "@/lib/auth/session";

export default async function DocumentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAuthenticatedStaff();

  return children;
}
