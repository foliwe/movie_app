import { NextRequest, NextResponse } from "next/server";
import { saveAdminMovie, type AdminMovieInput } from "@/lib/admin-movies";
import { getPublishChecklist } from "@/lib/admin-movie-shared";
import { getCurrentAdmin, getCurrentUser } from "@/lib/auth";

const publishLabels = {
  title: "Title",
  slug: "Slug",
  director: "Director",
  synopsis: "Synopsis",
  languages: "Languages",
  genres: "Genres",
  posterUrl: "Poster",
  backdropUrl: "Backdrop",
};

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in before using the admin movie desk." }, { status: 401 });
  }

  const admin = await getCurrentAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Admin access is required." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = (await request.json()) as {
      mode?: "draft" | "publish";
      movie?: AdminMovieInput;
    };

    if (!body.movie || body.movie.id !== id) {
      return NextResponse.json({ message: "Movie payload is missing or invalid." }, { status: 400 });
    }

    if (body.mode === "publish") {
      const blockers = getPublishChecklist(body.movie, publishLabels);
      if (blockers.length > 0) {
        return NextResponse.json(
          { message: `Add the required fields before publishing: ${blockers.join(", ")}` },
          { status: 400 },
        );
      }
    }

    const movie = await saveAdminMovie(
      body.movie,
      body.mode === "publish" ? "Published" : "Draft",
    );

    return NextResponse.json(movie);
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to save movie." },
      { status: 500 },
    );
  }
}
