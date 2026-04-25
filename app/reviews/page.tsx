"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { PageHero, ReviewCard, SiteHeader } from "@/components/site";
import { useLocale } from "@/components/locale-provider";
import { type Locale } from "@/lib/i18n";
import { movies, reviews } from "@/lib/movies";

const copy = {
  en: {
    eyebrow: "Community reviews",
    title: "Fresh notes from Cameroon film rooms",
    body: "A public review feed using a 1-10 IMDb-style rating scale, ready for persistent reviews in Phase 2.",
    latest: "Latest reviews",
    pickFilm: "Pick a film",
    reviewTitle: "Review a title",
    startWithFilm: "Start with a film",
    asideBody: "Mock write-review routes exist for every catalogue title, with validation, loading, error, and success states.",
  },
  fr: {
    eyebrow: "Critiques de la communaute",
    title: "Nouvelles notes des salles de cinema camerounaises",
    body: "Un flux public de critiques sur une echelle 1-10, pret pour la persistence en Phase 2.",
    latest: "Dernieres critiques",
    pickFilm: "Choisir un film",
    reviewTitle: "Critiquer un titre",
    startWithFilm: "Commencez par un film",
    asideBody: "Des routes mock write-review existent pour chaque titre avec validation, chargement, erreur et succes.",
  },
} satisfies Record<Locale, Record<string, string>>;

export default function ReviewsPage() {
  const { locale } = useLocale();
  const t = copy[locale];

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={t.eyebrow} title={t.title} body={t.body} />
      <section className="split-band detail-grid">
        <div className="panel reviews-list-panel">
          <div className="panel-heading">
            <h2>
              <MessageSquare size={18} />
              {t.latest}
            </h2>
            <Link href="/movies">{t.pickFilm}</Link>
          </div>
          <div className="stacked-list">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        </div>
        <aside className="selected-film-panel">
          <p className="eyebrow">{t.reviewTitle}</p>
          <h3>{t.startWithFilm}</h3>
          <p>{t.asideBody}</p>
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
