import { redirect } from "next/navigation";
import { AccountReviewsView } from "@/components/detail-views";
import { getCurrentUser } from "@/lib/auth";
import { getAccountReviews, getCatalogueProfileByUsername } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function AccountReviewsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/account/reviews");
  }

  const [profile, reviews] = await Promise.all([
    getCatalogueProfileByUsername(user.username),
    getAccountReviews(user.id),
  ]);

  if (!profile) {
    redirect("/");
  }

  return <AccountReviewsView profile={profile} reviews={reviews} isAdmin={user.role === "Admin"} />;
}
