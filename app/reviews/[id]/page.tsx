import { notFound } from "next/navigation";
import { ReviewDetailView } from "@/components/detail-views";
import { getCurrentUser } from "@/lib/auth";
import { getAccessibleReviewByIdOrSlug, getCatalogueMovieBySlug } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const review = await getAccessibleReviewByIdOrSlug(id, currentUser?.id, currentUser?.role);

  if (!review) {
    notFound();
  }

  const movie = (await getCatalogueMovieBySlug(review.movieSlug)) ?? undefined;

  return <ReviewDetailView review={review} movie={movie} currentUser={currentUser} />;
}
