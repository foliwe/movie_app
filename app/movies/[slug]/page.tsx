import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MessageSquare, Play, Star } from "lucide-react";
import { getMovieBySlug, reviews } from "@/lib/movies";
import { MovieMeta, PosterBlock, ReviewCard, SiteHeader } from "@/components/site";

export function generateStaticParams() {
  return [{ slug: "mambar-pierrette" }, { slug: "the-fishermans-diary" }, { slug: "ninahs-dowry" }, { slug: "muna-moto" }, { slug: "beleh" }];
}

export default async function MovieDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const movie = getMovieBySlug(slug);

  if (!movie) {
    notFound();
  }

  const movieReviews = reviews.filter((review) => review.movieSlug === movie.slug);

  return (
    <main>
      <SiteHeader />
      <section className="detail-hero">
        <div>
          <p className="eyebrow">Movie details</p>
          <h1>{movie.title}</h1>
          <MovieMeta movie={movie} />
          <p className="lede">{movie.synopsis}</p>
          <div className="score-block">
            <span>Mboko score</span>
            <strong>{movie.rating.toFixed(1)}</strong>
            <em>/10</em>
            <i aria-hidden="true" />
            <Star size={18} fill="currentColor" />
            <small>Based on {movie.reviews} reviews</small>
          </div>
          <div className="hero-actions">
            <a className="primary-action" href={movie.trailerUrl}>
              <Play size={18} fill="currentColor" />
              Watch trailer
            </a>
            <Link className="secondary-action" href={`/write-review/${movie.slug}`}>
              <MessageSquare size={18} />
              Write review
            </Link>
          </div>
        </div>
        <PosterBlock movie={movie} className="detail-poster" />
      </section>

      <section className="split-band detail-grid">
        <div className="panel">
          <div className="panel-heading">
            <h2>Cast</h2>
            <Link href="/search">Find people</Link>
          </div>
          <div className="credit-list">
            {movie.cast.map((credit) => (
              <Link href={`/people/${credit.personSlug}`} key={`${credit.personSlug}-${credit.character}`}>
                <strong>{credit.name}</strong>
                <span>{credit.character}</span>
                <ArrowRight size={17} />
              </Link>
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-heading">
            <h2>Crew</h2>
            <span>{movie.languages.join(", ")}</span>
          </div>
          <div className="credit-list">
            {movie.crew.map((credit) => (
              <Link href={`/people/${credit.personSlug}`} key={`${credit.personSlug}-${credit.job}`}>
                <strong>{credit.name}</strong>
                <span>{credit.job}</span>
                <ArrowRight size={17} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="discover-band page-section">
        <div className="section-heading">
          <h2>Community reviews</h2>
          <Link href="/reviews">View all</Link>
        </div>
        <div className="stacked-list">
          {movieReviews.length > 0 ? (
            movieReviews.map((review) => <ReviewCard key={review.id} review={review} />)
          ) : (
            <p className="empty-state">No community review for this film yet.</p>
          )}
        </div>
      </section>
    </main>
  );
}
