import { AccountSecuritySection } from "@/components/detail-views";
import { getRequiredAccountPageData, renderAccountPage } from "@/app/account/account-page";

export const dynamic = "force-dynamic";

export default async function AccountSecurityPage() {
  const { accountData, counts } = await getRequiredAccountPageData("/account/security");

  return renderAccountPage(accountData.profile, counts, <AccountSecuritySection email={accountData.profile.email} />);
}
