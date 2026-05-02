"use client";

import { MovieRequestForm } from "@/components/forms";
import { PageHero, SiteHeader } from "@/components/site";
import { useLocale } from "@/components/locale-provider";
import { type Locale } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Movie request",
    title: "Submit a movie request",
    body: "Share the key film and contact details below and the Mboko Reels team will follow up by email.",
  },
  fr: {
    eyebrow: "Demande de film",
    title: "Soumettre une demande de film",
    body: "Partagez ci-dessous les informations essentielles sur le film et le contact, et l'equipe Mboko Reels fera un suivi par email.",
  },
} satisfies Record<Locale, Record<string, string>>;

export default function MovieRequestPage() {
  const { locale } = useLocale();
  const t = copy[locale];

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={t.eyebrow} title={t.title} body={t.body} />
      <section className="auth-shell contact-form-shell">
        <MovieRequestForm />
      </section>
    </main>
  );
}
