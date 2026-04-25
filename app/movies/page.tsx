"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import clsx from "clsx";
import { genres, languages, movies } from "@/lib/movies";
import { MovieRow, PageHero, SiteHeader } from "@/components/site";

export default function MoviesPage() {
  const [genre, setGenre] = useState("All");
  const [language, setLanguage] = useState("All");
  const [minimumRating, setMinimumRating] = useState(7);
  const [year, setYear] = useState("All");

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
      <PageHero
        eyebrow="Discover catalogue"
        title="Browse Cameroon cinema"
        body="Filter mock catalogue entries by language, genre, year, and rating before Phase 2 connects the database."
      />
      <section className="discover-band page-section">
        <div className="discover-heading compact-heading">
          <div>
            <p className="eyebrow">Filters</p>
            <h2>{filteredMovies.length} films</h2>
          </div>
          <div className="filter-summary">
            <SlidersHorizontal size={18} />
            <span>1-10 ratings</span>
          </div>
        </div>
        <div className="filter-grid four-filters">
          <FilterGroup label="Genre" options={[...genres]} value={genre} onChange={setGenre} />
          <FilterGroup label="Language" options={[...languages]} value={language} onChange={setLanguage} />
          <FilterGroup label="Year" options={years} value={year} onChange={setYear} />
          <div className="filter-group">
            <span>Rating</span>
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
          {filteredMovies.length === 0 ? <p className="empty-state">No matching films yet.</p> : null}
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
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
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
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
