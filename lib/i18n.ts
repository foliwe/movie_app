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
    Classic: "Classic",
    Comedy: "Comedy",
    Education: "Education",
    Short: "Short",
  },
  fr: {
    All: "Tous",
    Drama: "Drame",
    Classic: "Classique",
    Comedy: "Comedie",
    Education: "Education",
    Short: "Court",
  },
} as const;

const languageLabels = {
  en: {
    All: "All languages",
    Pidgin: "Pidgin",
    French: "French",
    English: "English",
    Basaa: "Basaa",
    Duala: "Duala",
    Bamileke: "Bamileke",
  },
  fr: {
    All: "Toutes langues",
    Pidgin: "Pidgin",
    French: "Francais",
    English: "Anglais",
    Basaa: "Basaa",
    Duala: "Duala",
    Bamileke: "Bamileke",
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

export function getGenreLabel(locale: Locale, genre: string) {
  return genreLabels[locale][genre as keyof (typeof genreLabels)[Locale]] ?? genre;
}

export function getLanguageLabel(locale: Locale, language: string) {
  return languageLabels[locale][language as keyof (typeof languageLabels)[Locale]] ?? language;
}

export function getStatusLabel(locale: Locale, status: string) {
  return statusLabels[locale][status as keyof (typeof statusLabels)[Locale]] ?? status;
}

export function formatPublishedDate(locale: Locale, value: string) {
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-FR" : "en-US", {
    dateStyle: "medium",
  }).format(new Date(value));
}
