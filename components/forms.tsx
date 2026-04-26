"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";
import type { Movie } from "@/lib/movies";
import { LanguageBadges, RatingPill } from "@/components/site";
import { type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";

type FormState = "idle" | "loading" | "error" | "success";
type DraftStatus = "idle" | "dirty" | "saving" | "saved";
type DraftPayload = {
  version: 1;
  rating: number;
  title: string;
  body: string;
  containsSpoilers: boolean;
};

const reviewDraftVersion = 1;

const authCopy = {
  en: {
    loginTitle: "Welcome back",
    registerTitle: "Create your profile",
    forgotTitle: "Reset your password",
    displayName: "Display name",
    email: "Email",
    password: "Password",
    displayNamePlaceholder: "Aline N.",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "At least 8 characters",
    invalidEmail: "Use a valid email address to continue.",
    forgotSuccess: "Reset link prepared for the mock inbox.",
    authSuccess: "Mock account flow completed.",
    signIn: "Sign in",
    register: "Register",
    sendReset: "Send reset link",
    forgotPassword: "Forgot password?",
    createAccount: "Create account",
  },
  fr: {
    loginTitle: "Bon retour",
    registerTitle: "Creez votre profil",
    forgotTitle: "Reinitialisez votre mot de passe",
    displayName: "Nom affiche",
    email: "Email",
    password: "Mot de passe",
    displayNamePlaceholder: "Aline N.",
    emailPlaceholder: "vous@example.com",
    passwordPlaceholder: "Au moins 8 caracteres",
    invalidEmail: "Utilisez une adresse email valide pour continuer.",
    forgotSuccess: "Lien de reinitialisation prepare pour la boite mock.",
    authSuccess: "Flux de compte mock termine.",
    signIn: "Connexion",
    register: "Inscription",
    sendReset: "Envoyer le lien",
    forgotPassword: "Mot de passe oublie ?",
    createAccount: "Creer un compte",
  },
} satisfies Record<Locale, Record<string, string>>;

const reviewCopy = {
  en: {
    title: "Review",
    rating: "Rating",
    draftStatus: "Draft status",
    bodyCount: "Body count",
    readiness: "Readiness",
    reviewTitle: "Review title",
    reviewBody: "Your review",
    spoilerLabel: "Contains spoilers",
    spoilerHint: "Flag spoiler-heavy notes before Phase 2 moderation exists.",
    draftSaved: "Draft saved locally on this device.",
    draftLoaded: "Saved draft restored for this title.",
    draftSaving: "Saving draft",
    draftNotSaved: "Not saved",
    draftStored: "Saved locally",
    readyToPublish: "Ready to publish",
    needsEditing: "Needs editing",
    saveDraft: "Save draft locally",
    chars: "characters",
    preview: "Live preview",
    previewBody: "See how this note will read in the public review feed.",
    previewPlaceholderTitle: "Your review headline appears here.",
    previewPlaceholderBody: "Start writing to preview the review excerpt and body rhythm.",
    spoilerOn: "Spoilers flagged",
    spoilerOff: "Spoiler-safe",
    criticLabel: "Phase 1 critic preview",
    reviewTitlePlaceholder: "What should readers know?",
    reviewBodyPlaceholder: "Write at least a few sentences.",
    invalidReview: "Add a title and at least 20 characters of review text.",
    reviewSaved: "Review saved locally for the Phase 1 demo.",
    publish: "Publish mock review",
  },
  fr: {
    title: "Critique",
    rating: "Note",
    draftStatus: "Etat du brouillon",
    bodyCount: "Longueur",
    readiness: "Preparation",
    reviewTitle: "Titre de la critique",
    reviewBody: "Votre critique",
    spoilerLabel: "Contient des spoilers",
    spoilerHint: "Signalez les passages revelateurs avant l'arrivee de la moderation Phase 2.",
    draftSaved: "Brouillon enregistre localement sur cet appareil.",
    draftLoaded: "Brouillon restaure pour ce titre.",
    draftSaving: "Enregistrement",
    draftNotSaved: "Non enregistre",
    draftStored: "Stocke localement",
    readyToPublish: "Pret a publier",
    needsEditing: "A retravailler",
    saveDraft: "Enregistrer le brouillon",
    chars: "caracteres",
    preview: "Apercu en direct",
    previewBody: "Voyez comment la note se lira dans le flux public de critiques.",
    previewPlaceholderTitle: "Votre titre de critique apparait ici.",
    previewPlaceholderBody: "Commencez a ecrire pour previsualiser l'extrait et le rythme du texte.",
    spoilerOn: "Spoilers signales",
    spoilerOff: "Sans spoiler",
    criticLabel: "Apercu critique Phase 1",
    reviewTitlePlaceholder: "Que doivent savoir les lecteurs ?",
    reviewBodyPlaceholder: "Ecrivez au moins quelques phrases.",
    invalidReview: "Ajoutez un titre et au moins 20 caracteres de texte.",
    reviewSaved: "Critique enregistree localement pour la demo Phase 1.",
    publish: "Publier la critique mock",
  },
} satisfies Record<Locale, Record<string, string>>;

export function AuthForm({ mode }: { mode: "login" | "register" | "forgot" }) {
  const [state, setState] = useState<FormState>("idle");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const { locale } = useLocale();
  const t = authCopy[locale];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    window.setTimeout(() => {
      setState(email.includes("@") ? "success" : "error");
    }, 650);
  }

  const title = mode === "login" ? t.loginTitle : mode === "register" ? t.registerTitle : t.forgotTitle;
  const success = mode === "forgot" ? t.forgotSuccess : t.authSuccess;

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>{title}</h2>
      {mode === "register" ? (
        <label>
          {t.displayName}
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t.displayNamePlaceholder} />
        </label>
      ) : null}
      <label>
        {t.email}
        <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t.emailPlaceholder} />
      </label>
      {mode !== "forgot" ? (
        <label>
          {t.password}
          <input type="password" placeholder={t.passwordPlaceholder} />
        </label>
      ) : null}
      {state === "error" ? <p className="form-message error">{t.invalidEmail}</p> : null}
      {state === "success" ? (
        <p className="form-message success">
          <CheckCircle2 size={18} />
          {success}
        </p>
      ) : null}
      <button className="primary-action" type="submit" disabled={state === "loading"}>
        {state === "loading" ? <Loader2 className="spin" size={18} /> : null}
        {mode === "login" ? t.signIn : mode === "register" ? t.register : t.sendReset}
      </button>
      <div className="form-links">
        {mode !== "login" ? <Link href="/login">{t.signIn}</Link> : <Link href="/forgot-password">{t.forgotPassword}</Link>}
        {mode !== "register" ? <Link href="/register">{t.createAccount}</Link> : null}
      </div>
    </form>
  );
}

export function WriteReviewForm({ movie }: { movie: Movie }) {
  const [rating, setRating] = useState(8);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [state, setState] = useState<FormState>("idle");
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("idle");
  const [draftMessage, setDraftMessage] = useState<string | null>(null);
  const { locale } = useLocale();
  const t = reviewCopy[locale];
  const draftKey = `mboko-review-draft/v${reviewDraftVersion}/${movie.slug}`;
  const draftPayload = useMemo(
    () => ({
      version: reviewDraftVersion,
      rating,
      title,
      body,
      containsSpoilers,
    }),
    [body, containsSpoilers, rating, title],
  );
  const emptyDraftSignature = JSON.stringify({
    version: reviewDraftVersion,
    rating: 8,
    title: "",
    body: "",
    containsSpoilers: false,
  });
  const lastSavedSignatureRef = useRef<string | null>(null);
  const hasHydratedRef = useRef(false);
  const bodyCharacterCount = body.trim().length;
  const isValid = title.trim().length > 3 && bodyCharacterCount > 20;

  useEffect(() => {
    const storedDraft = window.localStorage.getItem(draftKey);

    if (!storedDraft) {
      hasHydratedRef.current = true;
      return;
    }

    try {
      const parsedDraft = JSON.parse(storedDraft) as Partial<DraftPayload>;

      if (parsedDraft.version !== reviewDraftVersion) {
        window.localStorage.removeItem(draftKey);
        hasHydratedRef.current = true;
        return;
      }

      setRating(typeof parsedDraft.rating === "number" ? parsedDraft.rating : 8);
      setTitle(typeof parsedDraft.title === "string" ? parsedDraft.title : "");
      setBody(typeof parsedDraft.body === "string" ? parsedDraft.body : "");
      setContainsSpoilers(Boolean(parsedDraft.containsSpoilers));
      lastSavedSignatureRef.current = JSON.stringify({
        version: reviewDraftVersion,
        rating: typeof parsedDraft.rating === "number" ? parsedDraft.rating : 8,
        title: typeof parsedDraft.title === "string" ? parsedDraft.title : "",
        body: typeof parsedDraft.body === "string" ? parsedDraft.body : "",
        containsSpoilers: Boolean(parsedDraft.containsSpoilers),
      });
      setDraftStatus("saved");
      setDraftMessage(t.draftLoaded);
    } catch {
      window.localStorage.removeItem(draftKey);
    } finally {
      hasHydratedRef.current = true;
    }
  }, [draftKey]);

  useEffect(() => {
    if (!hasHydratedRef.current || draftStatus === "saving") {
      return;
    }

    const nextSignature = JSON.stringify(draftPayload);
    if (lastSavedSignatureRef.current === null) {
      setDraftStatus(nextSignature === emptyDraftSignature ? "idle" : "dirty");
      return;
    }

    setDraftStatus(nextSignature === lastSavedSignatureRef.current ? "saved" : "dirty");
  }, [draftPayload, draftStatus, emptyDraftSignature]);

  function persistDraft() {
    setState("loading");
    setDraftStatus("saving");
    setDraftMessage(null);

    window.setTimeout(() => {
      window.localStorage.setItem(draftKey, JSON.stringify(draftPayload));
      lastSavedSignatureRef.current = JSON.stringify(draftPayload);
      setState("idle");
      setDraftStatus("saved");
      setDraftMessage(t.draftSaved);
    }, 300);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setDraftMessage(null);
    window.setTimeout(() => {
      if (!isValid) {
        setState("error");
        return;
      }

      window.localStorage.removeItem(draftKey);
      lastSavedSignatureRef.current = null;
      setRating(8);
      setTitle("");
      setBody("");
      setContainsSpoilers(false);
      setDraftStatus("idle");
      setState("success");
    }, 700);
  }

  return (
    <form className="auth-form review-form" onSubmit={handleSubmit}>
      <h2>
        {t.title} {movie.title}
      </h2>
      <label>
        {t.rating}
        <span className="range-field">
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
          />
          <strong>{rating}/10</strong>
        </span>
      </label>
      <div className="review-insight-grid">
        <InsightCard
          label={t.draftStatus}
          value={
            draftStatus === "saved"
              ? t.draftStored
              : draftStatus === "saving"
                ? t.draftSaving
                : draftStatus === "dirty"
                  ? t.needsEditing
                  : t.draftNotSaved
          }
          tone={draftStatus === "saved" ? "success" : draftStatus === "saving" ? "warning" : "muted"}
        />
        <InsightCard label={t.bodyCount} value={`${bodyCharacterCount} ${t.chars}`} tone={bodyCharacterCount > 20 ? "success" : "muted"} />
        <InsightCard label={t.readiness} value={isValid ? t.readyToPublish : t.needsEditing} tone={isValid ? "success" : "warning"} />
      </div>
      <label>
        {t.reviewTitle}
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.reviewTitlePlaceholder} />
      </label>
      <label>
        {t.reviewBody}
        <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={t.reviewBodyPlaceholder} />
      </label>
      <label className="checkbox-field">
        <span>{t.spoilerLabel}</span>
        <div className="checkbox-row">
          <input
            type="checkbox"
            aria-label={t.spoilerLabel}
            checked={containsSpoilers}
            onChange={(event) => setContainsSpoilers(event.target.checked)}
          />
          <small>{t.spoilerHint}</small>
        </div>
      </label>
      {draftMessage ? (
        <p className="form-message success">
          <Save size={18} />
          {draftMessage}
        </p>
      ) : null}
      {state === "error" ? <p className="form-message error">{t.invalidReview}</p> : null}
      {state === "success" ? (
        <p className="form-message success">
          <CheckCircle2 size={18} />
          {t.reviewSaved}
        </p>
      ) : null}
      <div className="review-form-actions">
        <button className="secondary-action review-secondary-action" type="button" onClick={persistDraft} disabled={state === "loading"}>
          {state === "loading" && draftStatus === "saving" ? <Loader2 className="spin" size={18} /> : <Save size={18} />}
          {t.saveDraft}
        </button>
        <button className="primary-action" type="submit" disabled={state === "loading"}>
          {state === "loading" && draftStatus !== "saving" ? <Loader2 className="spin" size={18} /> : null}
          {t.publish}
        </button>
      </div>
      <section className="review-preview-card" data-testid="review-preview-card">
        <div className="panel-heading review-preview-heading">
          <div>
            <h2>{t.preview}</h2>
            <p>{t.previewBody}</p>
          </div>
          <RatingPill rating={rating} />
        </div>
        <div className="review-preview-topline">
          <span>{t.criticLabel}</span>
          <span className={containsSpoilers ? "review-preview-chip is-warning" : "review-preview-chip"}>
            {containsSpoilers ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            {containsSpoilers ? t.spoilerOn : t.spoilerOff}
          </span>
        </div>
        <h3>{title.trim().length > 0 ? title : t.previewPlaceholderTitle}</h3>
        <p>{body.trim().length > 0 ? body : t.previewPlaceholderBody}</p>
        <div className="review-preview-footer">
          <strong>{movie.title}</strong>
          <LanguageBadges languages={movie.languages.slice(0, 3)} />
        </div>
      </section>
    </form>
  );
}

function InsightCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "muted" | "success" | "warning";
}) {
  return (
    <div className={`review-insight-card is-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
