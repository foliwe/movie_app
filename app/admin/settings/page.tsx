import { AdminSettingsView, AdminShell } from "@/components/admin-suite";
import { getAdminSuiteData } from "@/lib/admin-suite-data";
import { requireAdmin } from "@/lib/admin-route";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const [user, data] = await Promise.all([requireAdmin("/admin/settings"), getAdminSuiteData()]);

  return (
    <AdminShell user={user} title="Settings" subtitle="Configure platform settings and access controls">
      <AdminSettingsView data={data} />
    </AdminShell>
  );
}
