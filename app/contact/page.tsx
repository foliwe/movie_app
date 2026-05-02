"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { PageHero, SiteHeader } from "@/components/site";
import { useLocale } from "@/components/locale-provider";
import { type Locale } from "@/lib/i18n";

const copy = {
  en: {
    eyebrow: "Contact",
    title: "Contact Mboko Reels",
    body: "Reach the team for catalogue conversations, partnerships, and movie submission requests.",
    reachTitle: "How we can help",
    reachBody:
      "Use the movie request flow if you are a director, producer, or rights holder who wants to introduce a title to the Mboko Reels team. We review requests by email before any catalogue work happens.",
    reachPointOne: "Movie requests are reviewed manually by the team.",
    reachPointTwo: "A confirmation email is sent immediately after submission.",
    reachPointThree: "Submitting a request does not publish or add the title to the database.",
    requestEyebrow: "Movie request",
    requestTitle: "Send a title for review",
    requestBody:
      "Prepare the basic production and contact details for the film, then send the request to the team in one step.",
    fieldTitle: "We will ask for",
    fieldOne: "Movie title and language",
    fieldTwo: "Producer and release year",
    fieldThree: "Phone, email, and your role in the movie",
    cta: "Open movie request",
  },
  fr: {
    eyebrow: "Contact",
    title: "Contacter Mboko Reels",
    body: "Contactez l'equipe pour les discussions de catalogue, les partenariats et les demandes de films.",
    reachTitle: "Comment nous aiderons",
    reachBody:
      "Utilisez le parcours de demande de film si vous etes realisateur, producteur ou detenteur des droits et souhaitez presenter un titre a l'equipe Mboko Reels. Nous examinons les demandes par email avant tout travail de catalogue.",
    reachPointOne: "Les demandes de films sont examinees manuellement par l'equipe.",
    reachPointTwo: "Un email de confirmation est envoye juste apres l'envoi.",
    reachPointThree: "Envoyer une demande ne publie pas le titre et ne l'ajoute pas a la base de donnees.",
    requestEyebrow: "Demande de film",
    requestTitle: "Envoyer un titre pour examen",
    requestBody:
      "Preparez les informations de base sur la production et le contact du film, puis envoyez la demande a l'equipe en une seule etape.",
    fieldTitle: "Nous demanderons",
    fieldOne: "Titre du film et langue",
    fieldTwo: "Producteur et annee de sortie",
    fieldThree: "Telephone, email et votre role dans le film",
    cta: "Ouvrir la demande",
  },
} satisfies Record<Locale, Record<string, string>>;

export default function ContactPage() {
  const { locale } = useLocale();
  const t = copy[locale];

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={t.eyebrow} title={t.title} body={t.body} />
      <section className="split-band contact-band">
        <div className="panel">
          <div className="panel-heading">
            <h2>
              <Mail size={18} />
              {t.reachTitle}
            </h2>
          </div>
          <div className="contact-copy">
            <p>{t.reachBody}</p>
            <ul className="contact-bullet-list">
              <li>{t.reachPointOne}</li>
              <li>{t.reachPointTwo}</li>
              <li>{t.reachPointThree}</li>
            </ul>
          </div>
        </div>
        <aside className="panel selected-film-panel contact-request-panel">
          <p className="eyebrow">{t.requestEyebrow}</p>
          <h3>{t.requestTitle}</h3>
          <p>{t.requestBody}</p>
          <div className="contact-request-list" aria-label={t.fieldTitle}>
            <div>
              <strong>{t.fieldTitle}</strong>
              <span>{t.fieldOne}</span>
            </div>
            <div>
              <Phone size={18} />
              <span>{t.fieldTwo}</span>
            </div>
            <div>
              <Mail size={18} />
              <span>{t.fieldThree}</span>
            </div>
          </div>
          <Link className="primary-action" href="/contact/movie-request">
            {t.cta}
          </Link>
        </aside>
      </section>
    </main>
  );
}
