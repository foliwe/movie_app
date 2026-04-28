"use client";

import { use } from "react";
import { AuthForm } from "@/components/forms";
import { PageHero, SiteHeader } from "@/components/site";
import { useLocale } from "@/components/locale-provider";
import { type Locale } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Account",
    title: "Choose a new password",
    body: "Use your reset link to secure the account again, then sign back in with the new password.",
  },
  fr: {
    eyebrow: "Compte",
    title: "Choisissez un nouveau mot de passe",
    body: "Utilisez le lien de reinitialisation pour securiser le compte, puis reconnectez-vous avec le nouveau mot de passe.",
  },
} satisfies Record<Locale, Record<string, string>>;

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { locale } = useLocale();
  const t = copy[locale];

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={t.eyebrow} title={t.title} body={t.body} />
      <section className="auth-shell">
        <AuthForm mode="reset" token={token} />
      </section>
    </main>
  );
}
