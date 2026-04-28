"use client";

import { AuthForm } from "@/components/forms";
import { PageHero, SiteHeader } from "@/components/site";
import { useLocale } from "@/components/locale-provider";
import { type Locale } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Account",
    title: "Join Mboko Reels",
    body: "Create a real profile with a persistent session for writing reviews.",
  },
  fr: {
    eyebrow: "Compte",
    title: "Rejoindre Mboko Reels",
    body: "Creez un vrai profil avec une session persistante pour ecrire des critiques.",
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
