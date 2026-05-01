import { AdminShell, AdminUsersView } from "@/components/admin-suite";
import { getAdminSuiteData } from "@/lib/admin-suite-data";
import { requireAdmin } from "@/lib/admin-route";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const user = await requireAdmin("/admin/users");
  const data = await getAdminSuiteData();

  return (
    <AdminShell user={user} title="Users" subtitle="Manage user accounts, roles, and permissions">
      <AdminUsersView data={data} />
    </AdminShell>
  );
}
