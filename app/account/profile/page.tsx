import { AccountProfileSection } from "@/components/detail-views";
import { getRequiredAccountPageData, renderAccountPage } from "@/app/account/account-page";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const { accountData, counts } = await getRequiredAccountPageData("/account/profile");

  return renderAccountPage(
    accountData.profile,
    counts,
    <AccountProfileSection profile={accountData.profile} availableLanguages={accountData.availableLanguages} />,
  );
}
