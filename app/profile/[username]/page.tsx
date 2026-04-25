import { notFound } from "next/navigation";
import { ProfileDetailView } from "@/components/detail-views";
import { getProfileByUsername, reviews, userProfiles } from "@/lib/movies";

export function generateStaticParams() {
  return userProfiles.map((profile) => ({ username: profile.username }));
}

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = getProfileByUsername(username);

  if (!profile) {
    notFound();
  }

  const authoredReviews = reviews.filter((review) => review.username === profile.username);

  return <ProfileDetailView profile={profile} authoredReviews={authoredReviews} />;
}
