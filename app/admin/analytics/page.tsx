import { AdminAnalyticsView, AdminShell } from "@/components/admin-suite";
import { getAdminSuiteData } from "@/lib/admin-suite-data";
import { requireAdmin } from "@/lib/admin-route";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const [user, data] = await Promise.all([requireAdmin("/admin/analytics"), getAdminSuiteData()]);

  return (
    <AdminShell user={user} title="Analytics" subtitle="Audience and platform performance insights">
      <AdminAnalyticsView data={data} />
    </AdminShell>
  );
}
