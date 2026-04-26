export type Movie = {
  id: string;
  slug: string;
  title: string;
  originalTitle?: string;
  releaseYear: number;
  releaseDate?: string;
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
  workflowStatus: "Draft" | "Published";
  status: "Published" | "Festival" | "Classic";
  posterUrl: string;
  backdropUrl: string;
  trailerUrl: string;
  cast: CastCredit[];
  crew: CrewCredit[];
};

export type Review = {
  id: string;
  slug: string;
  author: string;
  username: string;
  location: string;
  movieSlug: string;
  movieTitle: string;
  rating: number;
  title: string;
  excerpt: string;
  body: string;
  publishedAt: string;
};

export type Person = {
  id: string;
  slug: string;
  name: string;
  role: string;
  location: string;
  bio: string;
  knownFor: string[];
  palette: Movie["palette"];
};

export type CastCredit = {
  personSlug: string;
  name: string;
  character: string;
};

export type CrewCredit = {
  personSlug: string;
  name: string;
  job: string;
};

export type UserProfile = {
  username: string;
  displayName: string;
  location: string;
  bio: string;
  favoriteLanguages: string[];
  watched: number;
  reviews: number;
  averageRating: number;
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
    workflowStatus: "Published",
    status: "Festival",
    posterUrl: "/assets/homepage-concept.png",
    backdropUrl: "/assets/cameroon-cinema-backdrop.png",
    trailerUrl: "https://example.com/trailers/mambar-pierrette",
    cast: [
      { personSlug: "pierrette-alene", name: "Pierrette Alene", character: "Pierrette" },
      { personSlug: "rosine-mbakam", name: "Rosine Mbakam", character: "Observer" },
    ],
    crew: [
      { personSlug: "rosine-mbakam", name: "Rosine Mbakam", job: "Director" },
      { personSlug: "geoffrey-enthoven", name: "Geoffrey Enthoven", job: "Producer" },
    ],
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
    workflowStatus: "Published",
    status: "Published",
    posterUrl: "/assets/homepage-concept.png",
    backdropUrl: "/assets/cameroon-cinema-backdrop.png",
    trailerUrl: "https://example.com/trailers/the-fishermans-diary",
    cast: [
      { personSlug: "faith-fidel", name: "Faith Fidel", character: "Ekah" },
      { personSlug: "ramsey-nouah", name: "Ramsey Nouah", character: "Solomon" },
    ],
    crew: [
      { personSlug: "enah-johnscott", name: "Enah Johnscott", job: "Director" },
      { personSlug: "kang-quintus", name: "Kang Quintus", job: "Producer" },
    ],
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
    workflowStatus: "Published",
    status: "Published",
    posterUrl: "/assets/homepage-concept.png",
    backdropUrl: "/assets/cameroon-cinema-backdrop.png",
    trailerUrl: "https://example.com/trailers/ninahs-dowry",
    cast: [
      { personSlug: "mbufung-seikeh", name: "Mbufung Seikeh", character: "Ninah" },
      { personSlug: "nkem-owo", name: "Nkem Owoh", character: "Village elder" },
    ],
    crew: [
      { personSlug: "victor-viyuoh", name: "Victor Viyuoh", job: "Director" },
      { personSlug: "annie-valerie", name: "Annie Valérie", job: "Producer" },
    ],
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
    workflowStatus: "Published",
    status: "Classic",
    posterUrl: "/assets/homepage-concept.png",
    backdropUrl: "/assets/cameroon-cinema-backdrop.png",
    trailerUrl: "https://example.com/trailers/muna-moto",
    cast: [
      { personSlug: "david-enda", name: "David Enda", character: "Ngando" },
      { personSlug: "arlette-din-beli", name: "Arlette Din Beli", character: "Ndomé" },
    ],
    crew: [
      { personSlug: "jean-pierre-dikongue-pipa", name: "Jean-Pierre Dikongue-Pipa", job: "Director" },
      { personSlug: "daniel-kamwa", name: "Daniel Kamwa", job: "Creative advisor" },
    ],
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
    workflowStatus: "Draft",
    status: "Published",
    posterUrl: "/assets/homepage-concept.png",
    backdropUrl: "/assets/cameroon-cinema-backdrop.png",
    trailerUrl: "https://example.com/trailers/beleh",
    cast: [
      { personSlug: "sybille-yembe", name: "Sybille Yembe", character: "Pregnant wife" },
      { personSlug: "epule-jeffrey", name: "Epule Jeffrey", character: "Husband" },
    ],
    crew: [
      { personSlug: "christa-eka", name: "Christa Eka", job: "Director" },
      { personSlug: "agbor-gilbert", name: "Agbor Gilbert", job: "Producer" },
    ],
  },
];

export const reviews: Review[] = [
  {
    id: "r1",
    slug: "ordinary-resilience",
    author: "Aline N.",
    username: "aline-n",
    location: "Douala",
    movieSlug: "mambar-pierrette",
    movieTitle: "Mambar Pierrette",
    rating: 9,
    title: "Ordinary resilience, filmed with patience",
    excerpt:
      "Quiet, observant, and full of small recognitions. It makes ordinary resilience feel monumental.",
    body:
      "The camera lets Pierrette work, worry, laugh, and negotiate without forcing a lecture onto her life. What stays with me is the way the film trusts tiny gestures: a fabric measurement, a pause before answering, a joke used as self-defense.",
    publishedAt: "2026-03-18",
  },
  {
    id: "r2",
    slug: "restored-images-still-bite",
    author: "Cedric T.",
    username: "cedric-t",
    location: "Yaounde",
    movieSlug: "muna-moto",
    movieTitle: "Muna Moto",
    rating: 9,
    title: "The restored images still bite",
    excerpt:
      "The restored images still bite. It feels historic without ever becoming distant.",
    body:
      "Muna Moto carries the force of a landmark and the intimacy of a village argument overheard from the next courtyard. Its critique of dowry customs is direct, but the performances keep it warm-blooded and human.",
    publishedAt: "2026-02-26",
  },
  {
    id: "r3",
    slug: "family-night-recommendation",
    author: "Mireille F.",
    username: "mireille-f",
    location: "Bamenda",
    movieSlug: "the-fishermans-diary",
    movieTitle: "The Fisherman's Diary",
    rating: 8,
    title: "A direct family-night recommendation",
    excerpt:
      "The education story is direct, emotional, and easy to recommend to families.",
    body:
      "The film reaches for broad emotion, and most of the time that clarity works in its favor. Faith Fidel gives the story its center of gravity, especially when the village expectations close around Ekah.",
    publishedAt: "2026-01-14",
  },
];

export const people: Person[] = [
  {
    id: "rosine-mbakam",
    slug: "rosine-mbakam",
    name: "Rosine Mbakam",
    role: "Director",
    location: "Yaounde / Brussels",
    bio: "A filmmaker whose work observes domestic labor, migration, memory, and women carrying entire worlds in ordinary rooms.",
    knownFor: ["Mambar Pierrette", "Chez Jolie Coiffure"],
    palette: "amber",
  },
  {
    id: "enah-johnscott",
    slug: "enah-johnscott",
    name: "Enah Johnscott",
    role: "Director",
    location: "Buea",
    bio: "A commercial and feature director known for accessible social dramas with a strong audience pulse.",
    knownFor: ["The Fisherman's Diary", "Half Heaven"],
    palette: "teal",
  },
  {
    id: "victor-viyuoh",
    slug: "victor-viyuoh",
    name: "Victor Viyuoh",
    role: "Director",
    location: "Cameroon / United States",
    bio: "A filmmaker drawn to intimate stories where family power and social pressure shape private decisions.",
    knownFor: ["Ninah's Dowry"],
    palette: "rose",
  },
  {
    id: "jean-pierre-dikongue-pipa",
    slug: "jean-pierre-dikongue-pipa",
    name: "Jean-Pierre Dikongue-Pipa",
    role: "Director",
    location: "Douala",
    bio: "A foundational voice in Cameroonian cinema, best known for landmark dramas about custom, love, and power.",
    knownFor: ["Muna Moto"],
    palette: "ivory",
  },
  {
    id: "christa-eka",
    slug: "christa-eka",
    name: "Christa Eka",
    role: "Director",
    location: "Douala",
    bio: "A director of sharp short-form stories that use humor and pressure to reveal everyday gender dynamics.",
    knownFor: ["Beleh"],
    palette: "green",
  },
  {
    id: "faith-fidel",
    slug: "faith-fidel",
    name: "Faith Fidel",
    role: "Actor",
    location: "Cameroon",
    bio: "A performer whose breakout role brought urgency and tenderness to a national education story.",
    knownFor: ["The Fisherman's Diary"],
    palette: "teal",
  },
  {
    id: "pierrette-alene",
    slug: "pierrette-alene",
    name: "Pierrette Alene",
    role: "Actor",
    location: "Douala",
    bio: "A screen presence whose grounded performance anchors a portrait of work, patience, and everyday survival.",
    knownFor: ["Mambar Pierrette"],
    palette: "amber",
  },
  {
    id: "geoffrey-enthoven",
    slug: "geoffrey-enthoven",
    name: "Geoffrey Enthoven",
    role: "Producer",
    location: "Belgium",
    bio: "A producer attached to internationally traveling stories with a close eye on human-scale drama.",
    knownFor: ["Mambar Pierrette"],
    palette: "amber",
  },
  {
    id: "ramsey-nouah",
    slug: "ramsey-nouah",
    name: "Ramsey Nouah",
    role: "Actor",
    location: "Nigeria",
    bio: "A veteran actor whose star power often sharpens socially driven melodrama and family conflict.",
    knownFor: ["The Fisherman's Diary"],
    palette: "teal",
  },
  {
    id: "kang-quintus",
    slug: "kang-quintus",
    name: "Kang Quintus",
    role: "Producer",
    location: "Cameroon",
    bio: "A producer focused on audience-facing Cameroon stories that can move between local rooms and festival circuits.",
    knownFor: ["The Fisherman's Diary"],
    palette: "teal",
  },
  {
    id: "mbufung-seikeh",
    slug: "mbufung-seikeh",
    name: "Mbufung Seikeh",
    role: "Actor",
    location: "Cameroon",
    bio: "An actor recognized for emotionally direct performances in stories shaped by pressure, custom, and survival.",
    knownFor: ["Ninah's Dowry"],
    palette: "rose",
  },
  {
    id: "nkem-owo",
    slug: "nkem-owo",
    name: "Nkem Owoh",
    role: "Actor",
    location: "Nigeria",
    bio: "A prolific actor who brings comic timing and weighty authority to village and family dramas alike.",
    knownFor: ["Ninah's Dowry"],
    palette: "rose",
  },
  {
    id: "annie-valerie",
    slug: "annie-valerie",
    name: "Annie Valerie",
    role: "Producer",
    location: "Cameroon",
    bio: "A producer associated with intimate independent work that examines gender, memory, and social expectation.",
    knownFor: ["Ninah's Dowry"],
    palette: "rose",
  },
  {
    id: "david-enda",
    slug: "david-enda",
    name: "David Enda",
    role: "Actor",
    location: "Cameroon",
    bio: "A performer remembered for helping define one of the essential faces of early Cameroon cinema.",
    knownFor: ["Muna Moto"],
    palette: "ivory",
  },
  {
    id: "arlette-din-beli",
    slug: "arlette-din-beli",
    name: "Arlette Din Beli",
    role: "Actor",
    location: "Cameroon",
    bio: "An actor whose work remains closely tied to landmark stories about love, custom, and social pressure.",
    knownFor: ["Muna Moto"],
    palette: "ivory",
  },
  {
    id: "daniel-kamwa",
    slug: "daniel-kamwa",
    name: "Daniel Kamwa",
    role: "Creative advisor",
    location: "Cameroon",
    bio: "A foundational filmmaker and collaborator whose perspective helped shape major early screen works.",
    knownFor: ["Muna Moto", "Pousse-Pousse"],
    palette: "ivory",
  },
  {
    id: "sybille-yembe",
    slug: "sybille-yembe",
    name: "Sybille Yembe",
    role: "Actor",
    location: "Cameroon",
    bio: "A performer who brings urgency and comic bite to short-form stories built around domestic tension.",
    knownFor: ["Beleh"],
    palette: "green",
  },
  {
    id: "epule-jeffrey",
    slug: "epule-jeffrey",
    name: "Epule Jeffrey",
    role: "Actor",
    location: "Cameroon",
    bio: "An actor whose roles often lean on expressive reactions, bravado, and sharply observed everyday dynamics.",
    knownFor: ["Beleh"],
    palette: "green",
  },
  {
    id: "agbor-gilbert",
    slug: "agbor-gilbert",
    name: "Agbor Gilbert",
    role: "Producer",
    location: "Cameroon",
    bio: "A producer connected to short-form projects that blend humor with close observation of gendered experience.",
    knownFor: ["Beleh"],
    palette: "green",
  },
];

export const userProfiles: UserProfile[] = [
  {
    username: "aline-n",
    displayName: "Aline N.",
    location: "Douala",
    bio: "Festival-line regular, generous scorer, impatient with lazy endings.",
    favoriteLanguages: ["French", "Pidgin", "Duala"],
    watched: 146,
    reviews: 42,
    averageRating: 7.8,
  },
  {
    username: "cedric-t",
    displayName: "Cedric T.",
    location: "Yaounde",
    bio: "Restoration obsessive and classic-cinema defender.",
    favoriteLanguages: ["Basaa", "French"],
    watched: 212,
    reviews: 58,
    averageRating: 8.1,
  },
  {
    username: "mireille-f",
    displayName: "Mireille F.",
    location: "Bamenda",
    bio: "Looks for films that can travel from family rooms to debate clubs.",
    favoriteLanguages: ["English", "Pidgin"],
    watched: 98,
    reviews: 27,
    averageRating: 7.5,
  },
];

export const genres = ["All", "Drama", "Biography", "Classic", "Comedy", "Education", "Slice of life", "Short"] as const;
export const languages = [
  "All",
  "Pidgin",
  "Cameroonian Pidgin English",
  "French",
  "English",
  "Basaa",
  "Duala",
  "Bamileke",
  "Babanki",
] as const;

export function getMovieBySlug(slug: string) {
  return movies.find((movie) => movie.slug === slug);
}

export function getPersonBySlug(slug: string) {
  return people.find((person) => person.slug === slug);
}

export function getReviewBySlug(slug: string) {
  return reviews.find((review) => review.slug === slug || review.id === slug);
}

export function getProfileByUsername(username: string) {
  return userProfiles.find((profile) => profile.username === username);
}
