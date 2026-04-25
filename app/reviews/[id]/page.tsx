import { notFound } from "next/navigation";
import { ReviewDetailView } from "@/components/detail-views";
import { getMovieBySlug, getReviewBySlug, reviews } from "@/lib/movies";

export function generateStaticParams() {
  return reviews.map((review) => ({ id: review.slug }));
}

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = getReviewBySlug(id);

  if (!review) {
    notFound();
  }

  const movie = getMovieBySlug(review.movieSlug);

  return <ReviewDetailView review={review} movie={movie} />;
}
