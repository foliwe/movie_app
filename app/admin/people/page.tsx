import { AdminPeopleView, AdminShell } from "@/components/admin-suite";
import { getAdminSuiteData } from "@/lib/admin-suite-data";
import { requireAdmin } from "@/lib/admin-route";

export const dynamic = "force-dynamic";

export default async function AdminPeoplePage() {
  const [user, data] = await Promise.all([requireAdmin("/admin/people"), getAdminSuiteData()]);

  return (
    <AdminShell user={user} title="People" subtitle="Manage actors, directors, writers and producers">
      <AdminPeopleView data={data} />
    </AdminShell>
  );
}
