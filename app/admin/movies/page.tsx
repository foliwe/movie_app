"use client";

import { type ReactNode, useMemo, useState } from "react";
import { CheckCircle2, Clapperboard, Plus, Search, ShieldCheck, Sparkles } from "lucide-react";
import clsx from "clsx";
import Link from "next/link";
import { LanguageBadges, MovieMeta, PageHero, PosterBlock, SiteHeader } from "@/components/site";
import { useLocale } from "@/components/locale-provider";
import {
  getGenreLabel,
  getLanguageLabel,
  getRoleLabel,
  getStatusLabel,
  getWorkflowStatusLabel,
  type Locale,
} from "@/lib/i18n";
import { languages, movies, people, type CastCredit, type CrewCredit, type Movie, genres } from "@/lib/movies";

type WorkflowFilter = "All" | Movie["workflowStatus"];
type Feedback = {
  tone: "success" | "error";
  message: string;
} | null;

const genreOptions = genres.filter((genre) => genre !== "All");
const languageOptions = languages.filter((language) => language !== "All");
const workflowOptions: Movie["workflowStatus"][] = ["Draft", "Published"];
const badgeOptions: Movie["status"][] = ["Published", "Festival", "Classic"];
const paletteOptions: Movie["palette"][] = ["amber", "teal", "rose", "ivory", "green"];

const copy = {
  en: {
    eyebrow: "Admin movie desk",
    title: "Create, stage, and publish catalogue entries",
    body: "Phase 2 mock admin workflow for managing movie records, linking languages and genres, and preparing cast and crew data before the PostgreSQL backend is wired in.",
    records: "catalogue records",
    drafts: "drafts",
    published: "published",
    languages: "languages covered",
    collection: "Movie library",
    collectionBody: "Search the catalogue, open an existing title, or spin up a new draft entry.",
    newDraft: "New draft",
    searchPlaceholder: "Search title, director, language, or country",
    allEntries: "All entries",
    noMatches: "No titles match the current search.",
    selected: "Selected entry",
    selectedBody: "Changes stay in local state for this Phase 2 admin demo.",
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
    media: "Media links",
    posterUrlLabel: "Poster URL",
    backdropUrlLabel: "Backdrop URL",
    trailerUrlLabel: "Trailer URL",
    publicBadge: "Public badge",
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
    saveSuccess: "Draft saved locally.",
    publishSuccess: "Record published locally.",
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
    draftStatus: "Draft",
    publishedStatus: "Published",
  },
  fr: {
    eyebrow: "Bureau admin films",
    title: "Creer, preparer et publier les fiches catalogue",
    body: "Workflow admin mock de la Phase 2 pour gerer les fiches films, lier langues et genres, et preparer les donnees casting/equipe avant le branchement PostgreSQL.",
    records: "fiches catalogue",
    drafts: "brouillons",
    published: "publies",
    languages: "langues couvertes",
    collection: "Bibliotheque films",
    collectionBody: "Recherchez le catalogue, ouvrez un titre existant ou creez un nouveau brouillon.",
    newDraft: "Nouveau brouillon",
    searchPlaceholder: "Rechercher titre, realisateur, langue ou pays",
    allEntries: "Toutes les fiches",
    noMatches: "Aucun titre ne correspond a la recherche.",
    selected: "Fiche selectionnee",
    selectedBody: "Les changements restent en etat local pour cette demo admin Phase 2.",
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
    media: "Liens media",
    posterUrlLabel: "URL poster",
    backdropUrlLabel: "URL backdrop",
    trailerUrlLabel: "URL bande-annonce",
    publicBadge: "Badge public",
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
    saveSuccess: "Brouillon enregistre localement.",
    publishSuccess: "Fiche publiee localement.",
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
    draftStatus: "Brouillon",
    publishedStatus: "Publie",
  },
} satisfies Record<Locale, Record<string, string>>;

export default function AdminMoviesPage() {
  const { locale } = useLocale();
  const t = copy[locale];
  const [records, setRecords] = useState<Movie[]>(movies);
  const [selectedId, setSelectedId] = useState(movies[0]?.id ?? "");
  const [query, setQuery] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState<WorkflowFilter>("All");
  const [feedback, setFeedback] = useState<Feedback>(null);

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
      })
    : [];

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

  function updateField<K extends keyof Movie>(field: K, value: Movie[K]) {
    if (!selectedMovie) {
      return;
    }

    updateSelectedMovie((movie) => {
      if (field === "title") {
        const nextTitle = String(value);
        const currentSlug = movie.slug.trim();
        const generatedFromCurrentTitle = slugify(movie.title);
        const shouldSyncSlug = currentSlug.length === 0 || currentSlug === generatedFromCurrentTitle;

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

  function createDraft() {
    const id = `draft-${Date.now()}`;
    const nextMovie: Movie = {
      id,
      slug: slugify(t.untitled),
      title: t.untitled,
      originalTitle: "",
      releaseYear: new Date().getFullYear(),
      releaseDate: "",
      country: "Cameroon",
      runtimeMinutes: 90,
      director: "",
      genres: [],
      languages: [],
      synopsis: "",
      rating: 0,
      reviews: 0,
      trend: "New draft",
      palette: "amber",
      workflowStatus: "Draft",
      status: "Published",
      posterUrl: "/assets/homepage-concept.png",
      backdropUrl: "/assets/cameroon-cinema-backdrop.png",
      trailerUrl: "",
      cast: [],
      crew: [],
    };

    setRecords((current) => [nextMovie, ...current]);
    setSelectedId(id);
    setWorkflowFilter("All");
    setFeedback({
      tone: "success",
      message: t.saveSuccess,
    });
  }

  function saveDraft() {
    if (!selectedMovie) {
      return;
    }

    updateSelectedMovie((movie) => ({
      ...movie,
      workflowStatus: "Draft",
    }));
    setFeedback({
      tone: "success",
      message: t.saveSuccess,
    });
  }

  function publishRecord() {
    if (!selectedMovie) {
      return;
    }

    const blockers = getPublishChecklist(selectedMovie, {
      title: t.titleLabel,
      slug: t.slugLabel,
      director: t.directorLabel,
      synopsis: t.synopsisLabel,
      languages: t.languages,
      genres: t.taxonomy,
    });

    if (blockers.length > 0) {
      setFeedback({
        tone: "error",
        message: `${t.publishErrorPrefix} ${blockers.join(", ")}`,
      });
      return;
    }

    updateSelectedMovie((movie) => ({
      ...movie,
      workflowStatus: "Published",
    }));
    setFeedback({
      tone: "success",
      message: t.publishSuccess,
    });
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
              <button className="admin-action-button" type="button" onClick={createDraft}>
                <Plus size={16} />
                {t.newDraft}
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
                  <div className={`admin-palette poster-${movie.palette}`} />
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
                            className={clsx(
                              "admin-toggle-chip",
                              selectedMovie.languages.includes(language) && "is-active",
                            )}
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

                  <div className="admin-form-grid">
                    <Field label={t.posterUrlLabel}>
                      <input value={selectedMovie.posterUrl} onChange={(event) => updateField("posterUrl", event.target.value)} />
                    </Field>
                    <Field label={t.backdropUrlLabel}>
                      <input
                        value={selectedMovie.backdropUrl}
                        onChange={(event) => updateField("backdropUrl", event.target.value)}
                      />
                    </Field>
                    <Field label={t.trailerUrlLabel}>
                      <input value={selectedMovie.trailerUrl} onChange={(event) => updateField("trailerUrl", event.target.value)} />
                    </Field>
                  </div>
                </section>

                <section className="admin-section">
                  <div className="admin-section-heading">
                    <h3>{t.preview}</h3>
                    <span>{selectedMovie.slug || t.untitled}</span>
                  </div>

                  <div className="admin-preview-card" data-testid="admin-preview-card">
                    <div className="admin-preview-grid">
                      <PosterBlock movie={selectedMovie} className="selected-poster admin-preview-poster" />

                      <div className="admin-preview-copy">
                        <p className="eyebrow">{t.preview}</p>
                        <h3>{selectedMovie.title || t.untitled}</h3>
                        <MovieMeta movie={selectedMovie} />
                        <p>{selectedMovie.synopsis.trim().length > 0 ? selectedMovie.synopsis : t.previewBody}</p>
                        {selectedMovie.languages.length > 0 ? <LanguageBadges languages={selectedMovie.languages} /> : null}

                        <div className="admin-preview-actions">
                          <Link className="detail-action" href={`/movies/${selectedMovie.slug}`}>
                            {t.openPublicPage}
                          </Link>
                          <Link className="detail-action admin-preview-secondary" href={`/write-review/${selectedMovie.slug}`}>
                            {t.openReviewRoute}
                          </Link>
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
                    onChange={updateCredit}
                    onRemove={removeCredit}
                    t={t}
                    type="crew"
                  />
                </section>

                <div className="admin-form-actions">
                  <button className="secondary-action admin-form-button" type="button" onClick={saveDraft}>
                    {t.saveDraft}
                  </button>
                  <button className="primary-action admin-form-button" type="button" onClick={publishRecord}>
                    {t.publishNow}
                  </button>
                </div>
              </>
            ) : (
              <div className="admin-empty-editor">
                <h2>{t.createFirst}</h2>
                <p>{t.createFirstBody}</p>
                <button className="primary-action admin-form-button" type="button" onClick={createDraft}>
                  {t.newDraft}
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
  onChange,
  onRemove,
  t,
  type,
}: {
  credits: CastCredit[] | CrewCredit[];
  locale: Locale;
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
              onChange={(event) =>
                onChange(type, index, type === "cast" ? "character" : "job", event.target.value)
              }
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

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getPublishChecklist(
  movie: Movie,
  labels: {
    title: string;
    slug: string;
    director: string;
    synopsis: string;
    languages: string;
    genres: string;
  },
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

  return blockers;
}
