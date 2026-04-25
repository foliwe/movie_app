"use client";

import { AuthForm } from "@/components/forms";
import { PageHero, SiteHeader } from "@/components/site";
import { useLocale } from "@/components/locale-provider";
import { type Locale } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Account",
    title: "Sign in",
    body: "Mock authentication UI for Phase 1 with loading, validation, and success states.",
  },
  fr: {
    eyebrow: "Compte",
    title: "Connexion",
    body: "Interface mock d'authentification Phase 1 avec chargement, validation et succes.",
  },
} satisfies Record<Locale, Record<string, string>>;

export default function LoginPage() {
  const { locale } = useLocale();
  const t = copy[locale];

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={t.eyebrow} title={t.title} body={t.body} />
      <section className="auth-shell">
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
