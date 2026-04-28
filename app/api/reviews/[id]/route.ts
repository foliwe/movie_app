import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteReview, updateReview } from "@/lib/reviews";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in before editing a review." }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    rating?: number;
    title?: string;
    body?: string;
    status?: "Draft" | "Pending" | "Published" | "Hidden";
  };

  try {
    const review = await updateReview({
      reviewId: id,
      requesterId: user.id,
      requesterRole: user.role,
      rating: Number(body.rating),
      title: body.title ?? "",
      body: body.body ?? "",
      status: body.status,
    });

    revalidatePath("/");
    revalidatePath("/reviews");
    revalidatePath(`/reviews/${review.slug}`);
    revalidatePath(`/movies/${review.movie.slug}`);
    revalidatePath(`/profile/${review.author.username}`);

    return NextResponse.json({
      review,
      href: `/reviews/${review.slug}`,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to update review." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ message: "Sign in before deleting a review." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deleted = await deleteReview({
      reviewId: id,
      requesterId: user.id,
      requesterRole: user.role,
    });

    revalidatePath("/");
    revalidatePath("/reviews");
    revalidatePath(`/movies/${deleted.movieSlug}`);
    revalidatePath(`/profile/${deleted.authorUsername}`);

    return NextResponse.json({
      href: `/profile/${deleted.authorUsername}`,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Failed to delete review." },
      { status: 400 },
    );
  }
}
