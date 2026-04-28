import { randomBytes, scryptSync } from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { genres, languages, movies, people, reviews, userProfiles } from "@/lib/movies";

const datasourceUrl = process.env.DATABASE_URL ?? "postgresql://movieapp:movieapp@localhost:5432/movieapp";
const adapter = new PrismaPg({ connectionString: datasourceUrl });
const prisma = new PrismaClient({
  adapter,
});

function hashSeedPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 64).toString("base64url");

  return `scrypt$${salt}$${hash}`;
}

async function main() {
  await prisma.review.deleteMany();
  await prisma.movieCast.deleteMany();
  await prisma.movieCrew.deleteMany();
  await prisma.galleryImage.deleteMany();
  await prisma.movieGenre.deleteMany();
  await prisma.movieLanguage.deleteMany();
  await prisma.user.deleteMany();
  await prisma.person.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.language.deleteMany();
  await prisma.movie.deleteMany();

  const languageMap = new Map<string, string>();
  for (const [index, language] of languages.filter((entry) => entry !== "All").entries()) {
    const created = await prisma.language.create({
      data: {
        name: language,
        sortOrder: index,
      },
    });
    languageMap.set(language, created.id);
  }

  const genreMap = new Map<string, string>();
  for (const [index, genre] of genres.filter((entry) => entry !== "All").entries()) {
    const created = await prisma.genre.create({
      data: {
        name: genre,
        sortOrder: index,
      },
    });
    genreMap.set(genre, created.id);
  }

  for (const person of people) {
    await prisma.person.create({
      data: {
        id: person.id,
        slug: person.slug,
        name: person.name,
        role: person.role,
        location: person.location,
        bio: person.bio,
        knownForTitles: person.knownFor,
        palette: person.palette,
        photoUrl: person.photoUrl,
      },
    });
  }

  const userIdByUsername = new Map<string, string>();
  const admin = await prisma.user.create({
    data: {
      username: "admin",
      displayName: "Mboko Admin",
      email: "admin@example.com",
      role: "Admin",
      location: "Admin desk",
      bio: "Seeded administrator for managing catalogue drafts and moderation.",
      favoriteLanguages: ["French", "English", "Pidgin"],
      watchedCount: 0,
      reviewCount: 0,
      averageRating: 0,
      passwordHash: hashSeedPassword("admin1234"),
    },
  });
  userIdByUsername.set(admin.username, admin.id);

  for (const profile of userProfiles) {
    const created = await prisma.user.create({
      data: {
        username: profile.username,
        displayName: profile.displayName,
        email: `${profile.username}@example.com`,
        location: profile.location,
        bio: profile.bio,
        favoriteLanguages: profile.favoriteLanguages,
        watchedCount: profile.watched,
        reviewCount: profile.reviews,
        averageRating: profile.averageRating,
        passwordHash: hashSeedPassword("password123"),
      },
    });
    userIdByUsername.set(profile.username, created.id);
  }

  for (const [index, movie] of movies.entries()) {
    await prisma.movie.create({
      data: {
        id: movie.id,
        slug: movie.slug,
        sortOrder: index,
        title: movie.title,
        originalTitle: movie.originalTitle,
        releaseYear: movie.releaseYear,
        releaseDate: movie.releaseDate ? new Date(movie.releaseDate) : undefined,
        country: movie.country,
        runtimeMinutes: movie.runtimeMinutes,
        director: movie.director,
        synopsis: movie.synopsis,
        averageRating: movie.rating,
        communityReviewCount: movie.reviews,
        trend: movie.trend,
        palette: movie.palette,
        workflowStatus: movie.workflowStatus,
        status: movie.status,
        posterUrl: movie.posterUrl,
        backdropUrl: movie.backdropUrl,
        trailerUrl: movie.trailerUrl,
        trailerEmbedUrl: movie.trailerEmbedUrl,
        languages: {
          create: movie.languages.map((language, languageIndex) => ({
            sortOrder: languageIndex,
            language: {
              connect: {
                id: languageMap.get(language),
              },
            },
          })),
        },
        genres: {
          create: movie.genres.map((genre, genreIndex) => ({
            sortOrder: genreIndex,
            genre: {
              connect: {
                id: genreMap.get(genre),
              },
            },
          })),
        },
        galleryImages: {
          create: movie.galleryImages.map((image, imageIndex) => ({
            src: image.src,
            alt: image.alt,
            sortOrder: imageIndex,
          })),
        },
        castCredits: {
          create: movie.cast.map((credit, creditIndex) => ({
            sortOrder: creditIndex,
            character: credit.character,
            creditedAs: credit.name,
            person: {
              connect: {
                id: credit.personSlug,
              },
            },
          })),
        },
        crewCredits: {
          create: movie.crew.map((credit, creditIndex) => ({
            sortOrder: creditIndex,
            job: credit.job,
            creditedAs: credit.name,
            person: {
              connect: {
                id: credit.personSlug,
              },
            },
          })),
        },
      },
    });
  }

  for (const review of reviews) {
    const authorId = userIdByUsername.get(review.username);
    if (!authorId) {
      throw new Error(`Missing user for review author ${review.username}`);
    }

    const movie = movies.find((entry) => entry.slug === review.movieSlug);
    if (!movie) {
      throw new Error(`Missing movie for review ${review.slug}`);
    }

    await prisma.review.create({
      data: {
        id: review.id,
        slug: review.slug,
        author: {
          connect: {
            id: authorId,
          },
        },
        movie: {
          connect: {
            id: movie.id,
          },
        },
        location: review.location,
        rating: review.rating,
        title: review.title,
        excerpt: review.excerpt,
        body: review.body,
        publishedAt: new Date(review.publishedAt),
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
