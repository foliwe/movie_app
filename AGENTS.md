# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 15 + TypeScript application. Route segments and API handlers live under `app/` (`app/api/*/route.ts` for server endpoints, `app/*/page.tsx` for pages). Shared UI lives in `components/`, and server-side domain logic lives in `lib/`. Database schema, migrations, and seed data are in `prisma/`; generated Prisma output is in `generated/prisma/`. Static assets belong in `public/assets/`, end-to-end coverage is in `tests/`, and deployment files live in `compose*.yaml`, `Dockerfile`, and `nginx/`.

## Build, Test, and Development Commands
Use `npm install` to install dependencies and trigger `prisma generate`. Start local app development with `npm run dev`. Build the production bundle with `npm run build`, then validate it with `npm run start`. Lint with `npm run lint`. Database helpers: `npm run db:migrate`, `npm run db:seed`, and `npm run db:studio`. For local services, start PostgreSQL and Mailpit with `docker compose -f compose.yaml -f compose.local.yaml up -d postgres mailpit`.

## Coding Style & Naming Conventions
TypeScript runs in `strict` mode; keep new code fully typed and prefer the `@/` import alias over deep relative paths. Follow the existing style: double quotes, semicolons, and 2-space indentation. Use `PascalCase` for React components, `camelCase` for functions and variables, and kebab-case for route folders such as `app/forgot-password/`. Keep reusable server logic in `lib/` instead of inside route handlers or pages.

## Testing Guidelines
Playwright drives the automated test suite. Run `npm run test:e2e` for headless checks and `npm run test:e2e:headed` while debugging. Test files belong in `tests/` and should use the `*.spec.ts` pattern; `tests/app-smoke.spec.ts` is the current example. There is no separate unit-test layer yet, so user-visible changes should extend the E2E coverage for the affected flow.

## Commit & Pull Request Guidelines
Recent commits use short, imperative subjects such as `Fix admin media cleanup edge cases` and `Add Mailpit SMTP for password reset emails`. Keep commit titles concise, present tense, and scoped to one logical change. Pull requests should describe the user-facing impact, note schema or env changes, link the relevant issue when available, and include screenshots for UI updates.

## Security & Configuration Tips
Copy `.env.example` to `.env` and avoid committing secrets. Cloudinary, SMTP, and database settings are environment-driven; update `.env.example` whenever you introduce a new required variable. Treat generated files, `.next/`, and local screenshots as build artifacts unless a change explicitly requires them in version control.
