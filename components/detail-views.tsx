"use client";

import Link from "next/link";
import { ArrowRight, MessageSquare, Play, Star } from "lucide-react";
import { WriteReviewForm } from "@/components/forms";
import { useLocale } from "@/components/locale-provider";
import { LanguageBadges, MovieMeta, PageHero, PosterBlock, ReviewCard, SiteHeader } from "@/components/site";
import { getPersonBySlug, type Movie, type Person, type Review, type UserProfile } from "@/lib/movies";
import { formatLanguageList, formatPublishedDate, getRoleLabel, type Locale } from "@/lib/i18n";

const movieDetailCopy = {
  en: {
    eyebrow: "Movie details",
    score: "Mboko score",
    basedOn: "Based on",
    reviews: "reviews",
    watchTrailer: "Watch trailer",
    writeReview: "Write review",
    cast: "Cast",
    findPeople: "Find people",
    crew: "Crew",
    spokenLanguages: "Spoken languages",
    communityReviews: "Community reviews",
    viewAll: "View all",
    noReviews: "No community review for this film yet.",
  },
  fr: {
    eyebrow: "Fiche film",
    score: "Score Mboko",
    basedOn: "Base sur",
    reviews: "critiques",
    watchTrailer: "Voir la bande-annonce",
    writeReview: "Ecrire une critique",
    cast: "Distribution",
    findPeople: "Trouver des artistes",
    crew: "Equipe",
    spokenLanguages: "Langues parlees",
    communityReviews: "Critiques de la communaute",
    viewAll: "Tout voir",
    noReviews: "Aucune critique communautaire pour ce film.",
  },
} satisfies Record<Locale, Record<string, string>>;

const personCopy = {
  en: {
    location: "Location",
    knownFor: "Known for",
    credits: "Credits",
    browseFilms: "Browse films",
  },
  fr: {
    location: "Lieu",
    knownFor: "Connu pour",
    credits: "Credits",
    browseFilms: "Parcourir les films",
  },
} satisfies Record<Locale, Record<string, string>>;

const reviewDetailCopy = {
  en: {
    openFilm: "Open film",
    reviewerProfile: "Reviewer profile",
    filmReviewed: "Film reviewed",
  },
  fr: {
    openFilm: "Ouvrir le film",
    reviewerProfile: "Profil du critique",
    filmReviewed: "Film critique",
  },
} satisfies Record<Locale, Record<string, string>>;

const profileCopy = {
  en: {
    watched: "Watched",
    reviews: "Reviews",
    averageRating: "Avg rating",
    favoriteLanguages: "Favorite languages",
    findAnotherFilm: "Find another film",
    recentReviews: "Recent reviews",
    allReviews: "All reviews",
  },
  fr: {
    watched: "Vus",
    reviews: "Critiques",
    averageRating: "Note moy.",
    favoriteLanguages: "Langues preferees",
    findAnotherFilm: "Trouver un autre film",
    recentReviews: "Critiques recentes",
    allReviews: "Toutes les critiques",
  },
} satisfies Record<Locale, Record<string, string>>;

const writeReviewCopy = {
  en: {
    eyebrow: "Write review",
    body: "Rate on the planned 1-10 scale and preview the Phase 1 submission states.",
  },
  fr: {
    eyebrow: "Ecrire une critique",
    body: "Notez sur l'echelle 1-10 prevue et voyez les etats de soumission Phase 1.",
  },
} satisfies Record<Locale, Record<string, string>>;

export function MovieDetailView({ movie, movieReviews }: { movie: Movie; movieReviews: Review[] }) {
  const { locale } = useLocale();
  const t = movieDetailCopy[locale];

  return (
    <main>
      <SiteHeader />
      <section className="detail-hero">
        <div>
          <p className="eyebrow">{t.eyebrow}</p>
          <h1>{movie.title}</h1>
          <MovieMeta movie={movie} />
          <p className="lede">{movie.synopsis}</p>
          <div className="score-block">
            <span>{t.score}</span>
            <strong>{movie.rating.toFixed(1)}</strong>
            <em>/10</em>
            <i aria-hidden="true" />
            <Star size={18} fill="currentColor" />
            <small>
              {t.basedOn} {movie.reviews} {t.reviews}
            </small>
          </div>
          <div className="hero-actions">
            <a className="primary-action" href={movie.trailerUrl}>
              <Play size={18} fill="currentColor" />
              {t.watchTrailer}
            </a>
            <Link className="secondary-action" href={`/write-review/${movie.slug}`}>
              <MessageSquare size={18} />
              {t.writeReview}
            </Link>
          </div>
        </div>
        <PosterBlock movie={movie} className="detail-poster" />
      </section>

      <section className="split-band detail-grid">
        <div className="panel">
          <div className="panel-heading">
            <h2>{t.cast}</h2>
            <Link href="/search">{t.findPeople}</Link>
          </div>
          <div className="credit-list">
            {movie.cast.map((credit) => (
              <PersonCreditLink
                key={`${credit.personSlug}-${credit.character}`}
                personSlug={credit.personSlug}
                primaryText={credit.name}
                secondaryText={credit.character}
              />
            ))}
          </div>
        </div>
        <div className="panel">
          <div className="panel-heading">
            <h2>{t.crew}</h2>
            <span>{t.spokenLanguages}</span>
          </div>
          <LanguageBadges languages={movie.languages} />
          <div className="credit-list top-spaced">
            {movie.crew.map((credit) => (
              <PersonCreditLink
                key={`${credit.personSlug}-${credit.job}`}
                personSlug={credit.personSlug}
                primaryText={credit.name}
                secondaryText={credit.job}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="discover-band page-section">
        <div className="section-heading">
          <h2>{t.communityReviews}</h2>
          <Link href="/reviews">{t.viewAll}</Link>
        </div>
        <div className="stacked-list">
          {movieReviews.length > 0 ? (
            movieReviews.map((review) => <ReviewCard key={review.id} review={review} />)
          ) : (
            <p className="empty-state">{t.noReviews}</p>
          )}
        </div>
      </section>
    </main>
  );
}

function PersonCreditLink({
  personSlug,
  primaryText,
  secondaryText,
}: {
  personSlug: string;
  primaryText: string;
  secondaryText: string;
}) {
  const person = getPersonBySlug(personSlug);

  if (!person) {
    return (
      <div className="credit-entry">
        <strong>{primaryText}</strong>
        <span>{secondaryText}</span>
      </div>
    );
  }

  return (
    <Link href={`/people/${personSlug}`}>
      <strong>{primaryText}</strong>
      <span>{secondaryText}</span>
      <ArrowRight size={17} />
    </Link>
  );
}

export function PersonDetailView({ person, credits }: { person: Person; credits: Movie[] }) {
  const { locale } = useLocale();
  const t = personCopy[locale];

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={getRoleLabel(locale, person.role)} title={person.name} body={person.bio} />
      <section className="split-band detail-grid">
        <aside className="selected-film-panel profile-card">
          <div className={`person-mark poster-${person.palette}`}>
            <strong>
              {person.name
                .split(" ")
                .map((part) => part[0])
                .join("")}
            </strong>
          </div>
          <dl>
            <div>
              <dt>{t.location}</dt>
              <dd>{person.location}</dd>
            </div>
            <div>
              <dt>{t.knownFor}</dt>
              <dd>{person.knownFor.join(", ")}</dd>
            </div>
          </dl>
        </aside>
        <div className="panel">
          <div className="panel-heading">
            <h2>{t.credits}</h2>
            <Link href="/movies">
              {t.browseFilms}
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="catalogue-list">
            {credits.map((movie) => (
              <Link key={movie.id} href={`/movies/${movie.slug}`} className="catalogue-row">
                <PosterBlock movie={movie} className="catalogue-poster" />
                <div className="catalogue-copy">
                  <h3>{movie.title}</h3>
                  <p>{movie.synopsis}</p>
                  <LanguageBadges languages={movie.languages.slice(0, 3)} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function ReviewDetailView({ review, movie }: { review: Review; movie?: Movie }) {
  const { locale } = useLocale();
  const t = reviewDetailCopy[locale];

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
            <small>{formatPublishedDate(locale, review.publishedAt)}</small>
          </div>
          <p>{review.body}</p>
          <div className="hero-actions">
            <Link className="primary-action" href={`/movies/${review.movieSlug}`}>
              {t.openFilm}
            </Link>
            <Link className="secondary-action" href={`/profile/${review.username}`}>
              {t.reviewerProfile}
            </Link>
          </div>
        </article>
        <aside className="selected-film-panel">
          {movie ? <PosterBlock movie={movie} className="selected-poster" /> : null}
          <p className="eyebrow">{t.filmReviewed}</p>
          <h3>{review.movieTitle}</h3>
          <p>{movie?.synopsis}</p>
          {movie ? <LanguageBadges languages={movie.languages} /> : null}
        </aside>
      </section>
    </main>
  );
}

export function ProfileDetailView({ profile, authoredReviews }: { profile: UserProfile; authoredReviews: Review[] }) {
  const { locale } = useLocale();
  const t = profileCopy[locale];

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={profile.location} title={profile.displayName} body={profile.bio} />
      <section className="split-band detail-grid">
        <aside className="selected-film-panel profile-card">
          <div className="profile-stats">
            <div>
              <strong>{profile.watched}</strong>
              <span>{t.watched}</span>
            </div>
            <div>
              <strong>{profile.reviews}</strong>
              <span>{t.reviews}</span>
            </div>
            <div>
              <strong>{profile.averageRating.toFixed(1)}</strong>
              <span>{t.averageRating}</span>
            </div>
          </div>
          <dl>
            <div>
              <dt>{t.favoriteLanguages}</dt>
              <dd>{formatLanguageList(locale, profile.favoriteLanguages)}</dd>
            </div>
          </dl>
          <Link className="detail-action" href="/movies">
            {t.findAnotherFilm}
          </Link>
        </aside>
        <div className="panel reviews-list-panel">
          <div className="panel-heading">
            <h2>{t.recentReviews}</h2>
            <Link href="/reviews">{t.allReviews}</Link>
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

export function WriteReviewView({ movie }: { movie: Movie }) {
  const { locale } = useLocale();
  const t = writeReviewCopy[locale];

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={t.eyebrow} title={movie.title} body={t.body} />
      <section className="split-band detail-grid">
        <div className="panel">
          <WriteReviewForm movie={movie} />
        </div>
        <aside className="selected-film-panel">
          <PosterBlock movie={movie} className="selected-poster" />
          <MovieMeta movie={movie} />
          <p>{movie.synopsis}</p>
          <LanguageBadges languages={movie.languages} />
        </aside>
      </section>
    </main>
  );
}
