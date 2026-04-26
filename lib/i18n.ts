export type Locale = "en" | "fr";

export const defaultLocale: Locale = "en";
export const localeCookieName = "mboko-locale";
export const localeStorageKey = "mboko-locale";

export function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "fr";
}

const genreLabels = {
  en: {
    All: "All",
    Drama: "Drama",
    Biography: "Biography",
    Classic: "Classic",
    Comedy: "Comedy",
    Education: "Education",
    "Slice of life": "Slice of life",
    Short: "Short",
  },
  fr: {
    All: "Tous",
    Drama: "Drame",
    Biography: "Biographie",
    Classic: "Classique",
    Comedy: "Comedie",
    Education: "Education",
    "Slice of life": "Chronique du quotidien",
    Short: "Court",
  },
} as const;

const languageLabels = {
  en: {
    All: "All languages",
    Pidgin: "Pidgin",
    "Cameroonian Pidgin English": "Cameroonian Pidgin English",
    French: "French",
    English: "English",
    Basaa: "Basaa",
    Duala: "Duala",
    Bamileke: "Bamileke",
    Babanki: "Babanki",
  },
  fr: {
    All: "Toutes langues",
    Pidgin: "Pidgin",
    "Cameroonian Pidgin English": "Pidgin camerounais",
    French: "Francais",
    English: "Anglais",
    Basaa: "Basaa",
    Duala: "Duala",
    Bamileke: "Bamileke",
    Babanki: "Babanki",
  },
} as const;

const statusLabels = {
  en: {
    Published: "Published",
    Festival: "Festival",
    Classic: "Classic",
  },
  fr: {
    Published: "Publie",
    Festival: "Festival",
    Classic: "Classique",
  },
} as const;

const workflowStatusLabels = {
  en: {
    Draft: "Draft",
    Published: "Published",
  },
  fr: {
    Draft: "Brouillon",
    Published: "Publie",
  },
} as const;

const roleLabels = {
  en: {
    Director: "Director",
    Actor: "Actor",
    Producer: "Producer",
    "Creative advisor": "Creative advisor",
  },
  fr: {
    Director: "Realisateur",
    Actor: "Acteur",
    Producer: "Producteur",
    "Creative advisor": "Conseiller creatif",
  },
} as const;

export function getGenreLabel(locale: Locale, genre: string) {
  return genreLabels[locale][genre as keyof (typeof genreLabels)[Locale]] ?? genre;
}

export function getLanguageLabel(locale: Locale, language: string) {
  return languageLabels[locale][language as keyof (typeof languageLabels)[Locale]] ?? language;
}

export function getStatusLabel(locale: Locale, status: string) {
  return statusLabels[locale][status as keyof (typeof statusLabels)[Locale]] ?? status;
}

export function getWorkflowStatusLabel(locale: Locale, status: string) {
  return workflowStatusLabels[locale][status as keyof (typeof workflowStatusLabels)[Locale]] ?? status;
}

export function getRoleLabel(locale: Locale, role: string) {
  return roleLabels[locale][role as keyof (typeof roleLabels)[Locale]] ?? role;
}

export function formatLanguageList(locale: Locale, values: string[]) {
  return values.map((value) => getLanguageLabel(locale, value)).join(", ");
}

export function formatPublishedDate(locale: Locale, value: string) {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const parsedDate = dateOnlyMatch
    ? new Date(Date.UTC(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]), 12))
    : new Date(value);

  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "medium",
    timeZone: dateOnlyMatch ? "UTC" : undefined,
  }).format(parsedDate);
}
