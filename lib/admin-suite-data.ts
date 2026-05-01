import { cache } from "react";
import { prisma } from "@/lib/prisma";
import {
  getAdminCatalogueGenres,
  getAdminCatalogueLanguages,
  getAdminCatalogueMovies,
  getAdminCataloguePeople,
  getAdminReviews,
} from "@/lib/catalog-data";

export type AdminSuiteUser = {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  role: "Member" | "Admin";
  location: string;
  reviewCount: number;
  watchedCount: number;
  averageRating: number;
  createdAt: string;
  updatedAt: string;
};

export type AdminSuiteGenre = {
  name: string;
  sortOrder: number;
  movieCount: number;
};

export const getAdminSuiteData = cache(async () => {
  const [movies, people, reviews, users, genres, languages] = await Promise.all([
    getAdminCatalogueMovies(),
    getAdminCataloguePeople(),
    getAdminReviews(),
    prisma.user.findMany({
      orderBy: [{ role: "asc" }, { updatedAt: "desc" }],
    }),
    prisma.genre.findMany({
      include: {
        _count: {
          select: {
            movies: true,
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    }),
    getAdminCatalogueLanguages(),
  ]);

  return {
    movies,
    people,
    reviews,
    languages,
    genres: genres.map((genre): AdminSuiteGenre => ({
      name: genre.name,
      sortOrder: genre.sortOrder,
      movieCount: genre._count.movies,
    })),
    users: users.map((user): AdminSuiteUser => ({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      location: user.location,
      reviewCount: user.reviewCount,
      watchedCount: user.watchedCount,
      averageRating: user.averageRating,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    })),
  };
});
