import { randomUUID } from "crypto";
import { Prisma, type ReviewStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type CreateReviewInput = {
  movieSlug: string;
  authorId: string;
  rating: number;
  title: string;
  body: string;
};

export type UpdateReviewInput = {
  reviewId: string;
  requesterId: string;
  requesterRole: "Member" | "Admin";
  rating: number;
  title: string;
  body: string;
  status?: ReviewStatus;
};

export type DeleteReviewInput = {
  reviewId: string;
  requesterId: string;
  requesterRole: "Member" | "Admin";
};

export function slugifyReviewTitle(title: string) {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "review";
}

function makeExcerpt(body: string) {
  const normalized = body.trim().replace(/\s+/g, " ");

  return normalized.length > 140 ? `${normalized.slice(0, 137).trimEnd()}...` : normalized;
}

async function makeUniqueReviewSlug(baseSlug: string, tx: Prisma.TransactionClient, excludeReviewId?: string) {
  let slug = baseSlug;
  let suffix = 2;

  while (
    await tx.review.findFirst({
      where: {
        slug,
        id: excludeReviewId ? { not: excludeReviewId } : undefined,
      },
      select: { id: true },
    })
  ) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

function assertReviewContent(title: string, body: string, rating: number) {
  if (title.length < 4 || body.length < 20) {
    throw new Error("Add a title and at least 20 characters of review text.");
  }

  if (rating < 1 || rating > 10) {
    throw new Error("Choose a rating between 1 and 10.");
  }
}

function assertCanManageReview(authorId: string, requesterId: string, requesterRole: "Member" | "Admin") {
  if (authorId !== requesterId && requesterRole !== "Admin") {
    throw new Error("You can only manage reviews you authored.");
  }
}

export async function createReview(input: CreateReviewInput) {
  const title = input.title.trim();
  const body = input.body.trim();
  const rating = Math.round(input.rating);

  assertReviewContent(title, body, rating);

  return prisma.$transaction(async (tx) => {
    const [movie, author] = await Promise.all([
      tx.movie.findUnique({
        where: { slug: input.movieSlug },
        select: {
          id: true,
          communityReviewCount: true,
          averageRating: true,
          workflowStatus: true,
        },
      }),
      tx.user.findUnique({
        where: { id: input.authorId },
        select: {
          id: true,
          location: true,
          reviewCount: true,
          averageRating: true,
        },
      }),
    ]);

    if (!movie || movie.workflowStatus !== "Published") {
      throw new Error("This movie is not available for public reviews.");
    }

    if (!author) {
      throw new Error("Sign in again before publishing a review.");
    }

    const existingReview = await tx.review.findUnique({
      where: {
        authorId_movieId: {
          authorId: author.id,
          movieId: movie.id,
        },
      },
      select: {
        slug: true,
      },
    });

    if (existingReview) {
      throw new Error("You already reviewed this movie. Open your existing review to edit it.");
    }

    const slug = await makeUniqueReviewSlug(slugifyReviewTitle(title), tx);
    const review = await tx.review.create({
      data: {
        id: randomUUID(),
        slug,
        authorId: author.id,
        movieId: movie.id,
        status: "Published",
        location: author.location,
        rating,
        title,
        excerpt: makeExcerpt(body),
        body,
        publishedAt: new Date(),
      },
      select: {
        id: true,
        slug: true,
      },
    });

    const nextMovieReviewCount = movie.communityReviewCount + 1;
    const nextMovieAverageRating =
      (movie.averageRating * movie.communityReviewCount + rating) / nextMovieReviewCount;
    const nextAuthorReviewCount = author.reviewCount + 1;
    const nextAuthorAverageRating =
      (author.averageRating * author.reviewCount + rating) / nextAuthorReviewCount;

    await Promise.all([
      tx.movie.update({
        where: { id: movie.id },
        data: {
          communityReviewCount: nextMovieReviewCount,
          averageRating: Number(nextMovieAverageRating.toFixed(1)),
        },
      }),
      tx.user.update({
        where: { id: author.id },
        data: {
          reviewCount: nextAuthorReviewCount,
          averageRating: Number(nextAuthorAverageRating.toFixed(1)),
        },
      }),
    ]);

    return review;
  });
}

export async function updateReview(input: UpdateReviewInput) {
  const title = input.title.trim();
  const body = input.body.trim();
  const rating = Math.round(input.rating);

  assertReviewContent(title, body, rating);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.review.findUnique({
      where: { id: input.reviewId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            reviewCount: true,
            averageRating: true,
          },
        },
        movie: {
          select: {
            id: true,
            slug: true,
            communityReviewCount: true,
            averageRating: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error("Review was not found.");
    }

    assertCanManageReview(existing.authorId, input.requesterId, input.requesterRole);

    const nextStatus = input.requesterRole === "Admin" && input.status ? input.status : existing.status;
    const updated = await tx.review.update({
      where: { id: existing.id },
      data: {
        rating,
        title,
        excerpt: makeExcerpt(body),
        body,
        status: nextStatus,
        publishedAt: nextStatus === "Published" ? existing.publishedAt : existing.publishedAt,
      },
      select: {
        id: true,
        slug: true,
        author: {
          select: {
            username: true,
          },
        },
        movie: {
          select: {
            slug: true,
          },
        },
      },
    });

    if (existing.status === "Published" || nextStatus === "Published") {
      let nextMovieReviewCount = existing.movie.communityReviewCount;
      let nextMovieAverageRating = existing.movie.averageRating;
      let nextAuthorReviewCount = existing.author.reviewCount;
      let nextAuthorAverageRating = existing.author.averageRating;

      if (existing.status === "Published" && nextStatus === "Published") {
        const ratingDelta = rating - existing.rating;
        nextMovieAverageRating =
          existing.movie.communityReviewCount > 0
            ? existing.movie.averageRating + ratingDelta / existing.movie.communityReviewCount
            : rating;
        nextAuthorAverageRating =
          existing.author.reviewCount > 0
            ? existing.author.averageRating + ratingDelta / existing.author.reviewCount
            : rating;
      } else if (existing.status === "Published") {
        nextMovieReviewCount = Math.max(existing.movie.communityReviewCount - 1, 0);
        nextMovieAverageRating =
          nextMovieReviewCount > 0
            ? (existing.movie.averageRating * existing.movie.communityReviewCount - existing.rating) / nextMovieReviewCount
            : 0;
        nextAuthorReviewCount = Math.max(existing.author.reviewCount - 1, 0);
        nextAuthorAverageRating =
          nextAuthorReviewCount > 0
            ? (existing.author.averageRating * existing.author.reviewCount - existing.rating) / nextAuthorReviewCount
            : 0;
      } else {
        nextMovieReviewCount = existing.movie.communityReviewCount + 1;
        nextMovieAverageRating =
          (existing.movie.averageRating * existing.movie.communityReviewCount + rating) / nextMovieReviewCount;
        nextAuthorReviewCount = existing.author.reviewCount + 1;
        nextAuthorAverageRating =
          (existing.author.averageRating * existing.author.reviewCount + rating) / nextAuthorReviewCount;
      }

      await Promise.all([
        tx.movie.update({
          where: { id: existing.movieId },
          data: {
            communityReviewCount: nextMovieReviewCount,
            averageRating: Number(nextMovieAverageRating.toFixed(1)),
          },
        }),
        tx.user.update({
          where: { id: existing.authorId },
          data: {
            reviewCount: nextAuthorReviewCount,
            averageRating: Number(nextAuthorAverageRating.toFixed(1)),
          },
        }),
      ]);
    }

    return updated;
  });
}

export async function deleteReview(input: DeleteReviewInput) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.review.findUnique({
      where: { id: input.reviewId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            reviewCount: true,
            averageRating: true,
          },
        },
        movie: {
          select: {
            id: true,
            slug: true,
            communityReviewCount: true,
            averageRating: true,
          },
        },
      },
    });

    if (!existing) {
      throw new Error("Review was not found.");
    }

    assertCanManageReview(existing.authorId, input.requesterId, input.requesterRole);

    await tx.review.delete({
      where: { id: existing.id },
    });

    if (existing.status === "Published") {
      const nextMovieReviewCount = Math.max(existing.movie.communityReviewCount - 1, 0);
      const nextMovieAverageRating =
        nextMovieReviewCount > 0
          ? (existing.movie.averageRating * existing.movie.communityReviewCount - existing.rating) / nextMovieReviewCount
          : 0;
      const nextAuthorReviewCount = Math.max(existing.author.reviewCount - 1, 0);
      const nextAuthorAverageRating =
        nextAuthorReviewCount > 0
          ? (existing.author.averageRating * existing.author.reviewCount - existing.rating) / nextAuthorReviewCount
          : 0;

      await Promise.all([
        tx.movie.update({
          where: { id: existing.movieId },
          data: {
            communityReviewCount: nextMovieReviewCount,
            averageRating: Number(nextMovieAverageRating.toFixed(1)),
          },
        }),
        tx.user.update({
          where: { id: existing.authorId },
          data: {
            reviewCount: nextAuthorReviewCount,
            averageRating: Number(nextAuthorAverageRating.toFixed(1)),
          },
        }),
      ]);
    }

    return {
      authorUsername: existing.author.username,
      movieSlug: existing.movie.slug,
    };
  });
}
