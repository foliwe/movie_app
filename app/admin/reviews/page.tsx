import { redirect } from "next/navigation";
import { AdminReviewsView } from "@/components/detail-views";
import { getCurrentUser } from "@/lib/auth";
import { getAdminReviews } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin/reviews");
  }

  if (user.role !== "Admin") {
    redirect("/");
  }

  const reviews = await getAdminReviews();

  return <AdminReviewsView reviews={reviews} />;
}
