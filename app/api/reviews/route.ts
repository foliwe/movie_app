import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createReview } from "@/lib/reviews";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in before publishing a review." }, { status: 401 });
  }

  const body = (await request.json()) as {
    movieSlug?: string;
    rating?: number;
    title?: string;
    body?: string;
  };

  try {
    const review = await createReview({
      movieSlug: body.movieSlug ?? "",
      authorId: user.id,
      rating: Number(body.rating),
      title: body.title ?? "",
      body: body.body ?? "",
    });

    revalidatePath("/");
    revalidatePath("/reviews");
    revalidatePath(`/reviews/${review.slug}`);
    revalidatePath(`/movies/${body.movieSlug}`);
    revalidatePath(`/profile/${user.username}`);

    return NextResponse.json(
      {
        review,
        href: `/reviews/${review.slug}`,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to publish review." },
      { status: 400 },
    );
  }
}
