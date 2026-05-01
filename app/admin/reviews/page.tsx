import { AdminReviewsSuiteView, AdminShell } from "@/components/admin-suite";
import { getAdminSuiteData } from "@/lib/admin-suite-data";
import { requireAdmin } from "@/lib/admin-route";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const [user, data] = await Promise.all([requireAdmin("/admin/reviews"), getAdminSuiteData()]);

  return (
    <AdminShell user={user} title="Reviews" subtitle="Moderate and manage user reviews across the platform.">
      <AdminReviewsSuiteView data={data} />
    </AdminShell>
  );
}
