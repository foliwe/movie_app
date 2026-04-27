import { AdminMoviesClient } from "@/components/admin-movies-client";
import { getAdminMoviesPageData } from "@/lib/admin-movies";

export const dynamic = "force-dynamic";

export default async function AdminMoviesPage() {
  const { records, people, languages, genres } = await getAdminMoviesPageData();

  return (
    <AdminMoviesClient
      initialRecords={records}
      people={people}
      languageOptions={languages}
      genreOptions={genres}
    />
  );
}
