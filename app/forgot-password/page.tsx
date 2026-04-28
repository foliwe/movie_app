"use client";

import { AuthForm } from "@/components/forms";
import { PageHero, SiteHeader } from "@/components/site";
import { useLocale } from "@/components/locale-provider";
import { type Locale } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Account",
    title: "Recover access",
    body: "Request a password reset for your account if you can no longer sign in.",
  },
  fr: {
    eyebrow: "Compte",
    title: "Recuperer l'acces",
    body: "Demandez une reinitialisation du mot de passe si vous ne pouvez plus vous connecter.",
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
