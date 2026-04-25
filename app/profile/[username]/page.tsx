import Link from "next/link";
import { notFound } from "next/navigation";
import { getProfileByUsername, reviews, userProfiles } from "@/lib/movies";
import { PageHero, ReviewCard, SiteHeader } from "@/components/site";

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

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={profile.location} title={profile.displayName} body={profile.bio} />
      <section className="split-band detail-grid">
        <aside className="selected-film-panel profile-card">
          <div className="profile-stats">
            <div>
              <strong>{profile.watched}</strong>
              <span>Watched</span>
            </div>
            <div>
              <strong>{profile.reviews}</strong>
              <span>Reviews</span>
            </div>
            <div>
              <strong>{profile.averageRating.toFixed(1)}</strong>
              <span>Avg rating</span>
            </div>
          </div>
          <dl>
            <div>
              <dt>Favorite languages</dt>
              <dd>{profile.favoriteLanguages.join(", ")}</dd>
            </div>
          </dl>
          <Link className="detail-action" href="/movies">
            Find another film
          </Link>
        </aside>
        <div className="panel reviews-list-panel">
          <div className="panel-heading">
            <h2>Recent reviews</h2>
            <Link href="/reviews">All reviews</Link>
          </div>
          <div className="stacked-list">
            {authoredReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
