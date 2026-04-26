"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { Movie } from "@/lib/movies";
import { type Locale } from "@/lib/i18n";
import { useLocale } from "@/components/locale-provider";

type FormState = "idle" | "loading" | "error" | "success";

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
    reviewTitle: "Review title",
    reviewBody: "Your review",
    reviewTitlePlaceholder: "What should readers know?",
    reviewBodyPlaceholder: "Write at least a few sentences.",
    invalidReview: "Add a title and at least 20 characters of review text.",
    reviewSaved: "Review saved locally for the Phase 1 demo.",
    publish: "Publish mock review",
  },
  fr: {
    title: "Critique",
    rating: "Note",
    reviewTitle: "Titre de la critique",
    reviewBody: "Votre critique",
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
  const [state, setState] = useState<FormState>("idle");
  const { locale } = useLocale();
  const t = reviewCopy[locale];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("loading");
    window.setTimeout(() => {
      setState(title.trim().length > 3 && body.trim().length > 20 ? "success" : "error");
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
      <label>
        {t.reviewTitle}
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={t.reviewTitlePlaceholder} />
      </label>
      <label>
        {t.reviewBody}
        <textarea value={body} onChange={(event) => setBody(event.target.value)} placeholder={t.reviewBodyPlaceholder} />
      </label>
      {state === "error" ? <p className="form-message error">{t.invalidReview}</p> : null}
      {state === "success" ? (
        <p className="form-message success">
          <CheckCircle2 size={18} />
          {t.reviewSaved}
        </p>
      ) : null}
      <button className="primary-action" type="submit" disabled={state === "loading"}>
        {state === "loading" ? <Loader2 className="spin" size={18} /> : null}
        {t.publish}
      </button>
    </form>
  );
}
