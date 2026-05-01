import { AdminReviewsSuiteView, AdminShell } from "@/components/admin-suite";
import { getAdminSuiteData } from "@/lib/admin-suite-data";
import { requireAdmin } from "@/lib/admin-route";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const user = await requireAdmin("/admin/reviews");
  const data = await getAdminSuiteData();

  return (
    <AdminShell user={user} title="Reviews" subtitle="Moderate and manage user reviews across the platform.">
      <AdminReviewsSuiteView data={data} />
    </AdminShell>
  );
}
