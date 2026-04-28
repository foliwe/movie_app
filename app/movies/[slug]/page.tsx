import { notFound } from "next/navigation";
import { MovieDetailView } from "@/components/detail-views";
import { getCatalogueMovieBySlug, getReviewsForMovie } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function MovieDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const movie = await getCatalogueMovieBySlug(slug);

  if (!movie) {
    notFound();
  }

  const movieReviews = await getReviewsForMovie(movie.slug);

  return <MovieDetailView movie={movie} movieReviews={movieReviews} />;
}
