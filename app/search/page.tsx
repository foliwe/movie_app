"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Search, SlidersHorizontal } from "lucide-react";
import { MovieRow, PageHero, ReviewCard, SiteHeader } from "@/components/site";
import { useLocale } from "@/components/locale-provider";
import { getGenreLabel, getLanguageLabel, getRoleLabel, type Locale } from "@/lib/i18n";
import { genres, languages, movies, people, reviews } from "@/lib/movies";

const reviewMovieLookup = new Map(movies.map((movie) => [movie.slug, movie]));
const personCreditLookup = new Map(
  people.map((person) => [
    person.slug,
    movies.filter((movie) => [...movie.cast, ...movie.crew].some((credit) => credit.personSlug === person.slug)),
  ]),
);

const copy = {
  en: {
    eyebrow: "Search",
    title: "Find films, voices, and reviews",
    body: "Search spans titles, languages, people, genres, and review copy with local mock data.",
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
    body: "La recherche couvre titres, langues, artistes, genres et textes de critiques avec des donnees mock locales.",
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

export default function SearchPage() {
  const { locale } = useLocale();
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("All");
  const [language, setLanguage] = useState("All");
  const [year, setYear] = useState("All");
  const [minimumRating, setMinimumRating] = useState(7);
  const t = copy[locale];

  const years = useMemo(() => ["All", ...Array.from(new Set(movies.map((movie) => String(movie.releaseYear))))], []);
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
    [genre, hasQuery, language, minimumRating, normalizedQuery, year],
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
    [genre, hasQuery, language, minimumRating, normalizedQuery, year],
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
    [genre, hasQuery, language, minimumRating, normalizedQuery, year],
  );

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={t.eyebrow} title={t.title} body={t.body} />
      <section className="discover-band page-section">
        <label className="search-field">
          <Search size={22} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t.placeholder}
            autoFocus
          />
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
            options={[...genres]}
            value={genre}
            onChange={setGenre}
            labelForOption={(option) => (option === "All" ? t.allGenres : getGenreLabel(locale, option))}
          />
          <SearchFilterGroup
            testId="search-filter-language"
            label={t.language}
            options={[...languages]}
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
          <button key={option} type="button" className={value === option ? "is-active" : undefined} onClick={() => onChange(option)}>
            {labelForOption(option)}
          </button>
        ))}
      </div>
    </div>
  );
}
