# Cameroon Movie Review Web App Status

## Summary
Mboko Reels is now a database-backed Next.js app for discovering Cameroonian films, writing reviews, and managing the catalogue through admin workflows. Public catalogue pages, account registration/login, persistent sessions, review publishing, review editing, review moderation, and admin movie publishing are all implemented against PostgreSQL through Prisma.

This milestone expands the signed-in account area and keeps password resets database-backed without exposing local reset helpers in the user-facing UI. Reset tokens are still generated through the app and stored as hashed single-use records for recovery flows.

## Current Product Surface
- Public routes are live for home, movies, movie detail, people, search, reviews, review detail, login, register, forgot password, reset password, profile, and write review.
- Signed-in account routes are live for profile settings, security settings, and authored reviews.
- Catalogue reads come from PostgreSQL, including movie languages, genres, cast, crew, gallery media, and seeded review content.
- Auth is persistent and session-based:
  - registration creates real users
  - login verifies hashed passwords
  - logout clears the active session
  - forgot/reset password uses database-backed reset tokens
  - signed-in members can change their password from account security settings
- Signed-in account management includes:
  - editable display name, location, bio, and favorite-language preferences
  - a shared account workspace for profile, security, and review management
- Reviews are persistent:
  - signed-in members can publish one review per movie
  - authors can edit and delete their own reviews
  - admins can review moderation state from the admin queue and manage review visibility
- Admin movie workflows are persistent:
  - admins can create draft movies
  - drafts can be edited, previewed, and published into the public catalogue
  - person, cast, crew, language, and genre relationships are normalized in the database

## Auth and Reset Contract
- Sessions use hashed opaque tokens stored in `Session`.
- Password resets use hashed opaque tokens stored in `PasswordResetToken`.
- Reset tokens are:
  - single-use
  - short-lived
  - invalidated after a successful reset
- A successful password reset revokes all active sessions for that user.
- `POST /api/auth/forgot-password` now returns a generic acknowledgement only. Real delivery or operator-visible outbox support is still needed before production rollout.

## Public Interfaces
- Auth routes:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `POST /api/auth/logout`
  - `GET /api/auth/me`
  - `POST /api/auth/forgot-password`
  - `POST /api/auth/reset-password`
  - `PATCH /api/account/profile`
  - `POST /api/account/change-password`
- Review routes:
  - `POST /api/reviews`
  - `PATCH /api/reviews/[id]`
  - `DELETE /api/reviews/[id]`
- Admin routes:
  - `POST /api/admin/movies`
  - `PATCH /api/admin/movies/[id]`
  - `DELETE /api/admin/movies/[id]`
- UI localization remains `en` and `fr`.
- Ratings remain on a `1-10` scale.

## Test Coverage
- Playwright smoke coverage verifies:
  - core route rendering
  - search and locale switching
  - registration and login
  - forgot-password validation and generic request acknowledgement
  - password reset invalid, expired, valid, and reused token behavior
  - session invalidation after password reset
  - signed-in profile editing and password changes
  - review draft restore, publish, edit, and delete flows
  - admin movie publishing and duplicate-person handling
  - admin review queue access
  - draft-movie visibility rules
  - media and credit rendering on movie detail pages

## Remaining Gaps
- Password reset delivery still needs a real email provider or operator-facing outbox for production.
- Account management still does not support changing email addresses or usernames.
- Review moderation exists, but there is no richer audit trail or moderation notes yet.
- Deployment support exists in Docker/Nginx config, but production rollout validation and operator docs can still be expanded.
