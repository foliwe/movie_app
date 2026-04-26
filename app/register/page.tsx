"use client";

import { AuthForm } from "@/components/forms";
import { PageHero, SiteHeader } from "@/components/site";
import { useLocale } from "@/components/locale-provider";
import { type Locale } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Account",
    title: "Join Mboko Reels",
    body: "Create a local demo profile before persistent auth is wired in Phase 2.",
  },
  fr: {
    eyebrow: "Compte",
    title: "Rejoindre Mboko Reels",
    body: "Creez un profil de demo locale avant l'integration auth de la Phase 2.",
  },
} satisfies Record<Locale, Record<string, string>>;

export default function RegisterPage() {
  const { locale } = useLocale();
  const t = copy[locale];

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={t.eyebrow} title={t.title} body={t.body} />
      <section className="auth-shell">
        <AuthForm mode="register" />
      </section>
    </main>
  );
}
