"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Star, UserCircle } from "lucide-react";
import clsx from "clsx";
import type { Movie, Review } from "@/lib/movies";

export type Locale = "en" | "fr";

export const uiCopy = {
  en: {
    films: "Films",
    reviews: "Reviews",
    people: "People",
    lists: "Lists",
    news: "News",
    watchlist: "Watchlist",
    signIn: "Sign in",
    viewAll: "View all",
    search: "Search",
    noResults: "No matching films yet",
  },
  fr: {
    films: "Films",
    reviews: "Critiques",
    people: "Artistes",
    lists: "Listes",
    news: "Actu",
    watchlist: "A voir",
    signIn: "Connexion",
    viewAll: "Tout voir",
    search: "Recherche",
    noResults: "Aucun film correspondant",
  },
} satisfies Record<Locale, Record<string, string>>;

export function SiteHeader() {
  const [locale, setLocale] = useState<Locale>("en");
  const t = uiCopy[locale];
  const navItems = [
    { label: t.films, href: "/movies" },
    { label: t.reviews, href: "/reviews" },
    { label: t.people, href: "/people/rosine-mbakam" },
    { label: t.lists, href: "/profile/aline-n" },
    { label: t.news, href: "/search" },
    { label: t.watchlist, href: "/profile/cedric-t" },
  ];

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
        <div className="locale-toggle" aria-label="Language toggle">
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
        <Link className="avatar-button" aria-label={t.signIn} href="/login">
          <UserCircle size={31} strokeWidth={1.25} />
        </Link>
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

export function MovieMeta({ movie }: { movie: Movie }) {
  return (
    <div className="hero-facts">
      <span>{movie.releaseYear}</span>
      <span>{movie.genres[0]}</span>
      <span>{movie.country}</span>
      <span>
        {Math.floor(movie.runtimeMinutes / 60)}h {movie.runtimeMinutes % 60}m
      </span>
      <strong>{movie.status}</strong>
    </div>
  );
}

export function MovieRow({
  movie,
  href,
  isSelected,
  onClick,
}: {
  movie: Movie;
  href?: string;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <PosterBlock movie={movie} className="catalogue-poster" />
      <div className="catalogue-copy">
        <h3>{movie.title}</h3>
        <p>{movie.synopsis}</p>
        <div className="catalogue-meta">
          <span>{movie.releaseYear}</span>
          <span>{movie.languages.slice(0, 2).join(", ")}</span>
          <RatingPill rating={movie.rating} />
        </div>
      </div>
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

export function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="review-card expanded-review">
      <div className="review-thumb poster-teal">
        <strong>{review.movieTitle.split(" ")[0]}</strong>
      </div>
      <div>
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
