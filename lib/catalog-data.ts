import { cache } from "react";
import { Prisma, type Palette } from "@/generated/prisma/client";
import type { AuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { CastCredit, CrewCredit, Movie, Person, Review, UserProfile } from "@/lib/movies";

const movieInclude = {
  languages: {
    include: {
      language: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  },
  genres: {
    include: {
      genre: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  },
  galleryImages: {
    orderBy: {
      sortOrder: "asc",
    },
  },
  castCredits: {
    include: {
      person: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  },
  crewCredits: {
    include: {
      person: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  },
} satisfies Prisma.MovieInclude;

const reviewInclude = {
  author: true,
  movie: {
    include: {
      languages: {
        include: {
          language: true,
        },
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  },
} satisfies Prisma.ReviewInclude;

type MovieRecord = Prisma.MovieGetPayload<{ include: typeof movieInclude }>;
type ReviewRecord = Prisma.ReviewGetPayload<{ include: typeof reviewInclude }>;
type UserRecord = Prisma.UserGetPayload<Record<string, never>>;

const publicMovieWhere = {
  workflowStatus: "Published",
} satisfies Prisma.MovieWhereInput;

const publicPersonWhere = {
  OR: [
    {
      castCredits: {
        some: {
          movie: publicMovieWhere,
        },
      },
    },
    {
      crewCredits: {
        some: {
          movie: publicMovieWhere,
        },
      },
    },
  ],
} satisfies Prisma.PersonWhereInput;

const publicReviewWhere = {
  status: "Published",
  movie: publicMovieWhere,
} satisfies Prisma.ReviewWhereInput;

function mapPalette(palette: Palette): Movie["palette"] {
  return palette;
}

function mapCastCredit(credit: MovieRecord["castCredits"][number]): CastCredit {
  return {
    personSlug: credit.person.slug,
    name: credit.creditedAs ?? credit.person.name,
    character: credit.character,
    photoUrl: credit.person.photoUrl ?? undefined,
    palette: mapPalette(credit.person.palette),
  };
}

function mapCrewCredit(credit: MovieRecord["crewCredits"][number]): CrewCredit {
  return {
    personSlug: credit.person.slug,
    name: credit.creditedAs ?? credit.person.name,
    job: credit.job,
    photoUrl: credit.person.photoUrl ?? undefined,
    palette: mapPalette(credit.person.palette),
  };
}

function mapMovie(record: MovieRecord): Movie {
  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    originalTitle: record.originalTitle ?? undefined,
    releaseYear: record.releaseYear,
    releaseDate: record.releaseDate?.toISOString().slice(0, 10),
    country: record.country,
    runtimeMinutes: record.runtimeMinutes,
    director: record.director,
    genres: record.genres.map((entry) => entry.genre.name),
    languages: record.languages.map((entry) => entry.language.name),
    synopsis: record.synopsis,
    rating: record.averageRating,
    reviews: record.communityReviewCount,
    trend: record.trend,
    palette: mapPalette(record.palette),
    workflowStatus: record.workflowStatus,
    status: record.status,
    posterUrl: record.posterUrl,
    backdropUrl: record.backdropUrl,
    trailerUrl: record.trailerUrl,
    trailerEmbedUrl: record.trailerEmbedUrl ?? undefined,
    galleryImages: record.galleryImages.map((image) => ({
      src: image.src,
      alt: image.alt,
    })),
    cast: record.castCredits.map(mapCastCredit),
    crew: record.crewCredits.map(mapCrewCredit),
  };
}

function mapPerson(record: Prisma.PersonGetPayload<Record<string, never>>): Person {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    role: record.role,
    location: record.location,
    bio: record.bio,
    knownFor: record.knownForTitles,
    palette: mapPalette(record.palette),
    photoUrl: record.photoUrl ?? undefined,
  };
}

function mapReview(record: ReviewRecord): Review {
  return {
    id: record.id,
    slug: record.slug,
    status: record.status,
    author: record.author.displayName,
    username: record.author.username,
    location: record.location,
    movieSlug: record.movie.slug,
    movieTitle: record.movie.title,
    rating: record.rating,
    title: record.title,
    excerpt: record.excerpt,
    body: record.body,
    publishedAt: record.publishedAt.toISOString().slice(0, 10),
    movieLanguages: record.movie.languages.map((entry) => entry.language.name),
  };
}

function mapUserProfile(record: UserRecord): UserProfile {
  return {
    username: record.username,
    displayName: record.displayName,
    location: record.location,
    bio: record.bio,
    favoriteLanguages: record.favoriteLanguages,
    watched: record.watchedCount,
    reviews: record.reviewCount,
    averageRating: record.averageRating,
  };
}

export const getCatalogueGenres = cache(async () => {
  const genres = await prisma.genre.findMany({
    where: {
      movies: {
        some: {
          movie: publicMovieWhere,
        },
      },
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  return ["All", ...genres.map((genre) => genre.name)];
});

export const getCatalogueLanguages = cache(async () => {
  const languages = await prisma.language.findMany({
    where: {
      movies: {
        some: {
          movie: publicMovieWhere,
        },
      },
    },
    orderBy: {
      sortOrder: "asc",
    },
  });

  return ["All", ...languages.map((language) => language.name)];
});

export const getCatalogueMovies = cache(async () => {
  const movies = await prisma.movie.findMany({
    where: publicMovieWhere,
    include: movieInclude,
    orderBy: {
      sortOrder: "asc",
    },
  });

  return movies.map(mapMovie);
});

export const getCatalogueMovieBySlug = cache(async (slug: string) => {
  const movie = await prisma.movie.findFirst({
    where: {
      slug,
      ...publicMovieWhere,
    },
    include: movieInclude,
  });

  return movie ? mapMovie(movie) : null;
});

export const getCataloguePeople = cache(async () => {
  const people = await prisma.person.findMany({
    where: publicPersonWhere,
    orderBy: {
      name: "asc",
    },
  });

  return people.map(mapPerson);
});

export const getCataloguePersonBySlug = cache(async (slug: string) => {
  const person = await prisma.person.findFirst({
    where: {
      slug,
      ...publicPersonWhere,
    },
  });

  return person ? mapPerson(person) : null;
});

export const getCreditsForPerson = cache(async (personSlug: string) => {
  const movies = await prisma.movie.findMany({
    where: {
      AND: [
        publicMovieWhere,
        {
          OR: [
            {
              castCredits: {
                some: {
                  person: {
                    slug: personSlug,
                  },
                },
              },
            },
            {
              crewCredits: {
                some: {
                  person: {
                    slug: personSlug,
                  },
                },
              },
            },
          ],
        },
      ],
    },
    include: movieInclude,
    orderBy: {
      sortOrder: "asc",
    },
  });

  return movies.map(mapMovie);
});

export const getCatalogueReviews = cache(async () => {
  const reviews = await prisma.review.findMany({
    where: publicReviewWhere,
    include: reviewInclude,
    orderBy: {
      publishedAt: "desc",
    },
  });

  return reviews.map(mapReview);
});

export const getCatalogueReviewByIdOrSlug = cache(async (idOrSlug: string) => {
  const review = await prisma.review.findFirst({
    where: {
      status: "Published",
      movie: publicMovieWhere,
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: reviewInclude,
  });

  return review ? mapReview(review) : null;
});

export const getAccessibleReviewByIdOrSlug = cache(
  async (idOrSlug: string, viewerId?: string, viewerRole?: AuthUser["role"]) => {
    const viewerScopedWhere =
      viewerRole === "Admin"
        ? {
            OR: [{ id: idOrSlug }, { slug: idOrSlug }],
          }
        : viewerId
          ? {
              OR: [
                {
                  ...publicReviewWhere,
                  OR: [{ id: idOrSlug }, { slug: idOrSlug }],
                },
                {
                  authorId: viewerId,
                  OR: [{ id: idOrSlug }, { slug: idOrSlug }],
                },
              ],
            }
          : {
              ...publicReviewWhere,
              OR: [{ id: idOrSlug }, { slug: idOrSlug }],
            };

    const review = await prisma.review.findFirst({
      where: viewerScopedWhere,
      include: reviewInclude,
    });

    return review ? mapReview(review) : null;
  },
);

export const getReviewsForMovie = cache(async (movieSlug: string) => {
  const reviews = await prisma.review.findMany({
    where: {
      status: "Published",
      movie: {
        slug: movieSlug,
        ...publicMovieWhere,
      },
    },
    include: reviewInclude,
    orderBy: {
      publishedAt: "desc",
    },
  });

  return reviews.map(mapReview);
});

export const getCatalogueProfiles = cache(async () => {
  const profiles = await prisma.user.findMany({
    orderBy: {
      username: "asc",
    },
  });

  return profiles.map(mapUserProfile);
});

export const getCatalogueProfileByUsername = cache(async (username: string) => {
  const profile = await prisma.user.findUnique({
    where: { username },
  });

  return profile ? mapUserProfile(profile) : null;
});

export const getReviewsByUsername = cache(async (username: string) => {
  const reviews = await prisma.review.findMany({
    where: {
      status: "Published",
      movie: publicMovieWhere,
      author: {
        username,
      },
    },
    include: reviewInclude,
    orderBy: {
      publishedAt: "desc",
    },
  });

  return reviews.map(mapReview);
});

export const getAccountReviews = cache(async (authorId: string) => {
  const reviews = await prisma.review.findMany({
    where: {
      authorId,
    },
    include: reviewInclude,
    orderBy: [{ updatedAt: "desc" }, { publishedAt: "desc" }],
  });

  return reviews.map(mapReview);
});

export const getAdminReviews = cache(async () => {
  const reviews = await prisma.review.findMany({
    include: reviewInclude,
    orderBy: [{ updatedAt: "desc" }, { publishedAt: "desc" }],
  });

  const statusRank: Record<NonNullable<Review["status"]>, number> = {
    Pending: 0,
    Draft: 1,
    Hidden: 2,
    Published: 3,
  };

  return reviews
    .map(mapReview)
    .sort(
      (left, right) =>
        statusRank[left.status ?? "Published"] - statusRank[right.status ?? "Published"] ||
        right.publishedAt.localeCompare(left.publishedAt),
    );
});

export const getAdminCatalogueGenres = cache(async () => {
  const genres = await prisma.genre.findMany({
    orderBy: {
      sortOrder: "asc",
    },
  });

  return ["All", ...genres.map((genre) => genre.name)];
});

export const getAdminCatalogueLanguages = cache(async () => {
  const languages = await prisma.language.findMany({
    orderBy: {
      sortOrder: "asc",
    },
  });

  return ["All", ...languages.map((language) => language.name)];
});

export const getAdminCatalogueMovies = cache(async () => {
  const movies = await prisma.movie.findMany({
    include: movieInclude,
    orderBy: {
      sortOrder: "asc",
    },
  });

  return movies.map(mapMovie);
});

export const getAdminCataloguePeople = cache(async () => {
  const people = await prisma.person.findMany({
    orderBy: {
      name: "asc",
    },
  });

  return people.map(mapPerson);
});
