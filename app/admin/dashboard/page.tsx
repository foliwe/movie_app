import { AdminDashboardView, AdminShell } from "@/components/admin-suite";
import { getAdminSuiteData } from "@/lib/admin-suite-data";
import { requireAdmin } from "@/lib/admin-route";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [user, data] = await Promise.all([requireAdmin("/admin/dashboard"), getAdminSuiteData()]);

  return (
    <AdminShell user={user} title="Dashboard" subtitle="Overview of your movie database">
      <AdminDashboardView data={data} />
    </AdminShell>
  );
}
