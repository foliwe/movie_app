import { notFound } from "next/navigation";
import { WriteReviewView } from "@/components/detail-views";
import { getCatalogueMovieBySlug } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function WriteReviewPage({ params }: { params: Promise<{ movieSlug: string }> }) {
  const { movieSlug } = await params;
  const movie = await getCatalogueMovieBySlug(movieSlug);

  if (!movie) {
    notFound();
  }

  return <WriteReviewView movie={movie} />;
}
