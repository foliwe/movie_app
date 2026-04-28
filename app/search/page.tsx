import { SearchPageView } from "@/components/public-page-views";
import {
  getCatalogueGenres,
  getCatalogueLanguages,
  getCatalogueMovies,
  getCataloguePeople,
  getCatalogueReviews,
} from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function SearchPage() {
  const [movies, people, reviews, genres, languages] = await Promise.all([
    getCatalogueMovies(),
    getCataloguePeople(),
    getCatalogueReviews(),
    getCatalogueGenres(),
    getCatalogueLanguages(),
  ]);

  return <SearchPageView movies={movies} people={people} reviews={reviews} genres={genres} languages={languages} />;
}
