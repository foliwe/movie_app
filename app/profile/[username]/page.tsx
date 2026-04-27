import { notFound } from "next/navigation";
import { ProfileDetailView } from "@/components/detail-views";
import { getCatalogueProfileByUsername, getReviewsByUsername } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await getCatalogueProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const authoredReviews = await getReviewsByUsername(profile.username);

  return <ProfileDetailView profile={profile} authoredReviews={authoredReviews} />;
}
