"use client";

import { AuthForm } from "@/components/forms";
import { PageHero, SiteHeader } from "@/components/site";
import { useLocale } from "@/components/locale-provider";
import { type Locale } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Account",
    title: "Recover access",
    body: "A complete placeholder recovery flow with mock validation and success feedback.",
  },
  fr: {
    eyebrow: "Compte",
    title: "Recuperer l'acces",
    body: "Un flux placeholder complet de recuperation avec validation et succes mock.",
  },
} satisfies Record<Locale, Record<string, string>>;

export default function ForgotPasswordPage() {
  const { locale } = useLocale();
  const t = copy[locale];

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={t.eyebrow} title={t.title} body={t.body} />
      <section className="auth-shell">
        <AuthForm mode="forgot" />
      </section>
    </main>
  );
}
