import Link from "next/link";
import { Plus } from "lucide-react";
import { AdminShell, AdminTitlesView } from "@/components/admin-suite";
import { getAdminSuiteData } from "@/lib/admin-suite-data";
import { requireAdmin } from "@/lib/admin-route";

export const dynamic = "force-dynamic";

export default async function AdminMoviesPage() {
  const user = await requireAdmin("/admin/movies");
  const data = await getAdminSuiteData();

  return (
    <AdminShell
      user={user}
      title="Titles"
      subtitle="Manage and organize your movie & TV show library."
      actions={
        <Link className="cineverse-topbar-link" href="/admin/movies/new">
          <Plus size={16} />
          Add New Title
        </Link>
      }
    >
      <AdminTitlesView data={data} />
    </AdminShell>
  );
}
