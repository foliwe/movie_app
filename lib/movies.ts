export type Movie = {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  releaseYear: number;
  country: string;
  runtimeMinutes: number;
  director: string;
  genres: string[];
  languages: string[];
  synopsis: string;
  rating: number;
  reviews: number;
  trend: string;
  palette: "amber" | "teal" | "rose" | "ivory" | "green";
};

export type Review = {
  id: string;
  author: string;
  location: string;
  movieTitle: string;
  rating: number;
  excerpt: string;
};

export const movies: Movie[] = [
  {
    id: "mambar-pierrette",
    slug: "mambar-pierrette",
    title: "Mambar Pierrette",
    releaseYear: 2023,
    country: "Cameroon / Belgium",
    runtimeMinutes: 93,
    director: "Rosine Mbakam",
    genres: ["Drama", "Slice of life"],
    languages: ["French", "Pidgin", "Bamileke"],
    synopsis:
      "A Douala seamstress keeps her family and shop afloat while daily setbacks keep testing her patience, humor, and resolve.",
    rating: 8.7,
    reviews: 128,
    trend: "+24% this week",
    palette: "amber",
  },
  {
    id: "fishermans-diary",
    slug: "the-fishermans-diary",
    title: "The Fisherman's Diary",
    releaseYear: 2020,
    country: "Cameroon",
    runtimeMinutes: 143,
    director: "Enah Johnscott",
    genres: ["Drama", "Education"],
    languages: ["Cameroonian Pidgin English"],
    synopsis:
      "A girl in a fishing village fights for the right to study, forcing her family and community to confront old taboos.",
    rating: 7.9,
    reviews: 314,
    trend: "Oscar entry",
    palette: "teal",
  },
  {
    id: "ninahs-dowry",
    slug: "ninahs-dowry",
    title: "Ninah's Dowry",
    releaseYear: 2012,
    country: "Cameroon",
    runtimeMinutes: 95,
    director: "Victor Viyuoh",
    genres: ["Drama", "Biography"],
    languages: ["Pidgin", "English", "Babanki"],
    synopsis:
      "A pregnant runaway wife tries to escape a violent marriage and the social customs that keep pulling her back.",
    rating: 8.2,
    reviews: 87,
    trend: "AMAA winner",
    palette: "rose",
  },
  {
    id: "muna-moto",
    slug: "muna-moto",
    title: "Muna Moto",
    originalTitle: "The Child of Another",
    releaseYear: 1975,
    country: "Cameroon",
    runtimeMinutes: 89,
    director: "Jean-Pierre Dikongue-Pipa",
    genres: ["Drama", "Classic"],
    languages: ["Basaa", "Duala", "French"],
    synopsis:
      "A landmark love story where dowry customs, family power, and a young couple's future collide.",
    rating: 8.5,
    reviews: 201,
    trend: "Restored classic",
    palette: "ivory",
  },
  {
    id: "beleh",
    slug: "beleh",
    title: "Beleh",
    releaseYear: 2013,
    country: "Cameroon",
    runtimeMinutes: 30,
    director: "Christa Eka",
    genres: ["Comedy", "Drama", "Short"],
    languages: ["English", "Pidgin"],
    synopsis:
      "A husband is forced into a vivid lesson about pregnancy, labor, and empathy after dismissing his wife's pain.",
    rating: 7.4,
    reviews: 42,
    trend: "Short spotlight",
    palette: "green",
  },
];

export const reviews: Review[] = [
  {
    id: "r1",
    author: "Aline N.",
    location: "Douala",
    movieTitle: "Mambar Pierrette",
    rating: 9,
    excerpt:
      "Quiet, observant, and full of small recognitions. It makes ordinary resilience feel monumental.",
  },
  {
    id: "r2",
    author: "Cedric T.",
    location: "Yaounde",
    movieTitle: "Muna Moto",
    rating: 9,
    excerpt:
      "The restored images still bite. It feels historic without ever becoming distant.",
  },
  {
    id: "r3",
    author: "Mireille F.",
    location: "Bamenda",
    movieTitle: "The Fisherman's Diary",
    rating: 8,
    excerpt:
      "The education story is direct, emotional, and easy to recommend to families.",
  },
];

export const genres = ["All", "Drama", "Classic", "Comedy", "Education", "Short"] as const;
export const languages = ["All", "Pidgin", "French", "English", "Basaa", "Duala", "Bamileke"] as const;
