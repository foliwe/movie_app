"use client";

import { AuthForm } from "@/components/forms";
import { PageHero, SiteHeader } from "@/components/site";
import { useLocale } from "@/components/locale-provider";
import { type Locale } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Account",
    title: "Sign in",
    body: "Sign in with a persistent account session before publishing community reviews.",
  },
  fr: {
    eyebrow: "Compte",
    title: "Connexion",
    body: "Connectez-vous avec une session persistante avant de publier des critiques.",
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
