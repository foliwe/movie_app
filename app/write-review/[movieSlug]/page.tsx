import { notFound } from "next/navigation";
import { WriteReviewForm } from "@/components/forms";
import { MovieMeta, PageHero, PosterBlock, SiteHeader } from "@/components/site";
import { getMovieBySlug, movies } from "@/lib/movies";

export function generateStaticParams() {
  return movies.map((movie) => ({ movieSlug: movie.slug }));
}

export default async function WriteReviewPage({ params }: { params: Promise<{ movieSlug: string }> }) {
  const { movieSlug } = await params;
  const movie = getMovieBySlug(movieSlug);

  if (!movie) {
    notFound();
  }

  return (
    <main>
      <SiteHeader />
      <PageHero eyebrow="Write review" title={movie.title} body="Rate on the planned 1-10 scale and preview the Phase 1 submission states." />
      <section className="split-band detail-grid">
        <div className="panel">
          <WriteReviewForm movie={movie} />
        </div>
        <aside className="selected-film-panel">
          <PosterBlock movie={movie} className="selected-poster" />
          <MovieMeta movie={movie} />
          <p>{movie.synopsis}</p>
        </aside>
      </section>
    </main>
  );
}
