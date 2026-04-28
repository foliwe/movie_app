import { redirect } from "next/navigation";
import { AdminMoviesClient } from "@/components/admin-movies-client";
import { getAdminMoviesPageData } from "@/lib/admin-movies";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminMoviesPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/admin/movies");
  }

  if (user.role !== "Admin") {
    redirect("/");
  }

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
