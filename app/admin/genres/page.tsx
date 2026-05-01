import { AdminGenresView, AdminShell } from "@/components/admin-suite";
import { getAdminSuiteData } from "@/lib/admin-suite-data";
import { requireAdmin } from "@/lib/admin-route";

export const dynamic = "force-dynamic";

export default async function AdminGenresPage() {
  const [user, data] = await Promise.all([requireAdmin("/admin/genres"), getAdminSuiteData()]);

  return (
    <AdminShell user={user} title="Genres" subtitle="Manage genre taxonomy, subgenres and relationships">
      <AdminGenresView data={data} />
    </AdminShell>
  );
}
