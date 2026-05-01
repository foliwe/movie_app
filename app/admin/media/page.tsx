import { AdminMediaView, AdminShell } from "@/components/admin-suite";
import { getAdminSuiteData } from "@/lib/admin-suite-data";
import { requireAdmin } from "@/lib/admin-route";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const [user, data] = await Promise.all([requireAdmin("/admin/media"), getAdminSuiteData()]);

  return (
    <AdminShell user={user} title="Media Assets" subtitle="Manage posters, stills, banners, logos and trailers.">
      <AdminMediaView data={data} />
    </AdminShell>
  );
}
