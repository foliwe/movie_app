import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getAdminCatalogueGenres,
  getAdminCatalogueLanguages,
  getAdminCatalogueMovies,
  getAdminCataloguePeople,
} from "@/lib/catalog-data";
import { slugify } from "@/lib/admin-movie-shared";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";
import type { CastCredit, CrewCredit, Movie, Person } from "@/lib/movies";

const adminMovieInclude = {
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

type AdminMovieRecord = Prisma.MovieGetPayload<{ include: typeof adminMovieInclude }>;

function mapAdminMovie(record: AdminMovieRecord): Movie {
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
    editorPick: record.editorPick,
    palette: record.palette,
    workflowStatus: record.workflowStatus,
    status: record.status,
    posterUrl: record.posterUrl,
    posterPublicId: record.posterPublicId ?? undefined,
    backdropUrl: record.backdropUrl,
    backdropPublicId: record.backdropPublicId ?? undefined,
    trailerUrl: record.trailerUrl,
    trailerPublicId: record.trailerPublicId ?? undefined,
    trailerSourceType: record.trailerSourceType,
    trailerEmbedUrl: record.trailerEmbedUrl ?? undefined,
    galleryImages: record.galleryImages.map((image) => ({
      src: image.src,
      publicId: image.publicId ?? undefined,
      alt: image.alt,
    })),
    cast: record.castCredits.map((credit) => ({
      personSlug: credit.person.slug,
      name: credit.creditedAs ?? credit.person.name,
      character: credit.character,
      photoUrl: credit.person.photoUrl ?? undefined,
      palette: credit.person.palette,
    })),
    crew: record.crewCredits.map((credit) => ({
      personSlug: credit.person.slug,
      name: credit.creditedAs ?? credit.person.name,
      job: credit.job,
      photoUrl: credit.person.photoUrl ?? undefined,
      palette: credit.person.palette,
    })),
  };
}

export type AdminMovieInput = Pick<
  Movie,
  | "id"
  | "slug"
  | "title"
  | "originalTitle"
  | "releaseYear"
  | "releaseDate"
  | "country"
  | "runtimeMinutes"
  | "director"
  | "genres"
  | "languages"
  | "synopsis"
  | "editorPick"
  | "palette"
  | "workflowStatus"
  | "status"
  | "posterUrl"
  | "posterPublicId"
  | "backdropUrl"
  | "backdropPublicId"
  | "trailerUrl"
  | "trailerPublicId"
  | "trailerSourceType"
  | "trailerEmbedUrl"
  | "galleryImages"
  | "cast"
  | "crew"
> & {
  trend?: string;
  rating?: number;
  reviews?: number;
};

export async function getAdminMoviesPageData() {
  const [records, people, languages, genres] = await Promise.all([
    getAdminCatalogueMovies(),
    getAdminCataloguePeople(),
    getAdminCatalogueLanguages(),
    getAdminCatalogueGenres(),
  ]);

  return {
    records,
    people,
    languages: languages.filter((entry) => entry !== "All"),
    genres: genres.filter((entry) => entry !== "All"),
  };
}

export async function createAdminDraft() {
  const created = await prisma.$transaction(async (tx) => {
    const count = await tx.movie.count();
    const existingMovies = await tx.movie.findMany({
      select: {
        id: true,
        sortOrder: true,
      },
      orderBy: {
        sortOrder: "desc",
      },
    });

    for (const movie of existingMovies) {
      await tx.movie.update({
        where: {
          id: movie.id,
        },
        data: {
          sortOrder: movie.sortOrder + 1,
        },
      });
    }

    return tx.movie.create({
      data: {
        id: `draft-${Date.now()}`,
        slug: `untitled-draft-${count + 1}`,
        sortOrder: 0,
        title: "Untitled draft",
        originalTitle: "",
        releaseYear: new Date().getFullYear(),
        country: "Cameroon",
        runtimeMinutes: 90,
        director: "",
        synopsis: "",
        averageRating: 0,
        communityReviewCount: 0,
        trend: "New draft",
        editorPick: false,
        palette: "amber",
        workflowStatus: "Draft",
        status: "Published",
        posterUrl: "/assets/homepage-concept.png",
        posterPublicId: null,
        backdropUrl: "/assets/cameroon-cinema-backdrop.png",
        backdropPublicId: null,
        trailerUrl: "",
        trailerPublicId: null,
        trailerSourceType: "External",
        trailerEmbedUrl: "",
      },
    });
  });

  return getAdminMovieById(created.id);
}

export async function getAdminMovieById(id: string) {
  const movie = await prisma.movie.findUnique({
    where: { id },
    include: adminMovieInclude,
  });

  return movie ? mapAdminMovie(movie) : null;
}

export async function saveAdminMovie(input: AdminMovieInput, nextWorkflowStatus?: Movie["workflowStatus"]) {
  const languages = await getAdminCatalogueLanguages();
  const genres = await getAdminCatalogueGenres();
  const people = await getAdminCataloguePeople();

  const normalized = normalizeMovieInput(input, people);
  validateMovieTaxonomy(normalized, languages, genres);
  validateMovieMedia(normalized);

  const previousMovie = await prisma.movie.findUnique({
    where: { id: normalized.id },
    include: {
      galleryImages: true,
    },
  });

  if (!previousMovie) {
    throw new Error("Movie record was not found.");
  }

  const effectiveWorkflowStatus = nextWorkflowStatus ?? normalized.workflowStatus;
  const normalizedRating = normalized.rating ?? 0;
  const shouldDefaultPublishedRating =
    effectiveWorkflowStatus === "Published" &&
    previousMovie.workflowStatus !== "Published" &&
    normalizedRating <= 0;
  const effectiveRating = shouldDefaultPublishedRating ? 1 : normalizedRating;

  await prisma.$transaction(async (tx) => {
    const languageRows = await tx.language.findMany({
      where: {
        name: {
          in: normalized.languages,
        },
      },
    });
    const genreRows = await tx.genre.findMany({
      where: {
        name: {
          in: normalized.genres,
        },
      },
    });

    if (languageRows.length !== normalized.languages.length) {
      throw new Error("One or more selected languages are invalid.");
    }

    if (genreRows.length !== normalized.genres.length) {
      throw new Error("One or more selected genres are invalid.");
    }

    const existingSlugs = (
      await tx.movie.findMany({
        where: {
          NOT: {
            id: normalized.id,
          },
        },
        select: {
          slug: true,
        },
      })
    ).map((entry) => entry.slug);
    const resolvedSlug = existingSlugs.includes(normalized.slug)
      ? createUniqueSlug(normalized.slug, existingSlugs)
      : normalized.slug;

    const personMap = new Map<string, Person>(people.map((person) => [person.slug, person]));
    const knownPersonSlugs = new Set(people.map((person) => person.slug));
    const customPeopleByName = new Map<string, string>();

    const ensurePerson = async (credit: CastCredit | CrewCredit, type: "cast" | "crew") => {
      if (credit.personSlug.trim().length > 0) {
        const existingPerson = personMap.get(credit.personSlug);
        if (!existingPerson) {
          throw new Error(`Unknown person slug: ${credit.personSlug}`);
        }

        return existingPerson.id;
      }

      const name = credit.name.trim();
      if (name.length === 0) {
        throw new Error("Custom credits must include a display name.");
      }

      const customPersonKey = slugify(name);
      const existingCustomPersonId = customPeopleByName.get(customPersonKey);
      if (existingCustomPersonId) {
        return existingCustomPersonId;
      }

      const slug = createUniqueSlug(name, Array.from(knownPersonSlugs));
      const createdPerson = await tx.person.create({
        data: {
          id: slug,
          slug,
          name,
          role: type === "cast" ? "Actor" : "Contributor",
          location: "Cameroon",
          bio:
            type === "cast"
              ? "New cast contributor added from the admin movie desk."
              : "New crew contributor added from the admin movie desk.",
          knownForTitles: [normalized.title],
          palette: normalized.palette,
          photoUrl: null,
        },
      });

      const mappedPerson: Person = {
        id: createdPerson.id,
        slug: createdPerson.slug,
        name: createdPerson.name,
        role: createdPerson.role,
        location: createdPerson.location,
        bio: createdPerson.bio,
        knownFor: createdPerson.knownForTitles,
        palette: createdPerson.palette,
        photoUrl: createdPerson.photoUrl ?? undefined,
      };
      people.push(mappedPerson);
      knownPersonSlugs.add(mappedPerson.slug);
      customPeopleByName.set(customPersonKey, mappedPerson.id);
      personMap.set(mappedPerson.slug, mappedPerson);

      return createdPerson.id;
    };

    const castCredits = await mapCreditsSequentially(normalized.cast, async (credit, index) => ({
      sortOrder: index,
      character: credit.character,
      creditedAs: credit.name,
      personId: await ensurePerson(credit, "cast"),
    }));

    const crewCredits = await mapCreditsSequentially(normalized.crew, async (credit, index) => ({
      sortOrder: index,
      job: credit.job,
      creditedAs: credit.name,
      personId: await ensurePerson(credit, "crew"),
    }));

    await tx.movie.update({
      where: { id: normalized.id },
      data: {
        slug: resolvedSlug,
        title: normalized.title,
        originalTitle: normalized.originalTitle || null,
        releaseYear: normalized.releaseYear,
        releaseDate: normalized.releaseDate ? new Date(normalized.releaseDate) : null,
        country: normalized.country,
        runtimeMinutes: normalized.runtimeMinutes,
        director: normalized.director,
        synopsis: normalized.synopsis,
        trend: normalized.trend,
        averageRating: effectiveRating,
        communityReviewCount: normalized.reviews,
        palette: normalized.palette,
        editorPick: normalized.editorPick,
        workflowStatus: effectiveWorkflowStatus,
        status: normalized.status,
        posterUrl: normalized.posterUrl,
        posterPublicId: normalized.posterPublicId || null,
        backdropUrl: normalized.backdropUrl,
        backdropPublicId: normalized.backdropPublicId || null,
        trailerUrl: normalized.trailerUrl,
        trailerPublicId: normalized.trailerPublicId || null,
        trailerSourceType: normalized.trailerSourceType,
        trailerEmbedUrl: normalized.trailerEmbedUrl || null,
        galleryImages: {
          deleteMany: {},
          create: normalized.galleryImages.map((image, index) => ({
            src: image.src,
            publicId: image.publicId || null,
            alt: image.alt,
            sortOrder: index,
          })),
        },
        languages: {
          deleteMany: {},
          create: normalized.languages.map((language, index) => ({
            sortOrder: index,
            language: {
              connect: {
                id: languageRows.find((entry) => entry.name === language)?.id,
              },
            },
          })),
        },
        genres: {
          deleteMany: {},
          create: normalized.genres.map((genre, index) => ({
            sortOrder: index,
            genre: {
              connect: {
                id: genreRows.find((entry) => entry.name === genre)?.id,
              },
            },
          })),
        },
        castCredits: {
          deleteMany: {},
          create: castCredits.map((credit) => ({
            sortOrder: credit.sortOrder,
            character: credit.character,
            creditedAs: credit.creditedAs,
            person: {
              connect: {
                id: credit.personId,
              },
            },
          })),
        },
        crewCredits: {
          deleteMany: {},
          create: crewCredits.map((credit) => ({
            sortOrder: credit.sortOrder,
            job: credit.job,
            creditedAs: credit.creditedAs,
            person: {
              connect: {
                id: credit.personId,
              },
            },
          })),
        },
      },
    });
  });

  await cleanupReplacedAssets(previousMovie, normalized);

  return getAdminMovieById(normalized.id);
}

function normalizeMovieInput(input: AdminMovieInput, people: Person[]): AdminMovieInput {
  const peopleBySlug = new Map(people.map((person) => [person.slug, person]));

  const normalized: AdminMovieInput = {
    ...input,
    slug: slugify(input.slug || input.title),
    title: input.title.trim(),
    originalTitle: (input.originalTitle ?? "").trim(),
    country: input.country.trim(),
    director: input.director.trim(),
    synopsis: input.synopsis.trim(),
    trailerUrl: input.trailerUrl.trim(),
    trailerPublicId: (input.trailerPublicId ?? "").trim() || undefined,
    trailerSourceType: input.trailerSourceType,
    trailerEmbedUrl: (input.trailerEmbedUrl ?? "").trim(),
    posterUrl: input.posterUrl.trim(),
    posterPublicId: (input.posterPublicId ?? "").trim() || undefined,
    backdropUrl: input.backdropUrl.trim(),
    backdropPublicId: (input.backdropPublicId ?? "").trim() || undefined,
    galleryImages: normalizeGalleryImages(input.galleryImages),
    trend: (input.trend ?? "").trim() || "Updated in admin",
    editorPick: Boolean(input.editorPick),
    rating: input.rating ?? 0,
    reviews: input.reviews ?? 0,
    releaseYear: Number.isFinite(input.releaseYear) ? input.releaseYear : new Date().getFullYear(),
    runtimeMinutes: Number.isFinite(input.runtimeMinutes) ? input.runtimeMinutes : 0,
    languages: uniqueTrimmed(input.languages),
    genres: uniqueTrimmed(input.genres),
    cast: normalizeCastCredits(input.cast, peopleBySlug),
    crew: normalizeCrewCredits(input.crew, peopleBySlug),
  };

  if (normalized.trailerSourceType === "Cloudinary") {
    normalized.trailerEmbedUrl = "";
  } else {
    normalized.trailerPublicId = undefined;
  }

  return normalized;
}

function normalizeGalleryImages(images: Movie["galleryImages"]) {
  return images
    .map((image) => ({
      src: image.src.trim(),
      publicId: image.publicId?.trim() || undefined,
      alt: image.alt.trim(),
    }))
    .filter((image) => image.src.length > 0);
}

function normalizeCastCredits(credits: CastCredit[], peopleBySlug: Map<string, Person>) {
  return credits
    .map((credit) => {
      const selectedPerson = peopleBySlug.get(credit.personSlug);
      const name = (credit.name || selectedPerson?.name || "").trim();
      const character = credit.character.trim();
      return {
        personSlug: credit.personSlug.trim(),
        name,
        character,
      };
    })
    .filter((credit) => credit.name.length > 0 || credit.character.length > 0 || credit.personSlug.length > 0)
    .filter((credit) => credit.character.length > 0);
}

function normalizeCrewCredits(credits: CrewCredit[], peopleBySlug: Map<string, Person>) {
  return credits
    .map((credit) => {
      const selectedPerson = peopleBySlug.get(credit.personSlug);
      const name = (credit.name || selectedPerson?.name || "").trim();
      const job = credit.job.trim();
      return {
        personSlug: credit.personSlug.trim(),
        name,
        job,
      };
    })
    .filter((credit) => credit.name.length > 0 || credit.job.length > 0 || credit.personSlug.length > 0)
    .filter((credit) => credit.job.length > 0);
}

function validateMovieTaxonomy(movie: AdminMovieInput, languages: string[], genres: string[]) {
  const validLanguages = new Set(languages.filter((entry) => entry !== "All"));
  const validGenres = new Set(genres.filter((entry) => entry !== "All"));

  for (const language of movie.languages) {
    if (!validLanguages.has(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }
  }

  for (const genre of movie.genres) {
    if (!validGenres.has(genre)) {
      throw new Error(`Unsupported genre: ${genre}`);
    }
  }
}

function validateMovieMedia(movie: AdminMovieInput) {
  if (movie.trailerSourceType === "Cloudinary") {
    if (movie.trailerUrl.length === 0 || !movie.trailerPublicId) {
      throw new Error("Cloudinary trailers require both a video URL and Cloudinary public ID.");
    }
  } else if (movie.trailerUrl.length === 0 && (movie.trailerEmbedUrl ?? "").length > 0) {
    throw new Error("External trailer embeds also require a trailer URL.");
  }

  for (const image of movie.galleryImages) {
    if (image.alt.length === 0) {
      throw new Error("Each gallery image must include alt text.");
    }
  }
}

function uniqueTrimmed(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)));
}

async function mapCreditsSequentially<TInput, TOutput>(
  credits: TInput[],
  mapper: (credit: TInput, index: number) => Promise<TOutput>,
) {
  const results: TOutput[] = [];

  for (const [index, credit] of credits.entries()) {
    results.push(await mapper(credit, index));
  }

  return results;
}

function createUniqueSlug(value: string, existingSlugs: string[]) {
  const base = slugify(value);
  if (!existingSlugs.includes(base)) {
    return base;
  }

  let suffix = 2;
  while (existingSlugs.includes(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

async function cleanupReplacedAssets(
  previousMovie: Prisma.MovieGetPayload<{ include: { galleryImages: true } }>,
  nextMovie: AdminMovieInput,
) {
  const deletions: Array<Promise<void>> = [];

  if (previousMovie.posterPublicId && previousMovie.posterPublicId !== nextMovie.posterPublicId) {
    deletions.push(deleteCloudinaryAsset(previousMovie.posterPublicId, "image"));
  }

  if (previousMovie.backdropPublicId && previousMovie.backdropPublicId !== nextMovie.backdropPublicId) {
    deletions.push(deleteCloudinaryAsset(previousMovie.backdropPublicId, "image"));
  }

  if (previousMovie.trailerPublicId && previousMovie.trailerPublicId !== nextMovie.trailerPublicId) {
    deletions.push(deleteCloudinaryAsset(previousMovie.trailerPublicId, "video"));
  }

  const nextGalleryPublicIds = new Set(
    nextMovie.galleryImages.map((image) => image.publicId).filter((publicId): publicId is string => Boolean(publicId)),
  );

  for (const image of previousMovie.galleryImages) {
    if (image.publicId && !nextGalleryPublicIds.has(image.publicId)) {
      deletions.push(deleteCloudinaryAsset(image.publicId, "image"));
    }
  }

  if (deletions.length === 0) {
    return;
  }

  const results = await Promise.allSettled(deletions);

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Failed to delete replaced Cloudinary asset", result.reason);
    }
  }
}
