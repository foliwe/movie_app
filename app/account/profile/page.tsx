import { redirect } from "next/navigation";
import { AccountProfileSection } from "@/components/detail-views";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentAccountSettingsData } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/account/profile");
  }

  const accountData = await getCurrentAccountSettingsData(user.id);

  if (!accountData) {
    redirect("/");
  }

  return <AccountProfileSection profile={accountData.profile} availableLanguages={accountData.availableLanguages} />;
}
