import { AuthForm } from "@/components/forms";
import { PageHero, SiteHeader } from "@/components/site";

export default function LoginPage() {
  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow="Account" title="Sign in" body="Mock authentication UI for Phase 1 with loading, validation, and success states." />
      <section className="auth-shell">
        <AuthForm mode="login" />
      </section>
    </main>
  );
}
