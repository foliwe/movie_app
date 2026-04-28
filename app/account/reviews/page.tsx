import { redirect } from "next/navigation";
import { AccountReviewsView } from "@/components/detail-views";
import { getCurrentUser } from "@/lib/auth";
import { getAccountReviews, getCurrentAccountSettingsData } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function AccountReviewsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/account/reviews");
  }

  const [accountData, reviews] = await Promise.all([
    getCurrentAccountSettingsData(user.id),
    getAccountReviews(user.id),
  ]);

  if (!accountData) {
    redirect("/");
  }

  return <AccountReviewsView profile={accountData.profile} reviews={reviews} isAdmin={user.role === "Admin"} />;
}
