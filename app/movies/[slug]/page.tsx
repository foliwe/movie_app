import { notFound } from "next/navigation";
import { MovieDetailView } from "@/components/detail-views";
import { getMovieBySlug, movies, reviews } from "@/lib/movies";

export function generateStaticParams() {
  return movies.map((movie) => ({ slug: movie.slug }));
}

export default async function MovieDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const movie = getMovieBySlug(slug);

  if (!movie) {
    notFound();
  }

  const movieReviews = reviews.filter((review) => review.movieSlug === movie.slug);

  return <MovieDetailView movie={movie} movieReviews={movieReviews} />;
}
