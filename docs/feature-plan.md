# Cameroon Movie Review Web App Plan

## Summary
Build the product in two clear stages. Phase 1 delivers a frontend-only Next.js app with a modern cinematic UI, fully localized for English and French, with mocked data. Phase 2 adds the PostgreSQL backend, admin movie-entry workflow, authentication wiring, and persistent reviews.

The current frontend plan now also includes a targeted detail-page/media refactor: add cast headshots to credit links, add inline trailer and gallery support on movie detail pages, and consolidate repeated movie/review list markup into shared components.

## Key Changes
- Create a Next.js App Router project with TypeScript.
- Design the UI in a cinematic editorial style suited to a Cameroon-focused movie platform rather than a generic SaaS layout.
- Localize the interface in `en` and `fr`:
  - Translate all UI copy, forms, navigation, filters, validation, and empty states.
  - Keep movie content canonical in phase 1 unless explicit localized movie content is later added.
- Define frontend domain models and mock data early so they map cleanly to the future database:
  - `Movie` must include a required `languages: string[]` field.
  - `Movie` also carries seeded media fields for `trailer_embed_url`-style playback and inline gallery images in the frontend mock layer.
  - `Review` uses a 1-10 IMDb-style rating scale.
  - `Person` supports optional seeded `photoUrl` data for cast and crew portraits.
  - Supporting types include `Person`, `Genre`, `UserProfile`, `CastCredit`, `CrewCredit`, and gallery image metadata.
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
- Include reusable components for hero sections, movie cards, filters, rating widgets, review cards, fresh-review list items, language badges, navigation, responsive mobile layouts, and shared catalogue rows.

## Current Detail Refactor
- Upgrade movie detail credit links to show a cast or crew portrait when seeded data includes one, and fall back to palette/initial avatars when it does not.
- Add an inline media section to `/movies/[slug]` with:
  - embedded trailer playback when `trailerEmbedUrl` is present
  - external trailer fallback when only `trailerUrl` exists
  - a seeded still-image gallery rendered directly on the page
- Refactor repeated list markup into shared UI:
  - homepage fresh-review items become a dedicated component
  - catalogue/movie rows are shared between the homepage discover list and person credit filmography sections
- Seed local mock assets under `public/assets/people` and `public/assets/gallery` so the UI stays image-ready without remote dependencies.

## Backend and Movie Entry Plan
- Use PostgreSQL in phase 2 with normalized tables instead of storing multi-language movie data in a single text column.
- Development status:
  - PostgreSQL is now wired into the local development stack through Prisma.
  - Seed data is loaded from the original mock catalogue so development starts with the same movies, people, reviews, and profiles.
  - Public catalogue reads now come from the database for home, movies, movie detail, people, reviews, search, profile, and write-review route lookup.
  - Auth forms and the admin movie desk remain UI-first mocks until persistence and protected actions are wired in the next backend pass.
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
  - `id`, `slug`, `title`, `original_title`, `release_year`, `release_date`, `country`, `runtime_minutes`, `synopsis`, `poster_url`, `backdrop_url`, `trailer_url`, `trailer_embed_url`, `status`, `created_at`, `updated_at`
- `movie_languages` should link each movie to one or more rows in `languages`, so Cameroonian films can support multiple spoken languages cleanly.
- Admin movie-entry UI for phase 2 should support:
  - Draft/published status
  - Multiple language selection
  - Genre assignment
  - Cast and crew association
  - Poster/backdrop/trailer links
  - Searchable edit flow for existing records

## Deployment and Infrastructure Plan
- Containerize the current application stack with Docker Compose in two layers:
  - Base `compose.yaml` runs the existing Next.js app as `web` plus a PostgreSQL container as `postgres`.
  - Production `compose.prod.yaml` adds `nginx` for reverse proxying and `certbot` for Let's Encrypt certificate lifecycle tasks.
- Build the Next.js app with a multi-stage Docker image and standalone output so the runtime image only ships the production server bundle and static assets.
- Use Docker-managed persistence for PostgreSQL with a named volume; database provisioning is available immediately even while the current UI still uses mocked data.
- Terminate production traffic at Nginx:
  - Port `80` serves ACME challenges and redirects to HTTPS after certificates exist.
  - Port `443` proxies to the internal Next.js service on port `3000`.
- Share environment configuration through a root `.env` file pattern, with `.env.example` documenting:
  - `NODE_ENV`, `PORT`, `WEB_PORT`
  - `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_PORT`, `DATABASE_URL`, `DATABASE_URL_DOCKER`
  - `DOMAIN`, `LETSENCRYPT_EMAIL`
- Keep production certificate management explicit in the operator workflow:
  - Start the stack with `docker compose -f compose.yaml -f compose.prod.yaml up -d`.
  - Issue the first certificate with a one-off Certbot command against the shared webroot, for example:
    `docker compose -f compose.yaml -f compose.prod.yaml run --rm --entrypoint certbot certbot certonly --webroot -w /var/www/certbot -d $DOMAIN --email $LETSENCRYPT_EMAIL --agree-tos --no-eff-email`
  - Restart Nginx after initial issuance so it switches from HTTP-only bootstrap mode to the TLS config.
  - Reload or restart Nginx after future renewals so updated certificate files are served immediately.

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
- Frontend media contract:
  - Movie mock data may include `trailerEmbedUrl` and a seeded `galleryImages` array for the detail-page media section.
  - Person mock data may include `photoUrl` for credit-link portraits.
- Rating contract:
  - User ratings and aggregates are based on a 1-10 scale.
- Deployment contract:
  - Base Compose services are `web` and `postgres`.
  - Production Compose adds `nginx` and `certbot`.
  - Local containerized access uses host port `3000` for the web app.
  - Production public traffic enters through Nginx on ports `80` and `443`, with the Next.js container reachable only on the internal Compose network.

## Test Plan
- Verify all frontend routes render with mocked data and no backend dependency in phase 1.
- Verify the English/French switch updates interface text consistently across desktop and mobile.
- Verify every movie presentation surface shows the movie language field when available.
- Verify browse and search flows support filtering by language, genre, year, and rating in the UI.
- Verify auth and write-review screens include complete UI states for loading, validation, error, and success placeholders.
- Verify movie detail pages render the inline trailer area, gallery images, and mixed portrait/fallback credit avatars.
- Verify the shared catalogue row component still supports both linked and selectable usage patterns.
- Verify responsive behavior across mobile, tablet, and desktop.
- In phase 2, verify admin movie creation correctly persists movies and related language rows in PostgreSQL.
- In phase 2, verify a movie can be saved with multiple languages and later filtered correctly.
- Verify `docker build` succeeds for the Next.js production image.
- Verify `docker compose up` starts both `web` and `postgres`, with PostgreSQL reporting healthy.
- Verify `docker compose -f compose.yaml -f compose.prod.yaml config` resolves cleanly for the production overlay.
- Verify the HTTP-only Nginx bootstrap config serves `/.well-known/acme-challenge/` and proxies the app before certificates exist.
- Verify the TLS Nginx config validates and proxies traffic correctly after Let's Encrypt certificates are issued.

## Assumptions
- Phase 1 remains frontend-only; no live database or real auth integration is implemented yet.
- Movies are added by admins only in the initial backend version.
- The site is movie-focused first, not TV-series-focused.
- Reviews are public-facing, but stored only as mock data until phase 2.
- Detail-page media remains inline on the page in this iteration; no modal gallery or lightbox is required.
- Seeded local assets are preferred over remote image dependencies for the current mock implementation.
- Dockerized PostgreSQL is provisioned ahead of the real backend integration, but the current frontend does not query it yet.
- Production deployment uses Nginx plus Let's Encrypt rather than exposing the Next.js server directly to the internet.
