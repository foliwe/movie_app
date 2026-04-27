import { notFound } from "next/navigation";
import { ReviewDetailView } from "@/components/detail-views";
import { getCatalogueMovieBySlug, getCatalogueReviewByIdOrSlug } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = await getCatalogueReviewByIdOrSlug(id);

  if (!review) {
    notFound();
  }

  const movie = (await getCatalogueMovieBySlug(review.movieSlug)) ?? undefined;

  return <ReviewDetailView review={review} movie={movie} />;
}
