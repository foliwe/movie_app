import { AuthForm } from "@/components/forms";
import { PageHero, SiteHeader } from "@/components/site";

export default function RegisterPage() {
  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow="Account" title="Join Mboko Reels" body="Create a local demo profile before persistent auth is wired in Phase 2." />
      <section className="auth-shell">
        <AuthForm mode="register" />
      </section>
    </main>
  );
}
