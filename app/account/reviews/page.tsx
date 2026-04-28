import { AccountReviewsView } from "@/components/detail-views";
import { getRequiredAccountPageData, renderAccountPage } from "@/app/account/account-page";

export const dynamic = "force-dynamic";

export default async function AccountReviewsPage() {
  const { accountData, counts, reviews, user } = await getRequiredAccountPageData("/account/reviews");

  return renderAccountPage(
    accountData.profile,
    counts,
    <AccountReviewsView profile={accountData.profile} reviews={reviews} isAdmin={user.role === "Admin"} />,
  );
}
