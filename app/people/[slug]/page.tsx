import { notFound } from "next/navigation";
import { PersonDetailView } from "@/components/detail-views";
import { getCataloguePersonBySlug, getCreditsForPerson } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const person = await getCataloguePersonBySlug(slug);

  if (!person) {
    notFound();
  }

  const credits = await getCreditsForPerson(person.slug);

  return <PersonDetailView person={person} credits={credits} />;
}
