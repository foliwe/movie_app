import { HomePageView } from "@/components/public-page-views";
import { getCatalogueGenres, getCatalogueLanguages, getCatalogueMovies, getCatalogueReviews } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [movies, reviews, genres, languages] = await Promise.all([
    getCatalogueMovies(),
    getCatalogueReviews(),
    getCatalogueGenres(),
    getCatalogueLanguages(),
  ]);

  return <HomePageView movies={movies} reviews={reviews} genres={genres} languages={languages} />;
}
