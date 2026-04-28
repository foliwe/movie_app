import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AccountShell } from "@/components/detail-views";
import { getCurrentUser } from "@/lib/auth";
import { getAccountReviews, getCurrentAccountSettingsData } from "@/lib/catalog-data";

export async function getRequiredAccountPageData(nextPath: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect(`/login?next=${nextPath}`);
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

  return {
    user,
    accountData,
    reviews,
    counts,
  };
}

export function renderAccountPage(
  profile: Parameters<typeof AccountShell>[0]["profile"],
  counts: Parameters<typeof AccountShell>[0]["counts"],
  children: ReactNode,
) {
  return (
    <AccountShell profile={profile} counts={counts}>
      {children}
    </AccountShell>
  );
}
