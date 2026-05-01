import { AdminMoviesClient } from "@/components/admin-movies-client";
import { AdminShell } from "@/components/admin-suite";
import { getAdminMoviesPageData } from "@/lib/admin-movies";
import { requireAdmin } from "@/lib/admin-route";

export const dynamic = "force-dynamic";

export default async function AdminNewMoviePage() {
  const [user, pageData] = await Promise.all([requireAdmin("/admin/movies/new"), getAdminMoviesPageData()]);

  return (
    <AdminShell user={user} title="Add New Title" subtitle="Create a new movie or TV show entry in your database.">
      <AdminMoviesClient
        initialRecords={pageData.records}
        people={pageData.people}
        languageOptions={pageData.languages}
        genreOptions={pageData.genres}
        cloudinaryCloudName={process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? ""}
        cloudinaryApiKey={process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY ?? process.env.CLOUDINARY_API_KEY ?? ""}
        cloudinaryUploadPreset={process.env.CLOUDINARY_UPLOAD_PRESET ?? ""}
      />
    </AdminShell>
  );
}
