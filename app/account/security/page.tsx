import { redirect } from "next/navigation";
import { AccountSecuritySection } from "@/components/detail-views";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentAccountSettingsData } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function AccountSecurityPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/account/security");
  }

  const accountData = await getCurrentAccountSettingsData(user.id);

  if (!accountData) {
    redirect("/");
  }

  return <AccountSecuritySection email={accountData.profile.email} />;
}
