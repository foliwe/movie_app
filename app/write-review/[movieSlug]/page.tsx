import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { WriteReviewView } from "@/components/detail-views";
import { getCurrentUser } from "@/lib/auth";
import { getCatalogueMovieBySlug } from "@/lib/catalog-data";

export const dynamic = "force-dynamic";

export default async function WriteReviewPage({ params }: { params: Promise<{ movieSlug: string }> }) {
  const { movieSlug } = await params;
  const [movie, user] = await Promise.all([getCatalogueMovieBySlug(movieSlug), getCurrentUser()]);

  if (!movie) {
    notFound();
  }

  if (!user) {
    redirect(`/login?next=/write-review/${movieSlug}`);
  }

  return <WriteReviewView movie={movie} />;
}
