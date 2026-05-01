"use client";

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, Clapperboard, ImagePlus, Loader2, Plus, Search, ShieldCheck, Sparkles, Video } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { CldUploadWidget } from "next-cloudinary";
import { LanguageBadges, MovieArtwork, MovieMeta, PageHero, PosterBlock, SiteHeader } from "@/components/site";
import { useLocale } from "@/components/locale-provider";
import { getCloudinaryUploadFolder } from "@/lib/cloudinary-media";
import {
  getGenreLabel,
  getLanguageLabel,
  getRoleLabel,
  getStatusLabel,
  getWorkflowStatusLabel,
  type Locale,
} from "@/lib/i18n";
import { getPublishChecklist, slugify } from "@/lib/admin-movie-shared";
import type { CastCredit, CrewCredit, Movie, Person } from "@/lib/movies";

type WorkflowFilter = "All" | Movie["workflowStatus"];
type Feedback = {
  tone: "success" | "error";
  message: string;
} | null;

type UploadedCloudinaryAsset = {
  secure_url: string;
  public_id: string;
  resource_type: "image" | "video";
  original_filename?: string;
};

const workflowOptions: Movie["workflowStatus"][] = ["Draft", "Published"];
const badgeOptions: Movie["status"][] = ["Published", "Festival", "Classic"];
const paletteOptions: Movie["palette"][] = ["amber", "teal", "rose", "ivory", "green"];

const copy = {
  en: {
    eyebrow: "Admin movie desk",
    title: "Create, stage, and publish catalogue entries",
    body: "Persist draft and published catalogue records directly into the development PostgreSQL database.",
    records: "catalogue records",
    drafts: "drafts",
    published: "published",
    languages: "languages covered",
    collection: "Movie library",
    collectionBody: "Search the catalogue, open an existing title, or create a new persisted draft entry.",
    newDraft: "New draft",
    searchPlaceholder: "Search title, director, language, or country",
    allEntries: "All entries",
    noMatches: "No titles match the current search.",
    selected: "Selected entry",
    selectedBody: "Changes are saved to the development database from this admin desk.",
    untitled: "Untitled draft",
    createFirst: "Create your first draft",
    createFirstBody: "No movie record is selected yet.",
    tbd: "TBD",
    workflow: "Workflow",
    publishReady: "Ready to publish",
    publishBlocked: "Publish blockers",
    basics: "Basics",
    genreLabel: "Genres",
    titleLabel: "Title",
    originalTitleLabel: "Original title",
    slugLabel: "Slug",
    directorLabel: "Director",
    countryLabel: "Country",
    releaseYearLabel: "Release year",
    releaseDateLabel: "Release date",
    runtimeLabel: "Runtime (minutes)",
    synopsisLabel: "Synopsis",
    taxonomy: "Languages and genres",
    media: "Media library",
    posterUrlLabel: "Poster URL",
    backdropUrlLabel: "Backdrop URL",
    trailerUrlLabel: "Trailer URL",
    trailerEmbedUrlLabel: "Trailer embed URL",
    trailerSourceLabel: "Trailer source",
    trailerSourceExternal: "External",
    trailerSourceCloudinary: "Cloudinary video",
    posterUpload: "Upload poster",
    backdropUpload: "Upload backdrop",
    gallery: "Gallery",
    galleryUpload: "Upload gallery images",
    galleryEmpty: "No gallery images uploaded yet.",
    galleryAltLabel: "Alt text",
    moveUp: "Move up",
    moveDown: "Move down",
    trailerUpload: "Upload trailer",
    cloudinaryPublicIdLabel: "Cloudinary public ID",
    removeAsset: "Remove",
    mediaConfigMissing: "Set the Cloudinary env vars to enable signed uploads in this admin desk.",
    mediaUploadPreparing: "Preparing uploader...",
    mediaUploadFailed: "Media upload failed.",
    publicBadge: "Public badge",
    editorPickLabel: "Editor pick",
    editorPickEnabled: "Featured in editor picks",
    editorPickDisabled: "Not featured",
    palette: "Palette",
    cast: "Cast",
    crew: "Crew",
    person: "Person",
    customName: "Display name",
    character: "Character",
    job: "Job",
    customPerson: "Custom person",
    addCast: "Add cast credit",
    addCrew: "Add crew credit",
    remove: "Remove",
    saveDraft: "Save as draft",
    publishNow: "Publish record",
    mediaAutoSaveSuccess: "Media saved automatically.",
    saveSuccess: "Draft saved to the database.",
    publishSuccess: "Record published to the database.",
    createSuccess: "Draft created in the database.",
    publishErrorPrefix: "Add the required fields before publishing:",
    preview: "Public preview",
    previewBody: "Complete the basics, languages, and genres to sharpen the catalogue-facing story.",
    previewGenres: "Genres",
    previewCast: "Cast links",
    previewCrew: "Crew links",
    previewTrailerReady: "Trailer ready",
    previewTrailerPending: "Trailer pending",
    openPublicPage: "Open public page",
    openReviewRoute: "Open review route",
    draftPrivate: "Drafts stay admin-only until published.",
    draftStatus: "Draft",
    publishedStatus: "Published",
    saving: "Saving...",
    creating: "Creating...",
  },
  fr: {
    eyebrow: "Bureau admin films",
    title: "Creer, preparer et publier les fiches catalogue",
    body: "Enregistrez les brouillons et fiches publiees directement dans la base PostgreSQL de developpement.",
    records: "fiches catalogue",
    drafts: "brouillons",
    published: "publies",
    languages: "langues couvertes",
    collection: "Bibliotheque films",
    collectionBody: "Recherchez le catalogue, ouvrez un titre existant ou creez un nouveau brouillon persiste.",
    newDraft: "Nouveau brouillon",
    searchPlaceholder: "Rechercher titre, realisateur, langue ou pays",
    allEntries: "Toutes les fiches",
    noMatches: "Aucun titre ne correspond a la recherche.",
    selected: "Fiche selectionnee",
    selectedBody: "Les changements sont enregistres dans la base de developpement depuis ce bureau admin.",
    untitled: "Brouillon sans titre",
    createFirst: "Creer un premier brouillon",
    createFirstBody: "Aucune fiche film n'est selectionnee.",
    tbd: "A definir",
    workflow: "Workflow",
    publishReady: "Pret a publier",
    publishBlocked: "Blocages publication",
    basics: "Informations",
    genreLabel: "Genres",
    titleLabel: "Titre",
    originalTitleLabel: "Titre original",
    slugLabel: "Slug",
    directorLabel: "Realisateur",
    countryLabel: "Pays",
    releaseYearLabel: "Annee de sortie",
    releaseDateLabel: "Date de sortie",
    runtimeLabel: "Duree (minutes)",
    synopsisLabel: "Synopsis",
    taxonomy: "Langues et genres",
    media: "Bibliotheque media",
    posterUrlLabel: "URL poster",
    backdropUrlLabel: "URL backdrop",
    trailerUrlLabel: "URL bande-annonce",
    trailerEmbedUrlLabel: "URL embed bande-annonce",
    trailerSourceLabel: "Source bande-annonce",
    trailerSourceExternal: "Externe",
    trailerSourceCloudinary: "Video Cloudinary",
    posterUpload: "Televerser poster",
    backdropUpload: "Televerser backdrop",
    gallery: "Galerie",
    galleryUpload: "Televerser images galerie",
    galleryEmpty: "Aucune image galerie pour le moment.",
    galleryAltLabel: "Texte alternatif",
    moveUp: "Monter",
    moveDown: "Descendre",
    trailerUpload: "Televerser bande-annonce",
    cloudinaryPublicIdLabel: "ID public Cloudinary",
    removeAsset: "Supprimer",
    mediaConfigMissing: "Ajoutez les variables Cloudinary pour activer les televersements signes dans ce bureau admin.",
    mediaUploadPreparing: "Preparation du televersement...",
    mediaUploadFailed: "Echec du televersement du media.",
    publicBadge: "Badge public",
    editorPickLabel: "Choix redaction",
    editorPickEnabled: "Mis en avant par la redaction",
    editorPickDisabled: "Non mis en avant",
    palette: "Palette",
    cast: "Distribution",
    crew: "Equipe",
    person: "Personne",
    customName: "Nom affiche",
    character: "Personnage",
    job: "Poste",
    customPerson: "Personne personnalisee",
    addCast: "Ajouter un role",
    addCrew: "Ajouter un poste",
    remove: "Supprimer",
    saveDraft: "Enregistrer en brouillon",
    publishNow: "Publier la fiche",
    mediaAutoSaveSuccess: "Les medias ont ete enregistres automatiquement.",
    saveSuccess: "Brouillon enregistre dans la base.",
    publishSuccess: "Fiche publiee dans la base.",
    createSuccess: "Brouillon cree dans la base.",
    publishErrorPrefix: "Ajoutez les champs requis avant publication :",
    preview: "Apercu public",
    previewBody: "Completez les informations, langues et genres pour affiner la presentation cote catalogue.",
    previewGenres: "Genres",
    previewCast: "Liens casting",
    previewCrew: "Liens equipe",
    previewTrailerReady: "Bande-annonce prete",
    previewTrailerPending: "Bande-annonce en attente",
    openPublicPage: "Ouvrir la page publique",
    openReviewRoute: "Ouvrir la route critique",
    draftPrivate: "Les brouillons restent reserves a l'admin jusqu'a publication.",
    draftStatus: "Brouillon",
    publishedStatus: "Publie",
    saving: "Enregistrement...",
    creating: "Creation...",
  },
} satisfies Record<Locale, Record<string, string>>;

export function AdminMoviesClient({
  initialRecords,
  people,
  languageOptions,
  genreOptions,
  cloudinaryCloudName,
  cloudinaryApiKey,
  cloudinaryUploadPreset,
}: {
  initialRecords: Movie[];
  people: Person[];
  languageOptions: string[];
  genreOptions: string[];
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryUploadPreset: string;
}) {
  const { locale } = useLocale();
  const t = copy[locale];
  const [records, setRecords] = useState<Movie[]>(initialRecords);
  const [selectedId, setSelectedId] = useState(initialRecords[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState<WorkflowFilter>("All");
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const cloudinaryEnabled =
    cloudinaryUploadPreset.trim().length > 0 && cloudinaryCloudName.trim().length > 0 && cloudinaryApiKey.trim().length > 0;

  const selectedMovie = records.find((movie) => movie.id === selectedId) ?? null;
  const normalizedQuery = query.trim().toLowerCase();

  const filteredMovies = useMemo(
    () =>
      records.filter((movie) => {
        const matchesWorkflow = workflowFilter === "All" || movie.workflowStatus === workflowFilter;
        const matchesQuery =
          normalizedQuery.length === 0 ||
          [
            movie.title,
            movie.originalTitle ?? "",
            movie.director,
            movie.country,
            movie.slug,
            ...movie.languages,
            ...movie.genres,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery);

        return matchesWorkflow && matchesQuery;
      }),
    [normalizedQuery, records, workflowFilter],
  );

  const stats = useMemo(
    () => ({
      records: records.length,
      drafts: records.filter((movie) => movie.workflowStatus === "Draft").length,
      published: records.filter((movie) => movie.workflowStatus === "Published").length,
      languages: new Set(records.flatMap((movie) => movie.languages)).size,
    }),
    [records],
  );

  const publishChecklist = selectedMovie
    ? getPublishChecklist(selectedMovie, {
        title: t.titleLabel,
        slug: t.slugLabel,
        director: t.directorLabel,
        synopsis: t.synopsisLabel,
        languages: t.languages,
        genres: t.taxonomy,
        posterUrl: t.posterUrlLabel,
        backdropUrl: t.backdropUrlLabel,
      })
    : [];

  useEffect(() => {
    setIsReady(true);
  }, []);

  function updateSelectedMovie(updater: (movie: Movie) => Movie) {
    setRecords((current) =>
      current.map((movie) => {
        if (movie.id !== selectedId) {
          return movie;
        }

        return updater(movie);
      }),
    );
    setFeedback(null);
  }

  function replaceMovieRecord(nextMovie: Movie, options?: { select?: boolean }) {
    setRecords((current) => {
      const exists = current.some((movie) => movie.id === nextMovie.id);
      if (!exists) {
        return [nextMovie, ...current];
      }

      return current.map((movie) => (movie.id === nextMovie.id ? nextMovie : movie));
    });
    if (options?.select) {
      setSelectedId(nextMovie.id);
    }
  }

  function updateField<K extends keyof Movie>(field: K, value: Movie[K]) {
    if (!selectedMovie) {
      return;
    }

    updateSelectedMovie((movie) => {
      if (field === "title") {
        const nextTitle = String(value);
        const currentSlug = movie.slug.trim();
        const generatedFromCurrentTitle = slugify(movie.title);
        const shouldSyncSlug =
          currentSlug.length === 0 ||
          currentSlug === generatedFromCurrentTitle ||
          currentSlug.startsWith("untitled-draft");

        return {
          ...movie,
          title: nextTitle,
          slug: shouldSyncSlug ? slugify(nextTitle) : movie.slug,
        };
      }

      return {
        ...movie,
        [field]: value,
      };
    });
  }

  function toggleTag(field: "genres" | "languages", value: string) {
    if (!selectedMovie) {
      return;
    }

    updateSelectedMovie((movie) => {
      const activeValues = movie[field];
      const nextValues = activeValues.includes(value)
        ? activeValues.filter((entry) => entry !== value)
        : [...activeValues, value];

      return {
        ...movie,
        [field]: nextValues,
      };
    });
  }

  function updateCredit(
    field: "cast" | "crew",
    index: number,
    key: "personSlug" | "name" | "character" | "job",
    value: string,
  ) {
    if (!selectedMovie) {
      return;
    }

    updateSelectedMovie((movie) => {
      const nextCredits = movie[field].map((credit, creditIndex) => {
        if (creditIndex !== index) {
          return credit;
        }

        if (key === "personSlug") {
          const selectedPerson = people.find((person) => person.slug === value);

          return {
            ...credit,
            personSlug: value,
            name: selectedPerson?.name ?? credit.name,
          };
        }

        return {
          ...credit,
          [key]: value,
        };
      });

      return {
        ...movie,
        [field]: nextCredits,
      };
    });
  }

  function addCredit(field: "cast" | "crew") {
    if (!selectedMovie) {
      return;
    }

    const nextCredit: CastCredit | CrewCredit =
      field === "cast"
        ? { personSlug: "", name: "", character: "" }
        : { personSlug: "", name: "", job: "" };

    updateSelectedMovie((movie) => ({
      ...movie,
      [field]: [...movie[field], nextCredit],
    }));
  }

  function removeCredit(field: "cast" | "crew", index: number) {
    if (!selectedMovie) {
      return;
    }

    updateSelectedMovie((movie) => ({
      ...movie,
      [field]: movie[field].filter((_, creditIndex) => creditIndex !== index),
    }));
  }

  function buildMovieWithUploadedAssets(
    movie: Movie,
    kind: "poster" | "backdrop" | "gallery" | "trailer",
    assets: UploadedCloudinaryAsset[],
  ): Movie {
    if (assets.length === 0) {
      return movie;
    }

    if (kind === "gallery") {
      const nextMovie: Movie = {
        ...movie,
        galleryImages: [
          ...movie.galleryImages,
          ...assets.map((asset, index) => ({
            src: asset.secure_url,
            publicId: asset.public_id,
            alt: makeGalleryAltText(movie.title, asset.original_filename, movie.galleryImages.length + index + 1),
          })),
        ],
      };

      return nextMovie;
    }

    const asset = assets[assets.length - 1];

    if (kind === "trailer") {
      const nextMovie: Movie = {
        ...movie,
        trailerUrl: asset.secure_url,
        trailerPublicId: asset.public_id,
        trailerSourceType: "Cloudinary" as const,
        trailerEmbedUrl: "",
      };

      return nextMovie;
    }

    if (kind === "poster") {
      const nextMovie: Movie = {
        ...movie,
        posterUrl: asset.secure_url,
        posterPublicId: asset.public_id,
      };

      return nextMovie;
    }

    const nextMovie: Movie = {
      ...movie,
      backdropUrl: asset.secure_url,
      backdropPublicId: asset.public_id,
    };

    return nextMovie;
  }

  function handleUploadedAssets(
    movieId: string,
    kind: "poster" | "backdrop" | "gallery" | "trailer",
    assets: UploadedCloudinaryAsset[],
  ) {
    if (assets.length === 0) {
      return;
    }

    let nextMovie: Movie | undefined;

    setRecords((current) =>
      current.map((movie) => {
        if (movie.id !== movieId) {
          return movie;
        }

        const updatedMovie = buildMovieWithUploadedAssets(movie, kind, assets);
        nextMovie = updatedMovie;
        return updatedMovie;
      }),
    );

    const movieToPersist = nextMovie;
    if (!movieToPersist) {
      return;
    }

    void persistMovie(movieToPersist.workflowStatus === "Published" ? "publish" : "draft", {
      movie: movieToPersist,
      successMessage: t.mediaAutoSaveSuccess,
    });
  }

  function removeMedia(kind: "poster" | "backdrop" | "trailer") {
    if (!selectedMovie) {
      return;
    }

    updateSelectedMovie((movie) => {
      if (kind === "poster") {
        return {
          ...movie,
          posterUrl: "",
          posterPublicId: undefined,
        };
      }

      if (kind === "backdrop") {
        return {
          ...movie,
          backdropUrl: "",
          backdropPublicId: undefined,
        };
      }

      return {
        ...movie,
        trailerUrl: "",
        trailerPublicId: undefined,
        trailerSourceType: "External",
        trailerEmbedUrl: "",
      };
    });
  }

  function updateGalleryImage(index: number, key: "alt", value: string) {
    if (!selectedMovie) {
      return;
    }

    updateSelectedMovie((movie) => ({
      ...movie,
      galleryImages: movie.galleryImages.map((image, imageIndex) =>
        imageIndex === index
          ? {
              ...image,
              [key]: value,
            }
          : image,
      ),
    }));
  }

  function moveGalleryImage(index: number, direction: -1 | 1) {
    if (!selectedMovie) {
      return;
    }

    updateSelectedMovie((movie) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= movie.galleryImages.length) {
        return movie;
      }

      const nextImages = [...movie.galleryImages];
      const [image] = nextImages.splice(index, 1);
      nextImages.splice(targetIndex, 0, image);

      return {
        ...movie,
        galleryImages: nextImages,
      };
    });
  }

  function removeGalleryImage(index: number) {
    if (!selectedMovie) {
      return;
    }

    updateSelectedMovie((movie) => ({
      ...movie,
      galleryImages: movie.galleryImages.filter((_, imageIndex) => imageIndex !== index),
    }));
  }

  async function createDraft() {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/movies", {
        method: "POST",
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to create draft.");
      }

      replaceMovieRecord(payload as Movie, { select: true });
      setWorkflowFilter("All");
      setFeedback({
        tone: "success",
        message: t.createSuccess,
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Failed to create draft.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function persistMovie(
    mode: "draft" | "publish",
    options?: {
      movie?: Movie | null;
      successMessage?: string;
    },
  ) {
    const movieToPersist = options?.movie ?? selectedMovie;
    if (!movieToPersist) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/movies/${movieToPersist.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode,
          movie: movieToPersist,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message ?? "Failed to save movie.");
      }

      replaceMovieRecord(payload as Movie);
      setFeedback({
        tone: "success",
        message: options?.successMessage ?? (mode === "publish" ? t.publishSuccess : t.saveSuccess),
      });
    } catch (error) {
      setFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "Failed to save movie.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={t.eyebrow} title={t.title} body={t.body} />

      <section className="discover-band page-section admin-shell">
        <div className="admin-stats">
          <MetricCard label={t.records} value={stats.records} icon={<Clapperboard size={18} />} />
          <MetricCard label={t.drafts} value={stats.drafts} icon={<Sparkles size={18} />} />
          <MetricCard label={t.published} value={stats.published} icon={<ShieldCheck size={18} />} />
          <MetricCard label={t.languages} value={stats.languages} icon={<CheckCircle2 size={18} />} />
        </div>

        <div className="admin-layout">
          <aside className="panel admin-sidebar">
            <div className="panel-heading admin-heading">
              <div>
                <h2>{t.collection}</h2>
                <p>{t.collectionBody}</p>
              </div>
              <button className="admin-action-button" type="button" onClick={createDraft} disabled={!isReady || isSubmitting}>
                {isSubmitting ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
                {isSubmitting ? t.creating : t.newDraft}
              </button>
            </div>

            <label className="search-field admin-search-field">
              <Search size={20} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t.searchPlaceholder}
              />
            </label>

            <div className="admin-filter-row" aria-label={t.workflow}>
              {(["All", ...workflowOptions] as WorkflowFilter[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  className={clsx("admin-filter-chip", workflowFilter === status && "is-active")}
                  aria-pressed={workflowFilter === status}
                  onClick={() => setWorkflowFilter(status)}
                >
                  {status === "All" ? t.allEntries : getWorkflowStatusLabel(locale, status)}
                </button>
              ))}
            </div>

            <div className="admin-movie-list">
              {filteredMovies.map((movie) => (
                <button
                  key={movie.id}
                  type="button"
                  className={clsx("admin-movie-card", selectedId === movie.id && "is-selected")}
                  onClick={() => setSelectedId(movie.id)}
                >
                  <MovieArtwork movie={movie} className="admin-palette" variant="posterSidebar" hideTitleWhenImage />
                  <div className="admin-movie-copy">
                    <div className="admin-movie-topline">
                      <strong>{movie.title || t.untitled}</strong>
                      <span className={clsx("admin-status-pill", movie.workflowStatus === "Published" && "is-live")}>
                        {getWorkflowStatusLabel(locale, movie.workflowStatus)}
                      </span>
                    </div>
                    <p>
                      {movie.director || t.tbd} / {movie.releaseYear}
                    </p>
                    <small>
                      {movie.languages.length > 0
                        ? movie.languages.map((language) => getLanguageLabel(locale, language)).join(", ")
                        : t.languages}
                    </small>
                  </div>
                </button>
              ))}
              {filteredMovies.length === 0 ? <p className="empty-state">{t.noMatches}</p> : null}
            </div>
          </aside>

          <section className="panel admin-editor">
            {selectedMovie ? (
              <>
                <div className="panel-heading admin-heading">
                  <div>
                    <h2>{t.selected}</h2>
                    <p>{t.selectedBody}</p>
                  </div>
                  <div className="admin-heading-meta">
                    <span className="admin-status-label">{getStatusLabel(locale, selectedMovie.status)}</span>
                    <span className={clsx("admin-status-pill", selectedMovie.workflowStatus === "Published" && "is-live")}>
                      {getWorkflowStatusLabel(locale, selectedMovie.workflowStatus)}
                    </span>
                  </div>
                </div>

                {feedback ? (
                  <p className={clsx("form-message", feedback.tone === "success" ? "success" : "error")}>
                    <CheckCircle2 size={18} />
                    {feedback.message}
                  </p>
                ) : null}

                <div className="admin-readiness">
                  <div>
                    <span>{publishChecklist.length === 0 ? t.publishReady : t.publishBlocked}</span>
                    <strong>
                      {publishChecklist.length === 0 ? t.publishedStatus : String(publishChecklist.length)}
                    </strong>
                  </div>
                  <p>
                    {publishChecklist.length === 0
                      ? selectedMovie.slug
                      : publishChecklist.map((entry) => entry.toLowerCase()).join(" / ")}
                  </p>
                </div>

                <section className="admin-section">
                  <div className="admin-section-heading">
                    <h3>{t.basics}</h3>
                    <span>{t.workflow}</span>
                  </div>

                  <div className="admin-form-grid">
                    <Field label={t.titleLabel}>
                      <input value={selectedMovie.title} onChange={(event) => updateField("title", event.target.value)} />
                    </Field>
                    <Field label={t.originalTitleLabel}>
                      <input
                        value={selectedMovie.originalTitle ?? ""}
                        onChange={(event) => updateField("originalTitle", event.target.value)}
                      />
                    </Field>
                    <Field label={t.slugLabel}>
                      <input value={selectedMovie.slug} onChange={(event) => updateField("slug", slugify(event.target.value))} />
                    </Field>
                    <Field label={t.directorLabel}>
                      <input value={selectedMovie.director} onChange={(event) => updateField("director", event.target.value)} />
                    </Field>
                    <Field label={t.countryLabel}>
                      <input value={selectedMovie.country} onChange={(event) => updateField("country", event.target.value)} />
                    </Field>
                    <Field label={t.releaseYearLabel}>
                      <input
                        type="number"
                        min="1900"
                        max="2100"
                        value={selectedMovie.releaseYear}
                        onChange={(event) => updateField("releaseYear", Number(event.target.value) || 0)}
                      />
                    </Field>
                    <Field label={t.releaseDateLabel}>
                      <input
                        type="date"
                        value={selectedMovie.releaseDate ?? ""}
                        onChange={(event) => updateField("releaseDate", event.target.value)}
                      />
                    </Field>
                    <Field label={t.runtimeLabel}>
                      <input
                        type="number"
                        min="1"
                        value={selectedMovie.runtimeMinutes}
                        onChange={(event) => updateField("runtimeMinutes", Number(event.target.value) || 0)}
                      />
                    </Field>
                  </div>

                  <Field label={t.synopsisLabel}>
                    <textarea
                      value={selectedMovie.synopsis}
                      onChange={(event) => updateField("synopsis", event.target.value)}
                    />
                  </Field>
                </section>

                <section className="admin-section">
                  <div className="admin-section-heading">
                    <h3>{t.taxonomy}</h3>
                    <span>{t.publicBadge}</span>
                  </div>

                  <div className="admin-tag-grid">
                    <Field label={t.languages}>
                      <div className="admin-chip-grid">
                        {languageOptions.map((language) => (
                          <button
                            key={language}
                            type="button"
                            className={clsx("admin-toggle-chip", selectedMovie.languages.includes(language) && "is-active")}
                            aria-pressed={selectedMovie.languages.includes(language)}
                            onClick={() => toggleTag("languages", language)}
                          >
                            {getLanguageLabel(locale, language)}
                          </button>
                        ))}
                      </div>
                    </Field>

                    <Field label={t.genreLabel}>
                      <div className="admin-chip-grid">
                        {genreOptions.map((genre) => (
                          <button
                            key={genre}
                            type="button"
                            className={clsx("admin-toggle-chip", selectedMovie.genres.includes(genre) && "is-active")}
                            aria-pressed={selectedMovie.genres.includes(genre)}
                            onClick={() => toggleTag("genres", genre)}
                          >
                            {getGenreLabel(locale, genre)}
                          </button>
                        ))}
                      </div>
                    </Field>
                  </div>

                  <div className="admin-form-grid">
                    <Field label={t.workflow}>
                      <select
                        value={selectedMovie.workflowStatus}
                        onChange={(event) =>
                          updateField("workflowStatus", event.target.value as Movie["workflowStatus"])
                        }
                      >
                        {workflowOptions.map((status) => (
                          <option key={status} value={status}>
                            {getWorkflowStatusLabel(locale, status)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t.publicBadge}>
                      <select value={selectedMovie.status} onChange={(event) => updateField("status", event.target.value as Movie["status"])}>
                        {badgeOptions.map((status) => (
                          <option key={status} value={status}>
                            {getStatusLabel(locale, status)}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label={t.editorPickLabel}>
                      <button
                        type="button"
                        className={clsx("admin-toggle-chip", selectedMovie.editorPick && "is-active")}
                        aria-pressed={selectedMovie.editorPick}
                        onClick={() => updateField("editorPick", !selectedMovie.editorPick)}
                      >
                        {selectedMovie.editorPick ? t.editorPickEnabled : t.editorPickDisabled}
                      </button>
                    </Field>
                    <Field label={t.palette}>
                      <select
                        value={selectedMovie.palette}
                        onChange={(event) => updateField("palette", event.target.value as Movie["palette"])}
                      >
                        {paletteOptions.map((palette) => (
                          <option key={palette} value={palette}>
                            {palette}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </section>

                <section className="admin-section">
                  <div className="admin-section-heading">
                    <h3>{t.media}</h3>
                    <span>{selectedMovie.slug}</span>
                  </div>

                  {!cloudinaryEnabled ? <p className="admin-note">{t.mediaConfigMissing}</p> : null}

                  <div className="admin-media-grid">
                    <div className="admin-media-card">
                      <div className="admin-section-heading admin-subsection-heading">
                        <h4>{t.posterUrlLabel}</h4>
                        {selectedMovie.posterUrl ? (
                          <button className="admin-remove-button" type="button" onClick={() => removeMedia("poster")}>
                            {t.removeAsset}
                          </button>
                        ) : null}
                      </div>
                      <MediaUploadButton
                        key={`${selectedMovie.id}-poster-upload`}
                        disabled={!cloudinaryEnabled || !isReady || isSubmitting}
                        label={t.posterUpload}
                        icon={<ImagePlus size={16} />}
                        cloudinaryCloudName={cloudinaryCloudName}
                        cloudinaryApiKey={cloudinaryApiKey}
                        uploadPreset={cloudinaryUploadPreset}
                      options={{
                        folder: getCloudinaryUploadFolder(selectedMovie.id, "poster"),
                        multiple: false,
                        resourceType: "image",
                      }}
                      onUploaded={(assets) => handleUploadedAssets(selectedMovie.id, "poster", assets)}
                      onUploadError={(message) => setFeedback({ tone: "error", message })}
                      loadingLabel={t.mediaUploadPreparing}
                    />
                      <Field label={t.posterUrlLabel}>
                        <input value={selectedMovie.posterUrl} onChange={(event) => updateField("posterUrl", event.target.value)} />
                      </Field>
                      <Field label={t.cloudinaryPublicIdLabel}>
                        <input
                          value={selectedMovie.posterPublicId ?? ""}
                          onChange={(event) => updateField("posterPublicId", event.target.value)}
                        />
                      </Field>
                    </div>

                    <div className="admin-media-card">
                      <div className="admin-section-heading admin-subsection-heading">
                        <h4>{t.backdropUrlLabel}</h4>
                        {selectedMovie.backdropUrl ? (
                          <button className="admin-remove-button" type="button" onClick={() => removeMedia("backdrop")}>
                            {t.removeAsset}
                          </button>
                        ) : null}
                      </div>
                      <MediaUploadButton
                        key={`${selectedMovie.id}-backdrop-upload`}
                        disabled={!cloudinaryEnabled || !isReady || isSubmitting}
                        label={t.backdropUpload}
                        icon={<ImagePlus size={16} />}
                        cloudinaryCloudName={cloudinaryCloudName}
                        cloudinaryApiKey={cloudinaryApiKey}
                        uploadPreset={cloudinaryUploadPreset}
                      options={{
                        folder: getCloudinaryUploadFolder(selectedMovie.id, "backdrop"),
                        multiple: false,
                        resourceType: "image",
                      }}
                      onUploaded={(assets) => handleUploadedAssets(selectedMovie.id, "backdrop", assets)}
                      onUploadError={(message) => setFeedback({ tone: "error", message })}
                      loadingLabel={t.mediaUploadPreparing}
                    />
                      <Field label={t.backdropUrlLabel}>
                        <input
                          value={selectedMovie.backdropUrl}
                          onChange={(event) => updateField("backdropUrl", event.target.value)}
                        />
                      </Field>
                      <Field label={t.cloudinaryPublicIdLabel}>
                        <input
                          value={selectedMovie.backdropPublicId ?? ""}
                          onChange={(event) => updateField("backdropPublicId", event.target.value)}
                        />
                      </Field>
                    </div>
                  </div>

                  <div className="admin-media-card admin-media-card-wide">
                    <div className="admin-section-heading admin-subsection-heading">
                      <h4>{t.trailerSourceLabel}</h4>
                      {selectedMovie.trailerUrl ? (
                        <button className="admin-remove-button" type="button" onClick={() => removeMedia("trailer")}>
                          {t.removeAsset}
                        </button>
                      ) : null}
                    </div>
                    <div className="admin-form-grid">
                      <Field label={t.trailerSourceLabel}>
                        <select
                          value={selectedMovie.trailerSourceType}
                          onChange={(event) => {
                            const nextSource = event.target.value as Movie["trailerSourceType"];
                            updateSelectedMovie((movie) => ({
                              ...movie,
                              trailerSourceType: nextSource,
                              trailerPublicId: nextSource === "External" ? undefined : movie.trailerPublicId,
                              trailerEmbedUrl: nextSource === "Cloudinary" ? "" : movie.trailerEmbedUrl,
                            }));
                          }}
                        >
                          <option value="External">{t.trailerSourceExternal}</option>
                          <option value="Cloudinary">{t.trailerSourceCloudinary}</option>
                        </select>
                      </Field>
                      {selectedMovie.trailerSourceType === "External" ? (
                        <Field label={t.trailerEmbedUrlLabel}>
                          <input
                            value={selectedMovie.trailerEmbedUrl ?? ""}
                            onChange={(event) => updateField("trailerEmbedUrl", event.target.value)}
                          />
                        </Field>
                      ) : (
                        <Field label={t.cloudinaryPublicIdLabel}>
                          <input
                            value={selectedMovie.trailerPublicId ?? ""}
                            onChange={(event) => updateField("trailerPublicId", event.target.value)}
                          />
                        </Field>
                      )}
                    </div>
                    {selectedMovie.trailerSourceType === "Cloudinary" ? (
                      <MediaUploadButton
                        key={`${selectedMovie.id}-trailer-upload`}
                        disabled={!cloudinaryEnabled || !isReady || isSubmitting}
                        label={t.trailerUpload}
                        icon={<Video size={16} />}
                        cloudinaryCloudName={cloudinaryCloudName}
                        cloudinaryApiKey={cloudinaryApiKey}
                        uploadPreset={cloudinaryUploadPreset}
                        options={{
                          folder: getCloudinaryUploadFolder(selectedMovie.id, "trailers"),
                          multiple: false,
                          resourceType: "video",
                        }}
                        onUploaded={(assets) => handleUploadedAssets(selectedMovie.id, "trailer", assets)}
                        onUploadError={(message) => setFeedback({ tone: "error", message })}
                        loadingLabel={t.mediaUploadPreparing}
                      />
                    ) : null}
                    <Field label={t.trailerUrlLabel}>
                      <input value={selectedMovie.trailerUrl} onChange={(event) => updateField("trailerUrl", event.target.value)} />
                    </Field>
                  </div>

                  <div className="admin-media-card admin-media-card-wide">
                    <div className="admin-section-heading admin-subsection-heading">
                      <h4>{t.gallery}</h4>
                      <span>{selectedMovie.galleryImages.length}</span>
                    </div>
                    <MediaUploadButton
                      key={`${selectedMovie.id}-gallery-upload`}
                      disabled={!cloudinaryEnabled || !isReady || isSubmitting}
                      label={t.galleryUpload}
                      icon={<ImagePlus size={16} />}
                      cloudinaryCloudName={cloudinaryCloudName}
                      cloudinaryApiKey={cloudinaryApiKey}
                      uploadPreset={cloudinaryUploadPreset}
                      options={{
                        folder: getCloudinaryUploadFolder(selectedMovie.id, "gallery"),
                        multiple: true,
                        resourceType: "image",
                      }}
                      onUploaded={(assets) => handleUploadedAssets(selectedMovie.id, "gallery", assets)}
                      onUploadError={(message) => setFeedback({ tone: "error", message })}
                      loadingLabel={t.mediaUploadPreparing}
                    />
                    {selectedMovie.galleryImages.length > 0 ? (
                      <div className="admin-gallery-list">
                        {selectedMovie.galleryImages.map((image, index) => (
                          <div className="admin-gallery-item" key={`${image.src}-${index}`}>
                            <div className="admin-gallery-meta">
                              <strong>{image.publicId ?? image.src}</strong>
                              <div className="admin-gallery-actions">
                                <button
                                  className="admin-inline-button"
                                  type="button"
                                  onClick={() => moveGalleryImage(index, -1)}
                                  disabled={index === 0}
                                >
                                  <ArrowUp size={14} />
                                  {t.moveUp}
                                </button>
                                <button
                                  className="admin-inline-button"
                                  type="button"
                                  onClick={() => moveGalleryImage(index, 1)}
                                  disabled={index === selectedMovie.galleryImages.length - 1}
                                >
                                  <ArrowDown size={14} />
                                  {t.moveDown}
                                </button>
                                <button className="admin-remove-button" type="button" onClick={() => removeGalleryImage(index)}>
                                  {t.removeAsset}
                                </button>
                              </div>
                            </div>
                            <Field label={t.galleryAltLabel}>
                              <input value={image.alt} onChange={(event) => updateGalleryImage(index, "alt", event.target.value)} />
                            </Field>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="admin-note">{t.galleryEmpty}</p>
                    )}
                  </div>
                </section>

                <section className="admin-section">
                  <div className="admin-section-heading">
                    <h3>{t.preview}</h3>
                    <span>{selectedMovie.slug || t.untitled}</span>
                  </div>

                  <div className="admin-preview-card" data-testid="admin-preview-card">
                    <div className="admin-preview-grid">
                      <PosterBlock movie={selectedMovie} className="selected-poster admin-preview-poster" variant="posterAdminPreview" />

                      <div className="admin-preview-copy">
                        <p className="eyebrow">{t.preview}</p>
                        <h3>{selectedMovie.title || t.untitled}</h3>
                        <MovieMeta movie={selectedMovie} />
                        <p>{selectedMovie.synopsis.trim().length > 0 ? selectedMovie.synopsis : t.previewBody}</p>
                        {selectedMovie.languages.length > 0 ? <LanguageBadges languages={selectedMovie.languages} /> : null}

                        <div className="admin-preview-actions">
                          {selectedMovie.workflowStatus === "Published" ? (
                            <>
                              <Link className="detail-action" href={`/movies/${selectedMovie.slug}`}>
                                {t.openPublicPage}
                              </Link>
                              <Link className="detail-action admin-preview-secondary" href={`/write-review/${selectedMovie.slug}`}>
                                {t.openReviewRoute}
                              </Link>
                            </>
                          ) : (
                            <p className="admin-preview-note">{t.draftPrivate}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <dl className="admin-preview-facts">
                      <div>
                        <dt>{t.previewGenres}</dt>
                        <dd>
                          {selectedMovie.genres.length > 0
                            ? selectedMovie.genres.map((genre) => getGenreLabel(locale, genre)).join(", ")
                            : t.taxonomy}
                        </dd>
                      </div>
                      <div>
                        <dt>{t.previewCast}</dt>
                        <dd>{selectedMovie.cast.length}</dd>
                      </div>
                      <div>
                        <dt>{t.previewCrew}</dt>
                        <dd>{selectedMovie.crew.length}</dd>
                      </div>
                      <div>
                        <dt>{t.media}</dt>
                        <dd>{selectedMovie.trailerUrl.trim().length > 0 ? t.previewTrailerReady : t.previewTrailerPending}</dd>
                      </div>
                    </dl>
                  </div>
                </section>

                <section className="admin-section">
                  <div className="admin-section-heading">
                    <h3>{t.cast}</h3>
                    <button className="admin-inline-button" type="button" onClick={() => addCredit("cast")}>
                      <Plus size={14} />
                      {t.addCast}
                    </button>
                  </div>

                  <CreditList
                    credits={selectedMovie.cast}
                    locale={locale}
                    people={people}
                    onChange={updateCredit}
                    onRemove={removeCredit}
                    t={t}
                    type="cast"
                  />
                </section>

                <section className="admin-section">
                  <div className="admin-section-heading">
                    <h3>{t.crew}</h3>
                    <button className="admin-inline-button" type="button" onClick={() => addCredit("crew")}>
                      <Plus size={14} />
                      {t.addCrew}
                    </button>
                  </div>

                  <CreditList
                    credits={selectedMovie.crew}
                    locale={locale}
                    people={people}
                    onChange={updateCredit}
                    onRemove={removeCredit}
                    t={t}
                    type="crew"
                  />
                </section>

                <div className="admin-form-actions">
                  <button className="secondary-action admin-form-button" type="button" onClick={() => persistMovie("draft")} disabled={!isReady || isSubmitting}>
                    {isSubmitting ? t.saving : t.saveDraft}
                  </button>
                  <button className="primary-action admin-form-button" type="button" onClick={() => persistMovie("publish")} disabled={!isReady || isSubmitting}>
                    {isSubmitting ? t.saving : t.publishNow}
                  </button>
                </div>
              </>
            ) : (
              <div className="admin-empty-editor">
                <h2>{t.createFirst}</h2>
                <p>{t.createFirstBody}</p>
                <button className="primary-action admin-form-button" type="button" onClick={createDraft} disabled={!isReady || isSubmitting}>
                  {isSubmitting ? t.creating : t.newDraft}
                </button>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <article className="admin-metric-card">
      <span>{icon}</span>
      <strong>{value}</strong>
      <small>{label}</small>
    </article>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function CreditList({
  credits,
  locale,
  people,
  onChange,
  onRemove,
  t,
  type,
}: {
  credits: CastCredit[] | CrewCredit[];
  locale: Locale;
  people: Person[];
  onChange: (
    field: "cast" | "crew",
    index: number,
    key: "personSlug" | "name" | "character" | "job",
    value: string,
  ) => void;
  onRemove: (field: "cast" | "crew", index: number) => void;
  t: Record<string, string>;
  type: "cast" | "crew";
}) {
  if (credits.length === 0) {
    return <p className="admin-note">{type === "cast" ? t.addCast : t.addCrew}</p>;
  }

  return (
    <div className="admin-credit-list">
      {credits.map((credit, index) => (
        <div className="admin-credit-row" key={`${type}-${index}`}>
          <Field label={t.person}>
            <select value={credit.personSlug} onChange={(event) => onChange(type, index, "personSlug", event.target.value)}>
              <option value="">{t.customPerson}</option>
              {people.map((person) => (
                <option key={person.slug} value={person.slug}>
                  {person.name} · {getRoleLabel(locale, person.role)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t.customName}>
            <input value={credit.name} onChange={(event) => onChange(type, index, "name", event.target.value)} />
          </Field>
          <Field label={type === "cast" ? t.character : t.job}>
            <input
              value={type === "cast" ? (credit as CastCredit).character : (credit as CrewCredit).job}
              onChange={(event) => onChange(type, index, type === "cast" ? "character" : "job", event.target.value)}
            />
          </Field>
          <button className="admin-remove-button" type="button" onClick={() => onRemove(type, index)}>
            {t.remove}
          </button>
        </div>
      ))}
    </div>
  );
}

function MediaUploadButton({
  disabled,
  label,
  loadingLabel,
  icon,
  cloudinaryCloudName,
  cloudinaryApiKey,
  uploadPreset,
  options,
  onUploaded,
  onUploadError,
}: {
  disabled: boolean;
  label: string;
  loadingLabel: string;
  icon: ReactNode;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  uploadPreset: string;
  options: Record<string, unknown>;
  onUploaded: (assets: UploadedCloudinaryAsset[]) => void;
  onUploadError?: (message: string) => void;
}) {
  const uploadedAssetsRef = useRef<UploadedCloudinaryAsset[]>([]);

  if (uploadPreset.trim().length === 0) {
    return (
      <button className="admin-action-button" type="button" disabled>
        {icon}
        {label}
      </button>
    );
  }

  return (
    <CldUploadWidget
      config={{
        cloud: {
          cloudName: cloudinaryCloudName,
          apiKey: cloudinaryApiKey,
        },
      }}
      signatureEndpoint="/api/cloudinary/sign"
      uploadPreset={uploadPreset}
      options={options}
      onError={(error) => {
        uploadedAssetsRef.current = [];
        onUploadError?.(extractUploadErrorMessage(error));
      }}
      onSuccess={(result) => {
        const asset = extractUploadedAsset(result);
        if (asset) {
          uploadedAssetsRef.current = [...uploadedAssetsRef.current, asset];
        }
      }}
      onQueuesEnd={(_result, { widget }) => {
        const uploadedAssets = uploadedAssetsRef.current;
        uploadedAssetsRef.current = [];
        widget.close();
        if (uploadedAssets.length > 0) {
          onUploaded(uploadedAssets);
        }
      }}
    >
      {({ open, isLoading }) => (
        <button
          className="admin-action-button"
          type="button"
          onClick={() => {
            if (!isLoading) {
              open();
            }
          }}
          disabled={disabled || Boolean(isLoading)}
        >
          {icon}
          {isLoading ? loadingLabel : label}
        </button>
      )}
    </CldUploadWidget>
  );
}

function extractUploadedAsset(result: unknown): UploadedCloudinaryAsset | null {
  if (!result || typeof result !== "object" || !("info" in result)) {
    return null;
  }

  const info = (result as { info?: unknown }).info;
  if (!info || typeof info !== "object") {
    return null;
  }

  const secureUrl = "secure_url" in info && typeof info.secure_url === "string" ? info.secure_url : null;
  const publicId = "public_id" in info && typeof info.public_id === "string" ? info.public_id : null;
  const resourceType =
    "resource_type" in info && (info.resource_type === "image" || info.resource_type === "video")
      ? info.resource_type
      : null;
  const originalFilename =
    "original_filename" in info && typeof info.original_filename === "string" ? info.original_filename : undefined;

  if (!secureUrl || !publicId || !resourceType) {
    return null;
  }

  return {
    secure_url: secureUrl,
    public_id: publicId,
    resource_type: resourceType,
    original_filename: originalFilename,
  };
}

function makeGalleryAltText(movieTitle: string, originalFilename?: string, position = 1) {
  const source = (originalFilename ?? `still-${position}`).replace(/[-_]+/g, " ").trim();
  return `${movieTitle || "Movie"} still ${position}: ${source}`;
}

function extractUploadErrorMessage(error: unknown) {
  if (error && typeof error === "object") {
    if ("statusText" in error && typeof error.statusText === "string" && error.statusText.trim().length > 0) {
      return error.statusText;
    }

    if ("message" in error && typeof error.message === "string" && error.message.trim().length > 0) {
      return error.message;
    }
  }

  return copy.en.mediaUploadFailed;
}
