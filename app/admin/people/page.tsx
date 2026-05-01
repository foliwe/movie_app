import { AdminPeopleView, AdminShell } from "@/components/admin-suite";
import { getAdminSuiteData } from "@/lib/admin-suite-data";
import { requireAdmin } from "@/lib/admin-route";

export const dynamic = "force-dynamic";

export default async function AdminPeoplePage() {
  const user = await requireAdmin("/admin/people");
  const data = await getAdminSuiteData();

  return (
    <AdminShell user={user} title="People" subtitle="Manage actors, directors, writers and producers">
      <AdminPeopleView data={data} />
    </AdminShell>
  );
}
