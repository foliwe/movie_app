import { notFound } from "next/navigation";
import { PersonDetailView } from "@/components/detail-views";
import { getPersonBySlug, movies, people } from "@/lib/movies";

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

  return <PersonDetailView person={person} credits={credits} />;
}
