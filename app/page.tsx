"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  Languages,
  MessageSquare,
  Play,
  Plus,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import clsx from "clsx";
import { genres, languages, movies, reviews } from "@/lib/movies";
import { SiteHeader } from "@/components/site";

type Locale = "en" | "fr";

const copy = {
  en: {
    nav: ["Discover", "Reviews", "Watchlist", "People"],
    signIn: "Sign in",
    eyebrow: "Cameroon cinema, rated by the community",
    title: "Find the next Cameroonian film worth talking about.",
    body: "Mboko Reels brings classics, festival premieres, and crowd reviews into one bilingual home for movie lovers.",
    watch: "Watch trailer",
    review: "Write review",
    rating: "Community rating",
    trending: "Trending now",
    editor: "Editor picks",
    recent: "Fresh reviews",
    browse: "Browse all",
    filters: "Filters",
    language: "Language",
    discover: "Discover catalogue",
    allGenres: "All genres",
    allLanguages: "All languages",
    selected: "Selected film",
    director: "Director",
    spoken: "Spoken languages",
    runtime: "Runtime",
    openDetails: "Open film details",
    source: "Film data sourced from public festival, distributor, and movie database pages.",
  },
  fr: {
    nav: ["Decouvrir", "Critiques", "Liste", "Artistes"],
    signIn: "Connexion",
    eyebrow: "Cinema camerounais, note par la communaute",
    title: "Trouvez le prochain film camerounais qui merite conversation.",
    body: "Mboko Reels rassemble classiques, premieres de festivals et critiques en une maison bilingue pour cinephiles.",
    watch: "Voir la bande-annonce",
    review: "Ecrire une critique",
    rating: "Note communaute",
    trending: "Tendances",
    editor: "Choix de la redaction",
    recent: "Critiques recentes",
    browse: "Tout parcourir",
    filters: "Filtres",
    language: "Langue",
    discover: "Catalogue decouverte",
    allGenres: "Tous genres",
    allLanguages: "Toutes langues",
    selected: "Film selectionne",
    director: "Realisation",
    spoken: "Langues parlees",
    runtime: "Duree",
    openDetails: "Ouvrir la fiche",
    source: "Donnees films issues de pages publiques de festivals, distributeurs et bases cinema.",
  },
} satisfies Record<Locale, Record<string, string | string[]>>;

export default function Home() {
  const [locale, setLocale] = useState<Locale>("en");
  const [selectedMovie, setSelectedMovie] = useState(movies[1].id);
  const [activeGenre, setActiveGenre] = useState<(typeof genres)[number]>("All");
  const [activeLanguage, setActiveLanguage] = useState<(typeof languages)[number]>("All");
  const t = copy[locale];
  const heroMovie = movies.find((movie) => movie.id === selectedMovie) ?? movies[1];

  const visibleMovies = useMemo(() => movies, []);
  const filteredMovies = useMemo(
    () =>
      movies.filter((movie) => {
        const genreMatch = activeGenre === "All" || movie.genres.includes(activeGenre);
        const languageMatch =
          activeLanguage === "All" ||
          movie.languages.some((language) => language.toLowerCase().includes(activeLanguage.toLowerCase()));

        return genreMatch && languageMatch;
      }),
    [activeGenre, activeLanguage],
  );

  return (
    <main>
      <SiteHeader />

      <section className="hero-shell">
        <Image
          src="/assets/cameroon-cinema-backdrop.png"
          alt=""
          fill
          sizes="100vw"
          className="hero-backdrop"
          priority
        />
        <div className="hero-overlay" />

        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow">Featured film</p>
            <h1>{heroMovie.title}</h1>
            <div className="hero-facts">
              <span>{heroMovie.releaseYear}</span>
              <span>{heroMovie.genres[0]}</span>
              <span>{heroMovie.country}</span>
              <span>{Math.floor(heroMovie.runtimeMinutes / 60)}h {heroMovie.runtimeMinutes % 60}m</span>
              <strong>13+</strong>
            </div>
            <p className="lede">{heroMovie.synopsis}</p>
            <div className="score-block" aria-label={`${heroMovie.rating} out of 10 Mboko score`}>
              <span>Mboko score</span>
              <strong>{heroMovie.rating.toFixed(1)}</strong>
              <em>/10</em>
              <i aria-hidden="true" />
              <Star size={18} fill="currentColor" />
              <small>Based on {heroMovie.reviews} reviews</small>
            </div>
            <div className="hero-actions">
              <Link className="primary-action" href={`/movies/${heroMovie.slug}`}>
                <Play size={18} fill="currentColor" />
                Read review
              </Link>
              <Link className="secondary-action" href={`/write-review/${heroMovie.slug}`}>
                <Plus size={18} />
                Add to watchlist
              </Link>
            </div>
          </div>

          <div className="festival-badge" aria-label="Festival selection badge">
            <span>AFRIFF</span>
            <small>Official selection</small>
            <strong>{heroMovie.releaseYear}</strong>
          </div>

          <blockquote>
            <p>"A quiet, powerful portrait of identity and belonging."</p>
            <cite>- 237 Film Room</cite>
          </blockquote>
        </div>
      </section>

      <section className="content-band">
        <div className="section-heading">
          <h2>{t.trending}</h2>
          <Link href="/movies">
            View all
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="movie-rail">
          {visibleMovies.map((movie) => (
            <button
              className={clsx("movie-card", selectedMovie === movie.id && "is-selected")}
              key={movie.id}
              onClick={() => setSelectedMovie(movie.id)}
            >
              <div className={clsx("mini-poster", `poster-${movie.palette}`)}>
                <strong>{movie.title}</strong>
              </div>
              <div className="movie-card-copy">
                <h3>{movie.title}</h3>
                <Star size={13} fill="currentColor" />
                <strong>{movie.rating.toFixed(1)}</strong>
                <span>{movie.releaseYear}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="split-band">
        <div className="panel editor-panel">
          <div className="panel-heading">
            <h2>
              <Star size={18} fill="currentColor" />
              {t.editor}
            </h2>
            <Link href="/movies">View all</Link>
          </div>
          <div className="editor-grid">
            {movies.slice(0, 3).map((movie) => (
              <article key={movie.id}>
                <div className={clsx("editor-poster", `poster-${movie.palette}`)}>
                  <strong>{movie.title}</strong>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel reviews-panel">
          <div className="panel-heading">
            <h2>
              <MessageSquare size={18} />
              {t.recent}
            </h2>
            <Link href="/reviews">View all</Link>
          </div>
          {reviews.map((review) => (
            <article key={review.id} className="review-card">
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
          ))}
        </aside>
      </section>

      <section className="discover-band">
        <div className="discover-heading">
          <div>
            <p className="eyebrow">{t.browse}</p>
            <h2>{t.discover}</h2>
          </div>
          <div className="filter-summary">
            <SlidersHorizontal size={18} />
            <span>{filteredMovies.length} films</span>
          </div>
        </div>

        <div className="filter-grid" aria-label={String(t.filters)}>
          <div className="filter-group">
            <span>{t.filters}</span>
            <div className="segmented-scroll" role="list">
              {genres.map((genre) => (
                <button
                  type="button"
                  key={genre}
                  className={clsx(activeGenre === genre && "is-active")}
                  onClick={() => setActiveGenre(genre)}
                >
                  {genre === "All" ? t.allGenres : genre}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <span>{t.language}</span>
            <div className="segmented-scroll" role="list">
              {languages.map((language) => (
                <button
                  type="button"
                  key={language}
                  className={clsx(activeLanguage === language && "is-active")}
                  onClick={() => setActiveLanguage(language)}
                >
                  {language === "All" ? t.allLanguages : language}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="catalogue-layout">
          <div className="catalogue-list">
            {filteredMovies.map((movie) => (
              <button
                type="button"
                key={movie.id}
                className={clsx("catalogue-row", selectedMovie === movie.id && "is-selected")}
                onClick={() => setSelectedMovie(movie.id)}
              >
                <div className={clsx("catalogue-poster", `poster-${movie.palette}`)}>
                  <strong>{movie.title}</strong>
                </div>
                <div className="catalogue-copy">
                  <h3>{movie.title}</h3>
                  <p>{movie.synopsis}</p>
                  <div className="catalogue-meta">
                    <span>
                      <CalendarDays size={15} />
                      {movie.releaseYear}
                    </span>
                    <span>
                      <Languages size={15} />
                      {movie.languages.slice(0, 2).join(", ")}
                    </span>
                    <strong>
                      <Star size={15} fill="currentColor" />
                      {movie.rating.toFixed(1)}
                    </strong>
                  </div>
                </div>
                <ArrowRight className="row-arrow" size={19} />
              </button>
            ))}
          </div>

          <aside className="selected-film-panel">
            <p className="eyebrow">{t.selected}</p>
            <div className={clsx("selected-poster", `poster-${heroMovie.palette}`)}>
              <strong>{heroMovie.title}</strong>
            </div>
            <h3>{heroMovie.title}</h3>
            <p>{heroMovie.synopsis}</p>
            <dl>
              <div>
                <dt>{t.director}</dt>
                <dd>{heroMovie.director}</dd>
              </div>
              <div>
                <dt>{t.spoken}</dt>
                <dd>{heroMovie.languages.join(", ")}</dd>
              </div>
              <div>
                <dt>{t.runtime}</dt>
                <dd>
                  <Clock3 size={15} />
                  {Math.floor(heroMovie.runtimeMinutes / 60)}h {heroMovie.runtimeMinutes % 60}m
                </dd>
              </div>
            </dl>
            <Link href={`/movies/${heroMovie.slug}`} className="detail-action">
              {t.openDetails}
              <ArrowRight size={18} />
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}
