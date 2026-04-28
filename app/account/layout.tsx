import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/detail-views";
import { getCurrentUser } from "@/lib/auth";
import { getAccountReviews, getCurrentAccountSettingsData } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/account/profile");
  }

  const [accountData, reviews] = await Promise.all([
    getCurrentAccountSettingsData(user.id),
    getAccountReviews(user.id),
  ]);

  if (!accountData) {
    redirect("/");
  }

  const counts = {
    published: reviews.filter((review) => review.status === "Published").length,
    pending: reviews.filter((review) => review.status === "Pending").length,
    hidden: reviews.filter((review) => review.status === "Hidden").length,
    draft: reviews.filter((review) => review.status === "Draft").length,
  };

  return <AccountShell profile={accountData.profile} counts={counts}>{children}</AccountShell>;
}
