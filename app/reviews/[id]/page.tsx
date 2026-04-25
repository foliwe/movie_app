import Link from "next/link";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { getMovieBySlug, getReviewBySlug, reviews } from "@/lib/movies";
import { PageHero, PosterBlock, SiteHeader } from "@/components/site";

export function generateStaticParams() {
  return reviews.map((review) => ({ id: review.slug }));
}

export default async function ReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const review = getReviewBySlug(id);

  if (!review) {
    notFound();
  }

  const movie = getMovieBySlug(review.movieSlug);

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={review.movieTitle} title={review.title} body={review.excerpt} />
      <section className="split-band detail-grid">
        <article className="panel article-panel">
          <div className="score-block">
            <span>{review.author}</span>
            <strong>{review.rating.toFixed(1)}</strong>
            <em>/10</em>
            <i aria-hidden="true" />
            <Star size={18} fill="currentColor" />
            <small>{review.publishedAt}</small>
          </div>
          <p>{review.body}</p>
          <div className="hero-actions">
            <Link className="primary-action" href={`/movies/${review.movieSlug}`}>
              Open film
            </Link>
            <Link className="secondary-action" href={`/profile/${review.username}`}>
              Reviewer profile
            </Link>
          </div>
        </article>
        <aside className="selected-film-panel">
          {movie ? <PosterBlock movie={movie} className="selected-poster" /> : null}
          <p className="eyebrow">Film reviewed</p>
          <h3>{review.movieTitle}</h3>
          <p>{movie?.synopsis}</p>
        </aside>
      </section>
    </main>
  );
}
