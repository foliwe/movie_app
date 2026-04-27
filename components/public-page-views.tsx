"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, MessageSquare, Play, Search, SlidersHorizontal, Star } from "lucide-react";
import clsx from "clsx";
import { FreshReviewListItem, LanguageBadges, MovieRow, PageHero, ReviewCard, SiteHeader } from "@/components/site";
import { useLocale } from "@/components/locale-provider";
import { getGenreLabel, getLanguageLabel, getRoleLabel, type Locale } from "@/lib/i18n";
import type { Movie, Person, Review } from "@/lib/movies";

const homeCopy = {
  en: {
    featured: "Featured film",
    score: "Mboko score",
    basedOn: "Based on",
    reviews: "reviews",
    openFilm: "Open film page",
    writeReview: "Write review",
    badgeTitle: "Official selection",
    quote: `"A quiet, powerful portrait of identity and belonging."`,
    quoteSource: "237 Film Room",
    trending: "Trending now",
    editor: "Editor picks",
    recent: "Fresh reviews",
    viewAll: "View all",
    browse: "Browse all",
    discover: "Discover catalogue",
    selected: "Selected film",
    filters: "Filters",
    filmCount: "films",
    allGenres: "All genres",
    allLanguages: "All languages",
  },
  fr: {
    featured: "Film en vedette",
    score: "Score Mboko",
    basedOn: "Base sur",
    reviews: "critiques",
    openFilm: "Ouvrir la fiche film",
    writeReview: "Ecrire une critique",
    badgeTitle: "Selection officielle",
    quote: `"Un portrait calme et puissant de l'identite et de l'appartenance."`,
    quoteSource: "237 Film Room",
    trending: "En tendance",
    editor: "Choix de la redaction",
    recent: "Critiques recentes",
    viewAll: "Tout voir",
    browse: "Tout parcourir",
    discover: "Catalogue decouverte",
    selected: "Film selectionne",
    filters: "Filtres",
    filmCount: "films",
    allGenres: "Tous genres",
    allLanguages: "Toutes langues",
  },
} satisfies Record<Locale, Record<string, string>>;

const moviesCopy = {
  en: {
    eyebrow: "Discover catalogue",
    title: "Browse Cameroon cinema",
    body: "Filter live catalogue entries by language, genre, year, and rating from the development database.",
    filters: "Filters",
    ratings: "1-10 ratings",
    genre: "Genre",
    language: "Language",
    year: "Year",
    rating: "Rating",
    allGenres: "All genres",
    allLanguages: "All languages",
    allYears: "All years",
    films: "films",
    empty: "No matching films yet.",
  },
  fr: {
    eyebrow: "Catalogue decouverte",
    title: "Parcourir le cinema camerounais",
    body: "Filtrez les titres live par langue, genre, annee et note depuis la base de developpement.",
    filters: "Filtres",
    ratings: "Notes 1-10",
    genre: "Genre",
    language: "Langue",
    year: "Annee",
    rating: "Note",
    allGenres: "Tous genres",
    allLanguages: "Toutes langues",
    allYears: "Toutes annees",
    films: "films",
    empty: "Aucun film correspondant.",
  },
} satisfies Record<Locale, Record<string, string>>;

const reviewsCopy = {
  en: {
    eyebrow: "Community reviews",
    title: "Fresh notes from Cameroon film rooms",
    body: "A public review feed using the seeded PostgreSQL catalogue and a 1-10 rating scale.",
    latest: "Latest reviews",
    pickFilm: "Pick a film",
    reviewTitle: "Review a title",
    startWithFilm: "Start with a film",
    asideBody: "Write-review routes are still local-form mocks for now, but they now point at database-backed movie records.",
  },
  fr: {
    eyebrow: "Critiques de la communaute",
    title: "Nouvelles notes des salles de cinema camerounaises",
    body: "Un flux public de critiques utilisant le catalogue PostgreSQL et une echelle 1-10.",
    latest: "Dernieres critiques",
    pickFilm: "Choisir un film",
    reviewTitle: "Critiquer un titre",
    startWithFilm: "Commencez par un film",
    asideBody: "Les routes write-review restent des formulaires mock pour l'instant, mais elles pointent maintenant vers des films charges depuis la base.",
  },
} satisfies Record<Locale, Record<string, string>>;

const searchCopy = {
  en: {
    eyebrow: "Search",
    title: "Find films, voices, and reviews",
    body: "Search spans titles, languages, people, genres, and review copy from the development database.",
    placeholder: "Try Pidgin, Douala, Mambar, or education",
    peopleMatches: "People matches",
    reviewMatches: "Review matches",
    noFilms: "No matching films yet.",
    noPeople: "No matching people yet.",
    noReviews: "No matching reviews yet.",
    filters: "Filters",
    genre: "Genre",
    language: "Language",
    year: "Year",
    rating: "Rating",
    allGenres: "All genres",
    allLanguages: "All languages",
    allYears: "All years",
    films: "films",
    reviews: "reviews",
  },
  fr: {
    eyebrow: "Recherche",
    title: "Trouver films, voix et critiques",
    body: "La recherche couvre titres, langues, artistes, genres et textes de critiques depuis la base de developpement.",
    placeholder: "Essayez Pidgin, Douala, Mambar ou education",
    peopleMatches: "Artistes correspondants",
    reviewMatches: "Critiques correspondantes",
    noFilms: "Aucun film correspondant.",
    noPeople: "Aucun artiste correspondant.",
    noReviews: "Aucune critique correspondante.",
    filters: "Filtres",
    genre: "Genre",
    language: "Langue",
    year: "Annee",
    rating: "Note",
    allGenres: "Tous genres",
    allLanguages: "Toutes langues",
    allYears: "Toutes annees",
    films: "films",
    reviews: "critiques",
  },
} satisfies Record<Locale, Record<string, string>>;

export function HomePageView({
  movies,
  reviews,
  genres,
  languages,
}: {
  movies: Movie[];
  reviews: Review[];
  genres: string[];
  languages: string[];
}) {
  const { locale } = useLocale();
  const [selectedMovieId, setSelectedMovieId] = useState(movies[1]?.id ?? movies[0]?.id ?? "");
  const [activeGenre, setActiveGenre] = useState("All");
  const [activeLanguage, setActiveLanguage] = useState("All");
  const t = homeCopy[locale];
  const heroMovie = movies.find((movie) => movie.id === selectedMovieId) ?? movies[1] ?? movies[0];

  const filteredMovies = useMemo(
    () =>
      movies.filter((movie) => {
        const genreMatch = activeGenre === "All" || movie.genres.includes(activeGenre);
        const languageMatch =
          activeLanguage === "All" ||
          movie.languages.some((language) => language.toLowerCase().includes(activeLanguage.toLowerCase()));

        return genreMatch && languageMatch;
      }),
    [activeGenre, activeLanguage, movies],
  );

  if (!heroMovie) {
    return (
      <main>
        <SiteHeader />
        <PageHero eyebrow={t.discover} title={t.discover} body={t.browse} />
      </main>
    );
  }

  return (
    <main>
      <SiteHeader />

      <section className="hero-shell">
        <Image src={heroMovie.backdropUrl} alt="" fill sizes="100vw" className="hero-backdrop" priority />
        <div className="hero-overlay" />

        <div className="hero-content">
          <div className="hero-copy">
            <p className="eyebrow">{t.featured}</p>
            <h1>{heroMovie.title}</h1>
            <div className="hero-facts">
              <span>{heroMovie.releaseYear}</span>
              <span>{getGenreLabel(locale, heroMovie.genres[0])}</span>
              <span>{heroMovie.country}</span>
              <span>
                {Math.floor(heroMovie.runtimeMinutes / 60)}h {heroMovie.runtimeMinutes % 60}m
              </span>
              <strong>13+</strong>
            </div>
            <p className="lede">{heroMovie.synopsis}</p>
            <div className="score-block" aria-label={`${heroMovie.rating} out of 10 Mboko score`}>
              <span>{t.score}</span>
              <strong>{heroMovie.rating.toFixed(1)}</strong>
              <em>/10</em>
              <i aria-hidden="true" />
              <Star size={18} fill="currentColor" />
              <small>
                {t.basedOn} {heroMovie.reviews} {t.reviews}
              </small>
            </div>
            <div className="hero-actions">
              <Link className="primary-action" href={`/movies/${heroMovie.slug}`}>
                <Play size={18} fill="currentColor" />
                {t.openFilm}
              </Link>
              <Link className="secondary-action" href={`/write-review/${heroMovie.slug}`}>
                <MessageSquare size={18} />
                {t.writeReview}
              </Link>
            </div>
          </div>

          <div className="festival-badge" aria-label={t.badgeTitle}>
            <span>AFRIFF</span>
            <small>{t.badgeTitle}</small>
            <strong>{heroMovie.releaseYear}</strong>
          </div>

          <blockquote>
            <p>{t.quote}</p>
            <cite>- {t.quoteSource}</cite>
          </blockquote>
        </div>
      </section>

      <section className="content-band">
        <div className="section-heading">
          <h2>{t.trending}</h2>
          <Link href="/movies">
            {t.viewAll}
            <ArrowRight size={18} />
          </Link>
        </div>

        <div className="movie-rail">
          {movies.map((movie) => (
            <button
              className={clsx("movie-card", selectedMovieId === movie.id && "is-selected")}
              key={movie.id}
              onClick={() => setSelectedMovieId(movie.id)}
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
            <Link href="/movies">{t.viewAll}</Link>
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
            <Link href="/reviews">{t.viewAll}</Link>
          </div>
          {reviews.map((review) => (
            <FreshReviewListItem key={review.id} review={review} />
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
            <span>
              {filteredMovies.length} {t.filmCount}
            </span>
          </div>
        </div>

        <div className="filter-grid" aria-label={t.filters}>
          <FilterGroup
            label={t.filters}
            options={genres}
            value={activeGenre}
            onChange={setActiveGenre}
            labelForOption={(option) => (option === "All" ? t.allGenres : getGenreLabel(locale, option))}
          />
          <FilterGroup
            label={t.filters}
            options={languages}
            value={activeLanguage}
            onChange={setActiveLanguage}
            labelForOption={(option) => (option === "All" ? t.allLanguages : getLanguageLabel(locale, option))}
          />
        </div>

        <div className="catalogue-list">
          {filteredMovies.map((movie) => (
            <MovieRow key={movie.id} movie={movie} href={`/movies/${movie.slug}`} variant="meta" />
          ))}
        </div>
      </section>
    </main>
  );
}

export function MoviesPageView({
  movies,
  genres,
  languages,
}: {
  movies: Movie[];
  genres: string[];
  languages: string[];
}) {
  const { locale } = useLocale();
  const [genre, setGenre] = useState("All");
  const [language, setLanguage] = useState("All");
  const [minimumRating, setMinimumRating] = useState(7);
  const [year, setYear] = useState("All");
  const t = moviesCopy[locale];

  const years = useMemo(() => ["All", ...Array.from(new Set(movies.map((movie) => String(movie.releaseYear))))], [movies]);
  const filteredMovies = useMemo(
    () =>
      movies.filter((movie) => {
        const genreMatch = genre === "All" || movie.genres.includes(genre);
        const languageMatch =
          language === "All" ||
          movie.languages.some((movieLanguage) => movieLanguage.toLowerCase().includes(language.toLowerCase()));
        const yearMatch = year === "All" || String(movie.releaseYear) === year;
        return genreMatch && languageMatch && yearMatch && movie.rating >= minimumRating;
      }),
    [genre, language, minimumRating, movies, year],
  );

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={t.eyebrow} title={t.title} body={t.body} />
      <section className="discover-band page-section">
        <div className="discover-heading compact-heading">
          <div>
            <p className="eyebrow">{t.filters}</p>
            <h2>
              {filteredMovies.length} {t.films}
            </h2>
          </div>
          <div className="filter-summary">
            <SlidersHorizontal size={18} />
            <span>{t.ratings}</span>
          </div>
        </div>
        <div className="filter-grid four-filters">
          <FilterGroup
            label={t.genre}
            options={genres}
            value={genre}
            onChange={setGenre}
            labelForOption={(option) => (option === "All" ? t.allGenres : getGenreLabel(locale, option))}
          />
          <FilterGroup
            label={t.language}
            options={languages}
            value={language}
            onChange={setLanguage}
            labelForOption={(option) => (option === "All" ? t.allLanguages : getLanguageLabel(locale, option))}
          />
          <FilterGroup
            label={t.year}
            options={years}
            value={year}
            onChange={setYear}
            labelForOption={(option) => (option === "All" ? t.allYears : option)}
          />
          <div className="filter-group">
            <span>{t.rating}</span>
            <label className="range-field">
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={minimumRating}
                onChange={(event) => setMinimumRating(Number(event.target.value))}
              />
              <strong>{minimumRating}+</strong>
            </label>
          </div>
        </div>
        <div className="catalogue-list">
          {filteredMovies.map((movie) => (
            <MovieRow key={movie.id} movie={movie} href={`/movies/${movie.slug}`} />
          ))}
          {filteredMovies.length === 0 ? <p className="empty-state">{t.empty}</p> : null}
        </div>
      </section>
    </main>
  );
}

export function ReviewsPageView({ movies, reviews }: { movies: Movie[]; reviews: Review[] }) {
  const { locale } = useLocale();
  const t = reviewsCopy[locale];
  const featuredReviewMovies = [...movies]
    .sort((left, right) => right.reviews - left.reviews || left.title.localeCompare(right.title))
    .slice(0, 4);

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
            {featuredReviewMovies.map((movie) => (
              <Link href={`/write-review/${movie.slug}`} key={movie.id}>
                <strong>{movie.title}</strong>
                <span>{movie.rating.toFixed(1)}/10</span>
                <LanguageBadges languages={movie.languages.slice(0, 2)} />
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}

export function SearchPageView({
  movies,
  people,
  reviews,
  genres,
  languages,
}: {
  movies: Movie[];
  people: Person[];
  reviews: Review[];
  genres: string[];
  languages: string[];
}) {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [language, setLanguage] = useState("All");
  const [year, setYear] = useState("All");
  const [minimumRating, setMinimumRating] = useState(7);
  const t = searchCopy[locale];

  const reviewMovieLookup = useMemo(() => new Map(movies.map((movie) => [movie.slug, movie])), [movies]);
  const personCreditLookup = useMemo(
    () =>
      new Map(
        people.map((person) => [
          person.slug,
          movies.filter((movie) => [...movie.cast, ...movie.crew].some((credit) => credit.personSlug === person.slug)),
        ]),
      ),
    [movies, people],
  );

  const years = useMemo(() => ["All", ...Array.from(new Set(movies.map((movie) => String(movie.releaseYear))))], [movies]);
  const normalizedQuery = query.trim().toLowerCase();
  const hasQuery = normalizedQuery.length > 0;

  const matchingMovies = useMemo(
    () =>
      movies.filter((movie) => {
        const queryMatch =
          !hasQuery ||
          [movie.title, movie.director, movie.country, movie.synopsis, ...movie.genres, ...movie.languages]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        const genreMatch = genre === "All" || movie.genres.includes(genre);
        const languageMatch =
          language === "All" ||
          movie.languages.some((movieLanguage) => movieLanguage.toLowerCase().includes(language.toLowerCase()));
        const yearMatch = year === "All" || String(movie.releaseYear) === year;

        return queryMatch && genreMatch && languageMatch && yearMatch && movie.rating >= minimumRating;
      }),
    [genre, hasQuery, language, minimumRating, movies, normalizedQuery, year],
  );

  const matchingPeople = useMemo(
    () =>
      people.filter((person) => {
        const credits = personCreditLookup.get(person.slug) ?? [];
        const queryMatch =
          !hasQuery ||
          [
            person.name,
            person.role,
            person.location,
            person.bio,
            ...person.knownFor,
            ...credits.flatMap((movie) => [movie.title, movie.director, movie.country, ...movie.genres, ...movie.languages]),
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        const genreMatch = genre === "All" || credits.some((movie) => movie.genres.includes(genre));
        const languageMatch =
          language === "All" ||
          credits.some((movie) =>
            movie.languages.some((movieLanguage) => movieLanguage.toLowerCase().includes(language.toLowerCase())),
          );
        const yearMatch = year === "All" || credits.some((movie) => String(movie.releaseYear) === year);
        const ratingMatch = credits.some((movie) => movie.rating >= minimumRating);

        return queryMatch && genreMatch && languageMatch && yearMatch && ratingMatch;
      }),
    [genre, hasQuery, language, minimumRating, normalizedQuery, people, personCreditLookup, year],
  );

  const matchingReviews = useMemo(
    () =>
      reviews.filter((review) => {
        const movie = reviewMovieLookup.get(review.movieSlug);
        const queryMatch =
          !hasQuery ||
          [review.title, review.movieTitle, review.author, review.excerpt, review.body]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);
        const genreMatch = genre === "All" || movie?.genres.includes(genre);
        const languageMatch =
          language === "All" ||
          movie?.languages.some((movieLanguage) => movieLanguage.toLowerCase().includes(language.toLowerCase()));
        const yearMatch = year === "All" || String(movie?.releaseYear ?? "") === year;
        const ratingMatch = (movie?.rating ?? 0) >= minimumRating;

        return queryMatch && genreMatch && languageMatch && yearMatch && ratingMatch;
      }),
    [genre, hasQuery, language, minimumRating, normalizedQuery, reviewMovieLookup, reviews, year],
  );

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={t.eyebrow} title={t.title} body={t.body} />
      <section className="discover-band page-section">
        <label className="search-field">
          <Search size={22} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t.placeholder} autoFocus />
        </label>
        <div className="discover-heading compact-heading">
          <div>
            <p className="eyebrow">{t.filters}</p>
            <h2>
              {matchingMovies.length} {t.films}
            </h2>
          </div>
          <div className="filter-summary">
            <SlidersHorizontal size={18} />
            <span>
              {matchingReviews.length} {t.reviews}
            </span>
          </div>
        </div>
        <div className="filter-grid four-filters">
          <SearchFilterGroup
            testId="search-filter-genre"
            label={t.genre}
            options={genres}
            value={genre}
            onChange={setGenre}
            labelForOption={(option) => (option === "All" ? t.allGenres : getGenreLabel(locale, option))}
          />
          <SearchFilterGroup
            testId="search-filter-language"
            label={t.language}
            options={languages}
            value={language}
            onChange={setLanguage}
            labelForOption={(option) => (option === "All" ? t.allLanguages : getLanguageLabel(locale, option))}
          />
          <SearchFilterGroup
            testId="search-filter-year"
            label={t.year}
            options={years}
            value={year}
            onChange={setYear}
            labelForOption={(option) => (option === "All" ? t.allYears : option)}
          />
          <div className="filter-group" data-testid="search-filter-rating">
            <span>{t.rating}</span>
            <label className="range-field">
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={minimumRating}
                onChange={(event) => setMinimumRating(Number(event.target.value))}
              />
              <strong>{minimumRating}+</strong>
            </label>
          </div>
        </div>
        <div className="catalogue-layout">
          <div className="catalogue-list">
            {matchingMovies.map((movie) => (
              <MovieRow key={movie.id} movie={movie} href={`/movies/${movie.slug}`} />
            ))}
            {matchingMovies.length === 0 ? <p className="empty-state">{t.noFilms}</p> : null}
          </div>
          <div className="sidebar-stack">
            <aside className="selected-film-panel">
              <p className="eyebrow">{t.peopleMatches}</p>
              <div className="credit-list">
                {matchingPeople.map((person) => (
                  <Link href={`/people/${person.slug}`} key={person.id}>
                    <strong>{person.name}</strong>
                    <span>
                      {getRoleLabel(locale, person.role)} / {person.location}
                    </span>
                    <ArrowRight size={17} />
                  </Link>
                ))}
                {matchingPeople.length === 0 ? <p className="empty-state">{t.noPeople}</p> : null}
              </div>
            </aside>
            <aside className="selected-film-panel">
              <p className="eyebrow">{t.reviewMatches}</p>
              <div className="stacked-list">
                {matchingReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
                {matchingReviews.length === 0 ? <p className="empty-state">{t.noReviews}</p> : null}
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
  labelForOption,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  labelForOption: (option: string) => string;
}) {
  return (
    <div className="filter-group">
      <span>{label}</span>
      <div className="segmented-scroll" role="list">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={clsx(value === option && "is-active")}
            onClick={() => onChange(option)}
          >
            {labelForOption(option)}
          </button>
        ))}
      </div>
    </div>
  );
}

function SearchFilterGroup({
  testId,
  label,
  options,
  value,
  onChange,
  labelForOption,
}: {
  testId: string;
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  labelForOption: (option: string) => string;
}) {
  return (
    <div className="filter-group" data-testid={testId}>
      <span>{label}</span>
      <div className="segmented-scroll" role="list">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={clsx(value === option && "is-active")}
            onClick={() => onChange(option)}
          >
            {labelForOption(option)}
          </button>
        ))}
      </div>
    </div>
  );
}
