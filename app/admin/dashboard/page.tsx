import { AdminDashboardView, AdminShell } from "@/components/admin-suite";
import { getAdminSuiteData } from "@/lib/admin-suite-data";
import { requireAdmin } from "@/lib/admin-route";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const user = await requireAdmin("/admin/dashboard");
  const data = await getAdminSuiteData();

  return (
    <AdminShell user={user} title="Dashboard" subtitle="Overview of your movie database">
      <AdminDashboardView data={data} />
    </AdminShell>
  );
}
