import { prisma } from "@/lib/prisma";
import { getCatalogueGenres, getCatalogueLanguages, getCatalogueMovies, getCataloguePeople } from "@/lib/catalog-data";
import { slugify } from "@/lib/admin-movie-shared";
import type { CastCredit, CrewCredit, Movie, Person } from "@/lib/movies";

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
  | "palette"
  | "workflowStatus"
  | "status"
  | "posterUrl"
  | "backdropUrl"
  | "trailerUrl"
  | "trailerEmbedUrl"
  | "cast"
  | "crew"
> & {
  trend?: string;
  rating?: number;
  reviews?: number;
};

export async function getAdminMoviesPageData() {
  const [records, people, languages, genres] = await Promise.all([
    getCatalogueMovies(),
    getCataloguePeople(),
    getCatalogueLanguages(),
    getCatalogueGenres(),
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
        palette: "amber",
        workflowStatus: "Draft",
        status: "Published",
        posterUrl: "/assets/homepage-concept.png",
        backdropUrl: "/assets/cameroon-cinema-backdrop.png",
        trailerUrl: "",
        trailerEmbedUrl: "",
      },
    });
  });

  return getAdminMovieById(created.id);
}

export async function getAdminMovieById(id: string) {
  const movies = await getCatalogueMovies();
  return movies.find((movie) => movie.id === id) ?? null;
}

export async function saveAdminMovie(input: AdminMovieInput, nextWorkflowStatus?: Movie["workflowStatus"]) {
  const languages = await getCatalogueLanguages();
  const genres = await getCatalogueGenres();
  const people = await getCataloguePeople();

  const normalized = normalizeMovieInput(input, people);
  validateMovieTaxonomy(normalized, languages, genres);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.movie.findUnique({
      where: { id: normalized.id },
      select: { id: true },
    });

    if (!existing) {
      throw new Error("Movie record was not found.");
    }

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

      const slug = createUniqueSlug(name, people.map((person) => person.slug));
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
      personMap.set(mappedPerson.slug, mappedPerson);

      return createdPerson.id;
    };

    const castCredits = await Promise.all(
      normalized.cast.map(async (credit, index) => ({
        sortOrder: index,
        character: credit.character,
        creditedAs: credit.name,
        personId: await ensurePerson(credit, "cast"),
      })),
    );

    const crewCredits = await Promise.all(
      normalized.crew.map(async (credit, index) => ({
        sortOrder: index,
        job: credit.job,
        creditedAs: credit.name,
        personId: await ensurePerson(credit, "crew"),
      })),
    );

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
        averageRating: normalized.rating,
        communityReviewCount: normalized.reviews,
        palette: normalized.palette,
        workflowStatus: nextWorkflowStatus ?? normalized.workflowStatus,
        status: normalized.status,
        posterUrl: normalized.posterUrl,
        backdropUrl: normalized.backdropUrl,
        trailerUrl: normalized.trailerUrl,
        trailerEmbedUrl: normalized.trailerEmbedUrl || null,
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

  return getAdminMovieById(normalized.id);
}

function normalizeMovieInput(input: AdminMovieInput, people: Person[]): AdminMovieInput {
  const peopleBySlug = new Map(people.map((person) => [person.slug, person]));

  return {
    ...input,
    slug: slugify(input.slug || input.title),
    title: input.title.trim(),
    originalTitle: (input.originalTitle ?? "").trim(),
    country: input.country.trim(),
    director: input.director.trim(),
    synopsis: input.synopsis.trim(),
    trailerUrl: input.trailerUrl.trim(),
    trailerEmbedUrl: (input.trailerEmbedUrl ?? "").trim(),
    posterUrl: input.posterUrl.trim(),
    backdropUrl: input.backdropUrl.trim(),
    trend: (input.trend ?? "").trim() || "Updated in admin",
    rating: input.rating ?? 0,
    reviews: input.reviews ?? 0,
    releaseYear: Number.isFinite(input.releaseYear) ? input.releaseYear : new Date().getFullYear(),
    runtimeMinutes: Number.isFinite(input.runtimeMinutes) ? input.runtimeMinutes : 0,
    languages: uniqueTrimmed(input.languages),
    genres: uniqueTrimmed(input.genres),
    cast: normalizeCastCredits(input.cast, peopleBySlug),
    crew: normalizeCrewCredits(input.crew, peopleBySlug),
  };
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

function uniqueTrimmed(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter((value) => value.length > 0)));
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
