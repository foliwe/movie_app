import { notFound } from "next/navigation";
import { WriteReviewView } from "@/components/detail-views";
import { getMovieBySlug, movies } from "@/lib/movies";

export function generateStaticParams() {
  return movies.map((movie) => ({ movieSlug: movie.slug }));
}

export default async function WriteReviewPage({ params }: { params: Promise<{ movieSlug: string }> }) {
  const { movieSlug } = await params;
  const movie = getMovieBySlug(movieSlug);

  if (!movie) {
    notFound();
  }

  return <WriteReviewView movie={movie} />;
}
