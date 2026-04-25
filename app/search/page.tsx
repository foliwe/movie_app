"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { movies, reviews } from "@/lib/movies";
import { MovieRow, PageHero, ReviewCard, SiteHeader } from "@/components/site";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const matchingMovies = useMemo(
    () =>
      movies.filter((movie) =>
        [movie.title, movie.director, movie.country, movie.synopsis, ...movie.genres, ...movie.languages]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [normalizedQuery],
  );
  const matchingReviews = useMemo(
    () =>
      reviews.filter((review) =>
        [review.title, review.movieTitle, review.author, review.excerpt].join(" ").toLowerCase().includes(normalizedQuery),
      ),
    [normalizedQuery],
  );
  const hasQuery = normalizedQuery.length > 0;

  return (
    <main>
      <SiteHeader />
      <PageHero
        eyebrow="Search"
        title="Find films, voices, and reviews"
        body="Search spans titles, languages, people, genres, and review copy with local mock data."
      />
      <section className="discover-band page-section">
        <label className="search-field">
          <Search size={22} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try Pidgin, Douala, Mambar, or education"
            autoFocus
          />
        </label>
        <div className="catalogue-layout">
          <div className="catalogue-list">
            {(hasQuery ? matchingMovies : movies).map((movie) => (
              <MovieRow key={movie.id} movie={movie} href={`/movies/${movie.slug}`} />
            ))}
            {hasQuery && matchingMovies.length === 0 ? <p className="empty-state">No matching films yet.</p> : null}
          </div>
          <aside className="selected-film-panel">
            <p className="eyebrow">Review matches</p>
            <div className="stacked-list">
              {(hasQuery ? matchingReviews : reviews).map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
              {hasQuery && matchingReviews.length === 0 ? <p className="empty-state">No matching reviews yet.</p> : null}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
