import { ReviewsPageView } from "@/components/public-page-views";
import { getCatalogueMovies, getCatalogueReviews } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const [movies, reviews] = await Promise.all([getCatalogueMovies(), getCatalogueReviews()]);

  return <ReviewsPageView movies={movies} reviews={reviews} />;
}
