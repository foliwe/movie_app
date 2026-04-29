import type { Movie } from "@/lib/movies";

export type PublishLabels = {
  title: string;
  slug: string;
  director: string;
  synopsis: string;
  languages: string;
  genres: string;
  posterUrl: string;
  backdropUrl: string;
};

export function getPublishChecklist(
  movie: Pick<Movie, "title" | "slug" | "director" | "synopsis" | "languages" | "genres" | "posterUrl" | "backdropUrl">,
  labels: PublishLabels,
) {
  const blockers: string[] = [];

  if (movie.title.trim().length === 0) {
    blockers.push(labels.title);
  }
  if (movie.slug.trim().length === 0) {
    blockers.push(labels.slug);
  }
  if (movie.director.trim().length === 0) {
    blockers.push(labels.director);
  }
  if (movie.synopsis.trim().length < 40) {
    blockers.push(labels.synopsis);
  }
  if (movie.languages.length === 0) {
    blockers.push(labels.languages);
  }
  if (movie.genres.length === 0) {
    blockers.push(labels.genres);
  }
  if (movie.posterUrl.trim().length === 0) {
    blockers.push(labels.posterUrl);
  }
  if (movie.backdropUrl.trim().length === 0) {
    blockers.push(labels.backdropUrl);
  }

  return blockers;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
