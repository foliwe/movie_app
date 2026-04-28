"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2, Save, Trash2 } from "lucide-react";
import type { Movie, Review } from "@/lib/movies";
import { LanguageBadges, RatingPill } from "@/components/site";
import { type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";

type FormState = "idle" | "loading" | "error" | "success";
type DraftStatus = "idle" | "dirty" | "saving" | "saved";
type AuthMode = "login" | "register" | "forgot" | "reset";
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
    resetTitle: "Choose a new password",
    displayName: "Display name",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    displayNamePlaceholder: "Aline N.",
    emailPlaceholder: "you@example.com",
    passwordPlaceholder: "At least 8 characters",
    confirmPasswordPlaceholder: "Repeat your new password",
    invalidEmail: "Use a valid email address to continue.",
    invalidPassword: "Use a password with at least 8 characters.",
    mismatchPassword: "Use the same password in both fields.",
    forgotSuccess: "Reset link prepared for local development.",
    resetSuccess: "Password updated. Sign in with your new password.",
    authSuccess: "Account session is active.",
    authError: "We could not complete that account request.",
    signIn: "Sign in",
    register: "Register",
    sendReset: "Send reset link",
    savePassword: "Save new password",
    forgotPassword: "Forgot password?",
    resetPassword: "Reset password",
    createAccount: "Create account",
    openResetLink: "Open reset link",
  },
  fr: {
    loginTitle: "Bon retour",
    registerTitle: "Creez votre profil",
    forgotTitle: "Reinitialisez votre mot de passe",
    resetTitle: "Choisissez un nouveau mot de passe",
    displayName: "Nom affiche",
    email: "Email",
    password: "Mot de passe",
    confirmPassword: "Confirmez le mot de passe",
    displayNamePlaceholder: "Aline N.",
    emailPlaceholder: "vous@example.com",
    passwordPlaceholder: "Au moins 8 caracteres",
    confirmPasswordPlaceholder: "Repetez votre nouveau mot de passe",
    invalidEmail: "Utilisez une adresse email valide pour continuer.",
    invalidPassword: "Utilisez un mot de passe d'au moins 8 caracteres.",
    mismatchPassword: "Utilisez le meme mot de passe dans les deux champs.",
    forgotSuccess: "Lien de reinitialisation prepare pour le developpement local.",
    resetSuccess: "Mot de passe mis a jour. Connectez-vous avec le nouveau mot de passe.",
    authSuccess: "La session du compte est active.",
    authError: "Impossible de terminer cette demande de compte.",
    signIn: "Connexion",
    register: "Inscription",
    sendReset: "Envoyer le lien",
    savePassword: "Enregistrer le nouveau mot de passe",
    forgotPassword: "Mot de passe oublie ?",
    resetPassword: "Reinitialiser le mot de passe",
    createAccount: "Creer un compte",
    openResetLink: "Ouvrir le lien de reinitialisation",
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
    reviewSaved: "Review published to the community feed.",
    reviewError: "We could not publish that review.",
    openReview: "Open published review",
    publish: "Publish review",
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
    reviewSaved: "Critique publiee dans le flux communaute.",
    reviewError: "Impossible de publier cette critique.",
    openReview: "Ouvrir la critique publiee",
    publish: "Publier la critique",
  },
} satisfies Record<Locale, Record<string, string>>;

const ownerReviewCopy = {
  en: {
    manage: "Manage your review",
    status: "Moderation status",
    save: "Save changes",
    delete: "Delete review",
    saved: "Review updated.",
    deleted: "Review deleted.",
    error: "We could not update that review.",
    confirmDelete: "Delete this review?",
  },
  fr: {
    manage: "Gerer votre critique",
    status: "Statut moderation",
    save: "Enregistrer",
    delete: "Supprimer",
    saved: "Critique mise a jour.",
    deleted: "Critique supprimee.",
    error: "Impossible de modifier cette critique.",
    confirmDelete: "Supprimer cette critique ?",
  },
} satisfies Record<Locale, Record<string, string>>;

export function AuthForm({ mode, token }: { mode: AuthMode; token?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<FormState>("idle");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [successHref, setSuccessHref] = useState<string | null>(null);
  const { locale } = useLocale();
  const t = authCopy[locale];
  const nextPath = useMemo(() => {
    const candidate = searchParams?.get("next");
    if (!candidate?.startsWith("/") || candidate.startsWith("//")) {
      return null;
    }

    return candidate;
  }, [searchParams]);
  const loginHref = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login";
  const registerHref = nextPath ? `/register?next=${encodeURIComponent(nextPath)}` : "/register";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setSuccessHref(null);
    setState("loading");

    if (mode === "forgot" && !email.includes("@")) {
      setMessage(t.invalidEmail);
      setState("error");
      return;
    }

    if (mode === "reset") {
      if (password.length < 8) {
        setMessage(t.invalidPassword);
        setState("error");
        return;
      }

      if (password !== confirmPassword) {
        setMessage(t.mismatchPassword);
        setState("error");
        return;
      }

      if (!token) {
        setMessage(t.authError);
        setState("error");
        return;
      }
    }

    if ((mode === "login" || mode === "register") && password.length === 0) {
      setMessage(t.invalidPassword);
      setState("error");
      return;
    }

    try {
      const authPath = mode === "forgot" ? "forgot-password" : mode === "reset" ? "reset-password" : mode;
      const response = await fetch(`/api/auth/${authPath}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          token,
          displayName: name,
        }),
      });
      const payload = (await response.json()) as { message?: string; resetHref?: string };

      if (!response.ok) {
        setMessage(payload.message ?? t.authError);
        setState("error");
        return;
      }

      setMessage(payload.message ?? (mode === "forgot" ? t.forgotSuccess : mode === "reset" ? t.resetSuccess : t.authSuccess));
      setSuccessHref(payload.resetHref ?? null);
      setState("success");
      if (nextPath) {
        window.setTimeout(() => window.location.assign(nextPath), 250);
      } else if (mode !== "forgot") {
        router.refresh();
      }
    } catch {
      setMessage(t.authError);
      setState("error");
    }
  }

  const title =
    mode === "login" ? t.loginTitle : mode === "register" ? t.registerTitle : mode === "forgot" ? t.forgotTitle : t.resetTitle;
  const success = mode === "forgot" ? t.forgotSuccess : mode === "reset" ? t.resetSuccess : t.authSuccess;

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>{title}</h2>
      {mode === "reset" ? <input type="text" name="username" autoComplete="username" value="" readOnly hidden /> : null}
      {mode === "register" ? (
        <label>
          {t.displayName}
          <input value={name} onChange={(event) => setName(event.target.value)} placeholder={t.displayNamePlaceholder} />
        </label>
      ) : null}
      {mode !== "reset" ? (
        <label>
          {t.email}
          <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t.emailPlaceholder} />
        </label>
      ) : null}
      {mode !== "forgot" ? (
        <label>
          {t.password}
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={t.passwordPlaceholder}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </label>
      ) : null}
      {mode === "reset" ? (
        <label>
          {t.confirmPassword}
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder={t.confirmPasswordPlaceholder}
            autoComplete="new-password"
          />
        </label>
      ) : null}
      {state === "error" ? <p className="form-message error">{message ?? t.invalidEmail}</p> : null}
      {state === "success" ? (
        <p className="form-message success">
          <CheckCircle2 size={18} />
          {message ?? success}
        </p>
      ) : null}
      {successHref ? (
        <div className="form-links">
          <Link href={successHref}>{t.openResetLink}</Link>
        </div>
      ) : null}
      <button className="primary-action" type="submit" disabled={state === "loading"}>
        {state === "loading" ? <Loader2 className="spin" size={18} /> : null}
        {mode === "login"
          ? t.signIn
          : mode === "register"
            ? t.register
            : mode === "forgot"
              ? t.sendReset
              : t.savePassword}
      </button>
      <div className="form-links">
        {mode === "reset" ? <Link href={loginHref}>{t.signIn}</Link> : null}
        {mode !== "login" && mode !== "reset" ? <Link href={loginHref}>{t.signIn}</Link> : null}
        {mode === "login" ? <Link href="/forgot-password">{t.forgotPassword}</Link> : null}
        {mode !== "register" && mode !== "reset" ? <Link href={registerHref}>{t.createAccount}</Link> : null}
      </div>
    </form>
  );
}

export function WriteReviewForm({ movie }: { movie: Movie }) {
  const router = useRouter();
  const [rating, setRating] = useState(8);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  const [state, setState] = useState<FormState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [publishedHref, setPublishedHref] = useState<string | null>(null);
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setErrorMessage(null);
    setPublishedHref(null);
    setDraftMessage(null);

    if (!isValid) {
      setErrorMessage(t.invalidReview);
      setState("error");
      return;
    }

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          movieSlug: movie.slug,
          rating,
          title,
          body,
          containsSpoilers,
        }),
      });
      const payload = (await response.json()) as { message?: string; href?: string };

      if (!response.ok) {
        setErrorMessage(payload.message ?? t.reviewError);
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
      setPublishedHref(payload.href ?? null);
      setState("success");
      router.refresh();
    } catch {
      setErrorMessage(t.reviewError);
      setState("error");
    }
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
      {state === "error" ? <p className="form-message error">{errorMessage ?? t.invalidReview}</p> : null}
      {state === "success" ? (
        <p className="form-message success">
          <CheckCircle2 size={18} />
          {t.reviewSaved}
        </p>
      ) : null}
      {publishedHref ? (
        <div className="form-links">
          <Link href={publishedHref}>{t.openReview}</Link>
        </div>
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

export function ReviewOwnerTools({
  review,
  canModerate,
}: {
  review: Review;
  canModerate: boolean;
}) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = ownerReviewCopy[locale];
  const [rating, setRating] = useState(review.rating);
  const [title, setTitle] = useState(review.title);
  const [body, setBody] = useState(review.body);
  const [status, setStatus] = useState(review.status ?? "Published");
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    setMessage(null);

    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rating,
          title,
          body,
          status,
        }),
      });
      const payload = (await response.json()) as { message?: string; href?: string };

      if (!response.ok) {
        setMessage(payload.message ?? t.error);
        setState("error");
        return;
      }

      setMessage(t.saved);
      setState("success");
      router.refresh();
      if (payload.href && payload.href !== `/reviews/${review.slug}`) {
        router.push(payload.href);
      }
    } catch {
      setMessage(t.error);
      setState("error");
    }
  }

  async function handleDelete() {
    if (!window.confirm(t.confirmDelete)) {
      return;
    }

    setState("loading");
    setMessage(null);

    try {
      const response = await fetch(`/api/reviews/${review.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json()) as { message?: string; href?: string };

      if (!response.ok) {
        setMessage(payload.message ?? t.error);
        setState("error");
        return;
      }

      setMessage(t.deleted);
      setState("success");
      router.push(payload.href ?? "/reviews");
      router.refresh();
    } catch {
      setMessage(t.error);
      setState("error");
    }
  }

  return (
    <form className="auth-form review-owner-form" onSubmit={handleSave}>
      <h2>{t.manage}</h2>
      <label>
        {reviewCopy[locale].rating}
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
      <label>
        {reviewCopy[locale].reviewTitle}
        <input value={title} onChange={(event) => setTitle(event.target.value)} />
      </label>
      <label>
        {reviewCopy[locale].reviewBody}
        <textarea value={body} onChange={(event) => setBody(event.target.value)} />
      </label>
      {canModerate ? (
        <label>
          {t.status}
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as NonNullable<Review["status"]>)}
          >
            {(["Draft", "Pending", "Published", "Hidden"] as NonNullable<Review["status"]>[]).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {state === "error" && message ? <p className="form-message error">{message}</p> : null}
      {state === "success" && message ? (
        <p className="form-message success">
          <CheckCircle2 size={18} />
          {message}
        </p>
      ) : null}
      <div className="review-form-actions">
        <button className="primary-action" type="submit" disabled={state === "loading"}>
          {state === "loading" ? <Loader2 className="spin" size={18} /> : null}
          {t.save}
        </button>
        <button className="secondary-action review-secondary-action" type="button" onClick={handleDelete} disabled={state === "loading"}>
          <Trash2 size={18} />
          {t.delete}
        </button>
      </div>
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
