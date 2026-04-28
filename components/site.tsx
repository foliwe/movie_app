"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Languages, Search, Star, UserCircle } from "lucide-react";
import clsx from "clsx";
import type { Movie, Person, Review } from "@/lib/movies";
import {
  formatLanguageList,
  getGenreLabel,
  getLanguageLabel,
  getReviewStatusLabel,
  getStatusLabel,
  type Locale,
} from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";

export const uiCopy = {
  en: {
    films: "Films",
    reviews: "Reviews",
    people: "People",
    search: "Search",
    profiles: "Profiles",
    account: "My reviews",
    signIn: "Sign in",
    signOut: "Sign out",
    admin: "Admin",
    viewAll: "View all",
    noResults: "No matching films yet",
    languageToggle: "Language toggle",
  },
  fr: {
    films: "Films",
    reviews: "Critiques",
    people: "Artistes",
    search: "Recherche",
    profiles: "Profils",
    account: "Mes critiques",
    signIn: "Connexion",
    signOut: "Deconnexion",
    admin: "Admin",
    viewAll: "Tout voir",
    noResults: "Aucun film correspondant",
    languageToggle: "Changement de langue",
  },
} satisfies Record<Locale, Record<string, string>>;

export function SiteHeader() {
  const router = useRouter();
  const { locale, setLocale } = useLocale();
  const [authUser, setAuthUser] = useState<{ username: string; displayName: string; role: "Member" | "Admin" } | null>(null);
  const t = uiCopy[locale];
  const navItems = [
    { label: t.films, href: "/movies" },
    { label: t.reviews, href: "/reviews" },
    { label: t.search, href: "/search" },
    { label: t.people, href: "/people/rosine-mbakam" },
    { label: t.profiles, href: "/profile/aline-n" },
    ...(authUser ? [{ label: t.account, href: "/account/reviews" }] : []),
    ...(authUser?.role === "Admin" ? [{ label: t.admin, href: "/admin/movies" }] : []),
  ];
  const authInitials = authUser?.displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  useEffect(() => {
    let isMounted = true;

    fetch("/api/auth/me")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { user?: { username: string; displayName: string; role: "Member" | "Admin" } | null } | null) => {
        if (isMounted && payload?.user) {
          setAuthUser(payload.user);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
    setAuthUser(null);
    router.refresh();
  }

  return (
    <header className="site-header">
      <Link className="brand" href="/" aria-label="Mboko Reels home">
        <span>MBOKO</span>
        <small>REELS</small>
      </Link>
      <nav aria-label="Primary navigation">
        {navItems.map((item) => (
          <Link href={item.href} key={item.label}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="header-actions">
        <Link className="icon-button" aria-label={t.search} href="/search">
          <Search size={22} strokeWidth={1.5} />
        </Link>
        <div className="locale-toggle" aria-label={t.languageToggle} data-testid="locale-toggle">
          {(["en", "fr"] as Locale[]).map((language) => (
            <button
              key={language}
              type="button"
              className={clsx(language === locale && "is-active")}
              onClick={() => setLocale(language)}
            >
              {language.toUpperCase()}
            </button>
          ))}
        </div>
        <span className="header-divider" aria-hidden="true" />
        <Link
          className="avatar-button"
          aria-label={authUser ? authUser.displayName : t.signIn}
          href={authUser ? `/profile/${authUser.username}` : "/login"}
        >
          {authInitials ? <span>{authInitials}</span> : <UserCircle size={31} strokeWidth={1.25} />}
        </Link>
        {authUser ? (
          <button className="header-logout-button" type="button" onClick={handleLogout}>
            {t.signOut}
          </button>
        ) : null}
      </div>
    </header>
  );
}

export function PosterBlock({
  movie,
  className,
  titleClassName,
}: {
  movie: Pick<Movie, "title" | "palette">;
  className: string;
  titleClassName?: string;
}) {
  return (
    <div className={clsx(className, `poster-${movie.palette}`)}>
      <strong className={titleClassName}>{movie.title}</strong>
    </div>
  );
}

export function RatingPill({ rating }: { rating: number }) {
  return (
    <strong className="rating-pill">
      <Star size={15} fill="currentColor" />
      {rating.toFixed(1)}
    </strong>
  );
}

export function LanguageBadges({ languages }: { languages: string[] }) {
  const { locale } = useLocale();

  return (
    <div className="language-badges" aria-label={locale === "fr" ? "Langues parlees" : "Spoken languages"}>
      {languages.map((language) => (
        <span key={language}>{getLanguageLabel(locale, language)}</span>
      ))}
    </div>
  );
}

export function MovieMeta({ movie }: { movie: Movie }) {
  const { locale } = useLocale();
  const primaryGenre = movie.genres[0];

  return (
    <div className="hero-facts">
      <span>{movie.releaseYear}</span>
      {primaryGenre ? <span>{getGenreLabel(locale, primaryGenre)}</span> : null}
      <span>{movie.country}</span>
      <span>
        {Math.floor(movie.runtimeMinutes / 60)}h {movie.runtimeMinutes % 60}m
      </span>
      <strong>{getStatusLabel(locale, movie.status)}</strong>
    </div>
  );
}

export function MovieRow({
  movie,
  href,
  isSelected,
  onClick,
  variant = "badges",
}: {
  movie: Movie;
  href?: string;
  isSelected?: boolean;
  onClick?: () => void;
  variant?: "badges" | "meta";
}) {
  const { locale } = useLocale();
  const footer: ReactNode =
    variant === "meta" ? (
      <div className="catalogue-meta">
        <span>
          <CalendarDays size={15} />
          {movie.releaseYear}
        </span>
        <span>
          <Languages size={15} />
          {formatLanguageList(locale, movie.languages.slice(0, 2))}
        </span>
        <RatingPill rating={movie.rating} />
      </div>
    ) : (
      <LanguageBadges languages={movie.languages.slice(0, 3)} />
    );

  const content = (
    <>
      <PosterBlock movie={movie} className="catalogue-poster" />
      <div className="catalogue-copy">
        <h3>{movie.title}</h3>
        <p>{movie.synopsis}</p>
        {footer}
      </div>
      {variant === "meta" ? <ArrowRight className="row-arrow" size={19} /> : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={clsx("catalogue-row", isSelected && "is-selected")}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={clsx("catalogue-row", isSelected && "is-selected")} onClick={onClick}>
      {content}
    </button>
  );
}

export function FreshReviewListItem({ review }: { review: Review }) {
  return (
    <article className="review-card fresh-review-item">
      <div className="review-thumb poster-teal">
        <strong>{review.movieTitle.split(" ")[0]}</strong>
      </div>
      <div>
        <Link href={`/reviews/${review.slug}`}>
          <h3>{review.movieTitle}</h3>
        </Link>
        <p>
          <Star size={13} fill="currentColor" /> {review.rating.toFixed(1)}/10
        </p>
        <span>{review.excerpt}</span>
      </div>
      <footer>
        <strong>{review.author}</strong>
        <span>{review.location}</span>
      </footer>
    </article>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  const { locale } = useLocale();
  const movieLanguages = review.movieLanguages ?? [];

  return (
    <article className="review-card expanded-review">
      <div className="review-thumb poster-teal">
        <strong>{review.movieTitle.split(" ")[0]}</strong>
      </div>
      <div>
        {movieLanguages.length > 0 ? (
          <small className="review-card-context">
            {review.movieTitle} / {formatLanguageList(locale, movieLanguages.slice(0, 2))}
          </small>
        ) : null}
        <Link href={`/reviews/${review.slug}`}>
          <h3>{review.title}</h3>
        </Link>
        <p>
          <Star size={13} fill="currentColor" /> {review.rating.toFixed(1)}/10
        </p>
        <span>{review.excerpt}</span>
      </div>
      <footer>
        <Link href={`/profile/${review.username}`}>
          <strong>{review.author}</strong>
        </Link>
        <span>{review.location}</span>
      </footer>
    </article>
  );
}

export function ReviewStatusBadge({ status }: { status: NonNullable<Review["status"]> }) {
  const { locale } = useLocale();

  return (
    <span className={clsx("review-status-badge", `is-${status.toLowerCase()}`)}>
      {getReviewStatusLabel(locale, status)}
    </span>
  );
}

export function PageHero({
  eyebrow,
  title,
  body,
}: {
  eyebrow: string;
  title: string;
  body: string;
}) {
  return (
    <section className="page-hero">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="lede">{body}</p>
    </section>
  );
}

export function PersonAvatar({
  person,
  name,
  className,
}: {
  person?: Pick<Person, "name" | "palette" | "photoUrl">;
  name: string;
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (person?.photoUrl) {
    return (
      <div className={clsx("person-avatar", className)} data-testid="credit-avatar" data-photo-state="image">
        <Image src={person.photoUrl} alt={`${name} portrait`} fill sizes="52px" />
      </div>
    );
  }

  return (
    <div
      className={clsx("person-avatar", "person-avatar-fallback", person ? `poster-${person.palette}` : "poster-teal", className)}
      data-testid="credit-avatar"
      data-photo-state="fallback"
      aria-hidden="true"
    >
      <strong>{initials}</strong>
    </div>
  );
}
