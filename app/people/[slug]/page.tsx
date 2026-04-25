import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { getPersonBySlug, movies, people } from "@/lib/movies";
import { MovieRow, PageHero, SiteHeader } from "@/components/site";

export function generateStaticParams() {
  return people.map((person) => ({ slug: person.slug }));
}

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const person = getPersonBySlug(slug);

  if (!person) {
    notFound();
  }

  const credits = movies.filter((movie) =>
    [...movie.cast, ...movie.crew].some((credit) => credit.personSlug === person.slug),
  );

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow={person.role} title={person.name} body={person.bio} />
      <section className="split-band detail-grid">
        <aside className="selected-film-panel profile-card">
          <div className={`person-mark poster-${person.palette}`}>
            <strong>{person.name.split(" ").map((part) => part[0]).join("")}</strong>
          </div>
          <dl>
            <div>
              <dt>Location</dt>
              <dd>{person.location}</dd>
            </div>
            <div>
              <dt>Known for</dt>
              <dd>{person.knownFor.join(", ")}</dd>
            </div>
          </dl>
        </aside>
        <div className="panel">
          <div className="panel-heading">
            <h2>Credits</h2>
            <Link href="/movies">
              Browse films
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className="catalogue-list">
            {credits.map((movie) => (
              <MovieRow key={movie.id} movie={movie} href={`/movies/${movie.slug}`} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
