import { AuthForm } from "@/components/forms";
import { PageHero, SiteHeader } from "@/components/site";

export default function ForgotPasswordPage() {
  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow="Account" title="Recover access" body="A complete placeholder recovery flow with mock validation and success feedback." />
      <section className="auth-shell">
        <AuthForm mode="forgot" />
      </section>
    </main>
  );
}
