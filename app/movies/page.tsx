"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import clsx from "clsx";
import { MovieRow, PageHero, SiteHeader } from "@/components/site";
import { useLocale } from "@/components/locale-provider";
import { getGenreLabel, getLanguageLabel, type Locale } from "@/lib/i18n";
import { genres, languages, movies } from "@/lib/movies";

const copy = {
  en: {
    eyebrow: "Discover catalogue",
    title: "Browse Cameroon cinema",
    body: "Filter mock catalogue entries by language, genre, year, and rating before Phase 2 connects the database.",
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
    body: "Filtrez les titres mock par langue, genre, annee et note avant la connexion Phase 2.",
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

export default function MoviesPage() {
  const { locale } = useLocale();
  const [genre, setGenre] = useState("All");
  const [language, setLanguage] = useState("All");
  const [minimumRating, setMinimumRating] = useState(7);
  const [year, setYear] = useState("All");
  const t = copy[locale];

  const years = useMemo(() => ["All", ...Array.from(new Set(movies.map((movie) => String(movie.releaseYear))))], []);
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
    [genre, language, minimumRating, year],
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
            options={[...genres]}
            value={genre}
            onChange={setGenre}
            labelForOption={(option) => (option === "All" ? t.allGenres : getGenreLabel(locale, option))}
          />
          <FilterGroup
            label={t.language}
            options={[...languages]}
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
