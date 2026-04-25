import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { movies, reviews } from "@/lib/movies";
import { PageHero, ReviewCard, SiteHeader } from "@/components/site";

export default function ReviewsPage() {
  return (
    <main>
      <SiteHeader />
      <PageHero
        eyebrow="Community reviews"
        title="Fresh notes from Cameroon film rooms"
        body="A public review feed using a 1-10 IMDb-style rating scale, ready for persistent reviews in Phase 2."
      />
      <section className="split-band detail-grid">
        <div className="panel reviews-list-panel">
          <div className="panel-heading">
            <h2>
              <MessageSquare size={18} />
              Latest reviews
            </h2>
            <Link href="/movies">Pick a film</Link>
          </div>
          <div className="stacked-list">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
        <aside className="selected-film-panel">
          <p className="eyebrow">Review a title</p>
          <h3>Start with a film</h3>
          <p>Mock write-review routes exist for every catalogue title, with validation, loading, error, and success states.</p>
          <div className="credit-list">
            {movies.slice(0, 4).map((movie) => (
              <Link href={`/write-review/${movie.slug}`} key={movie.id}>
                <strong>{movie.title}</strong>
                <span>{movie.rating.toFixed(1)}/10</span>
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
