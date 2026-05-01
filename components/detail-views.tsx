"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronLeft, ChevronRight, MessageSquare, Play, Star, X } from "lucide-react";
import { CldImage } from "next-cloudinary";
import { AccountProfileForm, ChangePasswordForm, ReviewOwnerTools, WriteReviewForm } from "@/components/forms";
import { useLocale } from "@/components/locale-provider";
import {
  LanguageBadges,
  MovieMeta,
  MovieRow,
  PageHero,
  PersonAvatar,
  PosterBlock,
  ReviewCard,
  ReviewStatusBadge,
  SiteHeader,
} from "@/components/site";
import { getCloudinaryImageProps } from "@/lib/cloudinary-media";
import type { AccountProfile, Movie, Person, Review, UserProfile } from "@/lib/movies";
import { formatLanguageList, formatPublishedDate, getRoleLabel, type Locale } from "@/lib/i18n";

const movieDetailCopy = {
  en: {
    eyebrow: "Movie details",
    score: "Mboko score",
    basedOn: "Based on",
    reviews: "reviews",
    watchTrailer: "Watch trailer",
    trailer: "Trailer",
    trailerFallback: "Open trailer",
    noTrailer: "No trailer is available for this film yet.",
    gallery: "Gallery",
    stills: "stills",
    galleryHint: "Tap an image to view the gallery.",
    previousImage: "Previous image",
    nextImage: "Next image",
    closeGallery: "Close gallery",
    noGallery: "No gallery images are available for this film yet.",
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
    trailer: "Bande-annonce",
    trailerFallback: "Ouvrir la bande-annonce",
    noTrailer: "Aucune bande-annonce n'est disponible pour ce film pour le moment.",
    gallery: "Galerie",
    stills: "images",
    galleryHint: "Touchez une image pour ouvrir la galerie.",
    previousImage: "Image precedente",
    nextImage: "Image suivante",
    closeGallery: "Fermer la galerie",
    noGallery: "Aucune image de galerie n'est disponible pour ce film pour le moment.",
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

const accountShellCopy = {
  en: {
    eyebrow: "Account",
    title: "Account settings",
    body: "Manage how your public profile reads, keep your password current, and track every review from one signed-in workspace.",
    profile: "Profile",
    security: "Security",
    reviews: "Reviews",
    publicProfile: "Public profile",
    email: "Email",
    reviewStates: "Review states",
    favoriteLanguages: "Favorite languages",
    published: "Published",
    pending: "Pending",
    hidden: "Hidden",
    draft: "Draft",
  },
  fr: {
    eyebrow: "Compte",
    title: "Parametres du compte",
    body: "Gerez le profil public, gardez le mot de passe a jour et suivez chaque critique depuis un seul espace connecte.",
    profile: "Profil",
    security: "Securite",
    reviews: "Critiques",
    publicProfile: "Profil public",
    email: "Email",
    reviewStates: "Etats des critiques",
    favoriteLanguages: "Langues preferees",
    published: "Publiees",
    pending: "En attente",
    hidden: "Masquees",
    draft: "Brouillons",
  },
} satisfies Record<Locale, Record<string, string>>;

const accountProfileCopy = {
  en: {
    title: "Edit your public profile",
    body: "Update the display name, location, bio, and language preferences that appear on your profile page.",
  },
  fr: {
    title: "Modifier le profil public",
    body: "Mettez a jour le nom affiche, le lieu, la bio et les langues preferees visibles sur votre page profil.",
  },
} satisfies Record<Locale, Record<string, string>>;

const accountSecurityCopy = {
  en: {
    title: "Protect your sign-in",
    body: "Change your password without using the recovery flow. Your other active sessions will be revoked after a successful change.",
    emailNote: "Signed-in email",
  },
  fr: {
    title: "Proteger la connexion",
    body: "Changez votre mot de passe sans utiliser la recuperation. Les autres sessions actives seront revoquees apres une mise a jour reussie.",
    emailNote: "Email de connexion",
  },
} satisfies Record<Locale, Record<string, string>>;

const accountReviewsCopy = {
  en: {
    title: "All authored reviews",
    body: "Open any review to edit its copy, check moderation state, or jump back to the public page.",
    queueLink: "Open moderation queue",
    noReviews: "No authored reviews yet.",
  },
  fr: {
    title: "Toutes vos critiques",
    body: "Ouvrez une critique pour modifier le texte, verifier son statut de moderation ou revenir a la page publique.",
    queueLink: "Ouvrir la file moderation",
    noReviews: "Aucune critique redigee pour le moment.",
  },
} satisfies Record<Locale, Record<string, string>>;

const adminReviewCopy = {
  en: {
    eyebrow: "Admin reviews",
    title: "Moderate the public conversation",
    body: "Review every status from one queue before notes surface across the public feed.",
    queue: "Moderation queue",
    queueBody: "Open any review to edit copy, hide it, or publish it back into the feed.",
    noReviews: "No reviews are available yet.",
  },
  fr: {
    eyebrow: "Admin critiques",
    title: "Moderer la conversation publique",
    body: "Passez en revue tous les statuts depuis une seule file avant publication dans le flux public.",
    queue: "File moderation",
    queueBody: "Ouvrez une critique pour modifier le texte, la masquer ou la republier.",
    noReviews: "Aucune critique disponible pour le moment.",
  },
} satisfies Record<Locale, Record<string, string>>;

const writeReviewCopy = {
  en: {
    eyebrow: "Write review",
    body: "Rate on the 1-10 scale, keep a local draft, and publish to the community feed when signed in.",
  },
  fr: {
    eyebrow: "Ecrire une critique",
    body: "Notez sur l'echelle 1-10, gardez un brouillon local et publiez une fois connecte.",
  },
} satisfies Record<Locale, Record<string, string>>;

export function MovieDetailView({ movie, movieReviews }: { movie: Movie; movieReviews: Review[] }) {
  const { locale } = useLocale();
  const t = movieDetailCopy[locale];
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number | null>(null);
  const effectiveTrailerEmbedUrl =
    getNormalizedTrailerEmbedUrl(movie.trailerEmbedUrl) ?? getNormalizedTrailerEmbedUrl(movie.trailerUrl);
  const hasTrailerLink = movie.trailerUrl.trim().length > 0;
  const trailerSectionHref =
    movie.trailerSourceType === "Cloudinary" || effectiveTrailerEmbedUrl ? "#movie-trailer-player" : movie.trailerUrl;
  const autoplayTrailerEmbedUrl = effectiveTrailerEmbedUrl ? getAutoplayTrailerEmbedUrl(effectiveTrailerEmbedUrl) : null;
  const hasEmbeddedTrailer = movie.trailerSourceType === "Cloudinary" || Boolean(autoplayTrailerEmbedUrl);
  const hasTrailerAction = hasEmbeddedTrailer || hasTrailerLink;
  const activeGalleryImage = activeGalleryIndex === null ? null : movie.galleryImages[activeGalleryIndex] ?? null;
  const activeGalleryPosition = activeGalleryIndex === null ? 0 : activeGalleryIndex + 1;

  useEffect(() => {
    if (activeGalleryIndex === null) {
      document.body.style.removeProperty("overflow");
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveGalleryIndex(null);
        return;
      }

      if (movie.galleryImages.length <= 1) {
        return;
      }

      if (event.key === "ArrowLeft") {
        setActiveGalleryIndex((current) =>
          current === null ? current : (current - 1 + movie.galleryImages.length) % movie.galleryImages.length,
        );
      }

      if (event.key === "ArrowRight") {
        setActiveGalleryIndex((current) =>
          current === null ? current : (current + 1) % movie.galleryImages.length,
        );
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.removeProperty("overflow");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeGalleryIndex, movie.galleryImages.length]);

  useEffect(() => {
    if (!hasEmbeddedTrailer) {
      return;
    }

    const scrollTimer = window.setTimeout(() => {
      document.getElementById("movie-trailer-player")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 150);

    return () => {
      window.clearTimeout(scrollTimer);
    };
  }, [hasEmbeddedTrailer, movie.slug]);

  return (
    <main>
      <SiteHeader />
      <section className="detail-hero">
        {movie.backdropPublicId ? (
          <CldImage
            alt=""
            src={movie.backdropPublicId}
            className="detail-backdrop cloudinary-media"
            priority
            {...getCloudinaryImageProps("backdropHero")}
          />
        ) : (
          <Image src={movie.backdropUrl} alt="" fill sizes="100vw" className="detail-backdrop" priority />
        )}
        <div className="detail-hero-overlay" />
        <div className="detail-copy">
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
            {hasTrailerAction ? (
              <a className="primary-action" href={trailerSectionHref}>
                <Play size={18} fill="currentColor" />
                {t.watchTrailer}
              </a>
            ) : null}
            <Link className="secondary-action" href={`/write-review/${movie.slug}`}>
              <MessageSquare size={18} />
              {t.writeReview}
            </Link>
          </div>
        </div>
        <PosterBlock movie={movie} className="detail-poster" variant="posterDetail" hideTitleWhenImage />
      </section>

      <section className="split-band detail-grid detail-media-section" data-testid="movie-media-section">
        <div className="panel media-panel">
          <div className="panel-heading">
            <h2>{t.trailer}</h2>
            {movie.trailerSourceType !== "Cloudinary" && !effectiveTrailerEmbedUrl && hasTrailerLink ? (
              <a href={movie.trailerUrl}>
                {t.trailerFallback}
                <ArrowRight size={16} />
              </a>
            ) : null}
          </div>
          {movie.trailerSourceType === "Cloudinary" ? (
            <video
              id="movie-trailer-player"
              className="cloudinary-video-player"
              controls
              autoPlay
              muted
              playsInline
              src={movie.trailerUrl}
              preload="metadata"
            />
          ) : autoplayTrailerEmbedUrl ? (
            <div className="trailer-frame" id="movie-trailer-player">
              <iframe
                title={`${movie.title} trailer`}
                src={autoplayTrailerEmbedUrl}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : hasTrailerLink ? (
            <a className="detail-action media-fallback-action" href={movie.trailerUrl}>
              {t.watchTrailer}
              <ArrowRight size={18} />
            </a>
          ) : (
            <p className="empty-state">{t.noTrailer}</p>
          )}
        </div>
        <div className="panel media-panel">
          <div className="panel-heading">
            <h2>{t.gallery}</h2>
            <div className="gallery-heading-copy">
              <span>
                {movie.galleryImages.length} {t.stills}
              </span>
              {movie.galleryImages.length > 0 ? <small>{t.galleryHint}</small> : null}
            </div>
          </div>
          {movie.galleryImages.length > 0 ? (
            <div className="gallery-grid" data-testid="movie-gallery">
              {movie.galleryImages.map((image, index) => (
                <figure key={image.src} className="gallery-still">
                  <button
                    type="button"
                    className="gallery-still-button"
                    onClick={() => setActiveGalleryIndex(index)}
                    aria-label={image.alt}
                  >
                    {image.publicId ? (
                      <CldImage
                        alt={image.alt}
                        src={image.publicId}
                        className="cloudinary-media"
                        {...getCloudinaryImageProps("galleryStill")}
                      />
                    ) : (
                      <Image src={image.src} alt={image.alt} fill sizes="(max-width: 780px) 100vw, 33vw" />
                    )}
                  </button>
                </figure>
              ))}
            </div>
          ) : (
            <p className="empty-state">{t.noGallery}</p>
          )}
        </div>
      </section>

      {activeGalleryImage ? (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={t.gallery}>
          <button
            type="button"
            className="gallery-lightbox-backdrop"
            aria-label={t.closeGallery}
            onClick={() => setActiveGalleryIndex(null)}
          />
          <div className="gallery-lightbox-panel">
            <button
              type="button"
              className="gallery-lightbox-close"
              aria-label={t.closeGallery}
              onClick={() => setActiveGalleryIndex(null)}
            >
              <X size={18} />
            </button>
            {movie.galleryImages.length > 1 ? (
              <button
                type="button"
                className="gallery-lightbox-nav is-prev"
                aria-label={t.previousImage}
                onClick={() =>
                  setActiveGalleryIndex((current) =>
                    current === null ? current : (current - 1 + movie.galleryImages.length) % movie.galleryImages.length,
                  )
                }
              >
                <ChevronLeft size={22} />
              </button>
            ) : null}
            <figure className="gallery-lightbox-figure">
              <div className="gallery-lightbox-media">
                <Image
                  src={activeGalleryImage.src}
                  alt={activeGalleryImage.alt}
                  fill
                  sizes="100vw"
                  className="gallery-lightbox-image"
                />
              </div>
              <figcaption className="gallery-lightbox-caption">
                <strong>{movie.title}</strong>
                <span>{activeGalleryImage.alt}</span>
                <small>
                  {activeGalleryPosition} / {movie.galleryImages.length}
                </small>
              </figcaption>
            </figure>
            {movie.galleryImages.length > 1 ? (
              <button
                type="button"
                className="gallery-lightbox-nav is-next"
                aria-label={t.nextImage}
                onClick={() =>
                  setActiveGalleryIndex((current) =>
                    current === null ? current : (current + 1) % movie.galleryImages.length,
                  )
                }
              >
                <ChevronRight size={22} />
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

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
                photoUrl={credit.photoUrl}
                palette={credit.palette}
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
                photoUrl={credit.photoUrl}
                palette={credit.palette}
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

function getAutoplayTrailerEmbedUrl(embedUrl: string) {
  try {
    const url = new URL(embedUrl);
    url.searchParams.set("autoplay", "1");
    url.searchParams.set("mute", "1");
    url.searchParams.set("playsinline", "1");
    url.searchParams.set("rel", "0");

    return url.toString();
  } catch {
    return embedUrl;
  }
}

function getNormalizedTrailerEmbedUrl(trailerUrl?: string | null) {
  if (!trailerUrl) {
    return null;
  }

  try {
    const url = new URL(trailerUrl);
    const host = url.hostname.replace(/^www\./, "");

    if ((host === "youtube-nocookie.com" || host === "youtube.com") && url.pathname.startsWith("/embed/")) {
      const videoId = url.pathname.split("/").filter(Boolean).pop();
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const videoId = url.searchParams.get("v");
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
    }

    if (host === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
    }

    if (host === "vimeo.com") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

function PersonCreditLink({
  personSlug,
  primaryText,
  secondaryText,
  photoUrl,
  palette,
}: {
  personSlug: string;
  primaryText: string;
  secondaryText: string;
  photoUrl?: string;
  palette?: Movie["palette"];
}) {
  if (!photoUrl && !palette) {
    return (
      <div className="credit-entry">
        <PersonAvatar name={primaryText} />
        <div className="credit-copy">
          <strong>{primaryText}</strong>
          <span>{secondaryText}</span>
        </div>
      </div>
    );
  }

  return (
    <Link href={`/people/${personSlug}`}>
      <PersonAvatar person={{ name: primaryText, photoUrl, palette: palette ?? "teal" }} name={primaryText} />
      <div className="credit-copy">
        <strong>{primaryText}</strong>
        <span>{secondaryText}</span>
      </div>
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
              <MovieRow key={movie.id} movie={movie} href={`/movies/${movie.slug}`} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export function ReviewDetailView({
  review,
  movie,
  currentUser,
}: {
  review: Review;
  movie?: Movie;
  currentUser?: { username: string; role: "Member" | "Admin" } | null;
}) {
  const { locale } = useLocale();
  const t = reviewDetailCopy[locale];
  const canManageReview = currentUser?.role === "Admin" || currentUser?.username === review.username;

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
          {canManageReview ? (
            <ReviewOwnerTools review={review} canModerate={currentUser?.role === "Admin"} />
          ) : null}
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
          {movie ? <PosterBlock movie={movie} className="selected-poster" useImage={false} /> : null}
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
          <PosterBlock movie={movie} className="selected-poster" useImage={false} />
          <MovieMeta movie={movie} />
          <p>{movie.synopsis}</p>
          <LanguageBadges languages={movie.languages} />
        </aside>
      </section>
    </main>
  );
}

function AccountTabNav() {
  const pathname = usePathname();
  const { locale } = useLocale();
  const t = accountShellCopy[locale];
  const tabs = [
    { href: "/account/profile", label: t.profile },
    { href: "/account/security", label: t.security },
    { href: "/account/reviews", label: t.reviews },
  ];

  return (
    <nav className="account-tabs" aria-label={t.eyebrow}>
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href} className={pathname === tab.href ? "is-active" : undefined}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export function AccountShell({
  profile,
  counts,
  children,
}: {
  profile: AccountProfile;
  counts: {
    published: number;
    pending: number;
    hidden: number;
    draft: number;
  };
  children: ReactNode;
}) {
  const { locale } = useLocale();
  const t = accountShellCopy[locale];

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={t.eyebrow} title={t.title} body={t.body} />
      <section className="split-band detail-grid account-shell-grid">
        <aside className="selected-film-panel profile-card account-sidebar">
          <div className="profile-stats">
            <div>
              <strong>{counts.published}</strong>
              <span>{t.published}</span>
            </div>
            <div>
              <strong>{counts.pending}</strong>
              <span>{t.pending}</span>
            </div>
            <div>
              <strong>{counts.hidden}</strong>
              <span>{t.hidden}</span>
            </div>
          </div>
          <dl>
            <div>
              <dt>{t.publicProfile}</dt>
              <dd>
                <Link href={`/profile/${profile.username}`}>{profile.displayName}</Link>
              </dd>
            </div>
            <div>
              <dt>{t.email}</dt>
              <dd>{profile.email ?? "-"}</dd>
            </div>
            <div>
              <dt>{t.favoriteLanguages}</dt>
              <dd>{formatLanguageList(locale, profile.favoriteLanguages)}</dd>
            </div>
            <div>
              <dt>{t.reviewStates}</dt>
              <dd>
                {t.draft}: {counts.draft}
              </dd>
            </div>
          </dl>
        </aside>
        <div className="panel reviews-list-panel account-main-panel">
          <AccountTabNav />
          {children}
        </div>
      </section>
    </main>
  );
}

export function AccountProfileSection({
  profile,
  availableLanguages,
}: {
  profile: AccountProfile;
  availableLanguages: string[];
}) {
  const { locale } = useLocale();
  const t = accountProfileCopy[locale];

  return (
    <>
      <div className="panel-heading account-panel-heading">
        <div>
          <h2>{t.title}</h2>
          <p>{t.body}</p>
        </div>
        <Link href={`/profile/${profile.username}`}>{accountShellCopy[locale].publicProfile}</Link>
      </div>
      <AccountProfileForm profile={profile} availableLanguages={availableLanguages} />
    </>
  );
}

export function AccountSecuritySection({ email }: { email: string | null }) {
  const { locale } = useLocale();
  const t = accountSecurityCopy[locale];

  return (
    <>
      <div className="panel-heading account-panel-heading">
        <div>
          <h2>{t.title}</h2>
          <p>{t.body}</p>
        </div>
      </div>
      <div className="account-readonly-card">
        <strong>{t.emailNote}</strong>
        <span>{email ?? "-"}</span>
      </div>
      <ChangePasswordForm />
    </>
  );
}

export function AccountReviewsView({
  profile,
  reviews,
  isAdmin,
}: {
  profile: UserProfile;
  reviews: Review[];
  isAdmin: boolean;
}) {
  const { locale } = useLocale();
  const t = accountReviewsCopy[locale];

  return (
    <>
      <div className="panel-heading account-panel-heading">
        <div>
          <h2>{t.title}</h2>
          <p>{t.body}</p>
        </div>
        {isAdmin ? <Link href="/admin/reviews">{t.queueLink}</Link> : <Link href={`/profile/${profile.username}`}>{profile.displayName}</Link>}
      </div>
      <div className="stacked-list">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <article key={review.id} className="review-card expanded-review">
              <div className="review-thumb poster-teal">
                <strong>{review.movieTitle.split(" ")[0]}</strong>
              </div>
              <div>
                <ReviewStatusBadge status={review.status ?? "Published"} />
                <Link href={`/reviews/${review.id}`}>
                  <h3>{review.title}</h3>
                </Link>
                <p>
                  <Star size={13} fill="currentColor" /> {review.rating.toFixed(1)}/10
                </p>
                <span>{review.excerpt}</span>
              </div>
              <footer>
                <strong>{review.author}</strong>
                <span>{review.movieTitle}</span>
              </footer>
            </article>
          ))
        ) : (
          <p className="empty-state">{t.noReviews}</p>
        )}
      </div>
    </>
  );
}

export function AdminReviewsView({ reviews }: { reviews: Review[] }) {
  const { locale } = useLocale();
  const t = adminReviewCopy[locale];

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={t.eyebrow} title={t.title} body={t.body} />
      <section className="discover-band page-section">
        <div className="panel reviews-list-panel">
          <div className="panel-heading">
            <h2>{t.queue}</h2>
            <p>{t.queueBody}</p>
          </div>
          <div className="stacked-list">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <article key={review.id} className="review-card expanded-review">
                  <div className="review-thumb poster-teal">
                    <strong>{review.movieTitle.split(" ")[0]}</strong>
                  </div>
                  <div>
                    <ReviewStatusBadge status={review.status ?? "Published"} />
                    <Link href={`/reviews/${review.id}`}>
                      <h3>{review.title}</h3>
                    </Link>
                    <p>
                      <Star size={13} fill="currentColor" /> {review.rating.toFixed(1)}/10
                    </p>
                    <span>{review.excerpt}</span>
                  </div>
                  <footer>
                    <strong>{review.author}</strong>
                    <span>{review.movieTitle}</span>
                  </footer>
                </article>
              ))
            ) : (
              <p className="empty-state">{t.noReviews}</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
