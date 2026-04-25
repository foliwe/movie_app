# Cameroon Movie Review Web App Plan

## Summary
Build the product in two clear stages. Phase 1 delivers a frontend-only Next.js app with a modern cinematic UI using Tailwind CSS and shadcn/ui, fully localized for English and French, with mocked data. Phase 2 adds the PostgreSQL backend, admin movie-entry workflow, authentication wiring, and persistent reviews. The feature reference should be saved in `docs/feature-plan.md` when implementation begins.

## Key Changes
- Create a Next.js App Router project with TypeScript, Tailwind CSS, and shadcn/ui.
- Design the UI in a cinematic editorial style suited to a Cameroon-focused movie platform rather than a generic SaaS layout.
- Localize the interface in `en` and `fr`:
  - Translate all UI copy, forms, navigation, filters, validation, and empty states.
  - Keep movie content canonical in phase 1 unless explicit localized movie content is later added.
- Define frontend domain models and mock data early so they map cleanly to the future database:
  - `Movie` must include a required `languages: string[]` field.
  - `Review` uses a 1-10 IMDb-style rating scale.
  - Supporting types include `Person`, `Genre`, `UserProfile`, `CastCredit`, and `CrewCredit`.
- Build the complete phase-1 page set with mocked data:
  - Home
  - Discover/Browse
  - Search
  - Movie details
  - Person details
  - Reviews listing/detail
  - Login, register, forgot password
  - User profile
  - Write review
- Include reusable components for hero sections, movie cards, filters, rating widgets, review cards, language badges, navigation, and responsive mobile layouts.

## Backend and Movie Entry Plan
- Use PostgreSQL in phase 2 with normalized tables instead of storing multi-language movie data in a single text column.
- Model movie creation as an admin-only workflow in v1:
  - Admin creates or edits movies from a protected dashboard.
  - Regular users can review movies, but cannot add catalog entries directly.
- Plan the core schema around:
  - `movies`
  - `languages`
  - `movie_languages`
  - `genres`
  - `movie_genres`
  - `people`
  - `movie_cast`
  - `movie_crew`
  - `reviews`
  - `users`
- `movies` should include fields like:
  - `id`, `slug`, `title`, `original_title`, `release_year`, `release_date`, `country`, `runtime_minutes`, `synopsis`, `poster_url`, `backdrop_url`, `trailer_url`, `status`, `created_at`, `updated_at`
- `movie_languages` should link each movie to one or more rows in `languages`, so Cameroonian films can support multiple spoken languages cleanly.
- Admin movie-entry UI for phase 2 should support:
  - Draft/published status
  - Multiple language selection
  - Genre assignment
  - Cast and crew association
  - Poster/backdrop/trailer links
  - Searchable edit flow for existing records

## Public Interfaces
- Planned routes:
  - `/`
  - `/movies`
  - `/movies/[slug]`
  - `/people/[slug]`
  - `/search`
  - `/reviews`
  - `/login`
  - `/register`
  - `/forgot-password`
  - `/profile/[username]`
  - `/write-review/[movieSlug]`
  - Future phase-2 admin routes under `/admin/movies`
- Language contract:
  - UI supports `en` and `fr`.
  - Movie records always include `languages` as a required multi-value field.
- Rating contract:
  - User ratings and aggregates are based on a 1-10 scale.

## Test Plan
- Verify all frontend routes render with mocked data and no backend dependency in phase 1.
- Verify the English/French switch updates interface text consistently across desktop and mobile.
- Verify every movie presentation surface shows the movie language field when available.
- Verify browse and search flows support filtering by language, genre, year, and rating in the UI.
- Verify auth and write-review screens include complete UI states for loading, validation, error, and success placeholders.
- Verify responsive behavior across mobile, tablet, and desktop.
- In phase 2, verify admin movie creation correctly persists movies and related language rows in PostgreSQL.
- In phase 2, verify a movie can be saved with multiple languages and later filtered correctly.

## Assumptions
- Phase 1 remains frontend-only; no live database or real auth integration is implemented yet.
- Movies are added by admins only in the initial backend version.
- The site is movie-focused first, not TV-series-focused.
- Reviews are public-facing, but stored only as mock data until phase 2.
- The feature reference will be written to `docs/feature-plan.md` once implementation starts.
