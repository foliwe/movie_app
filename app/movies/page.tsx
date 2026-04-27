import { MoviesPageView } from "@/components/public-page-views";
import { getCatalogueGenres, getCatalogueLanguages, getCatalogueMovies } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function MoviesPage() {
  const [movies, genres, languages] = await Promise.all([
    getCatalogueMovies(),
    getCatalogueGenres(),
    getCatalogueLanguages(),
  ]);

  return <MoviesPageView movies={movies} genres={genres} languages={languages} />;
}
