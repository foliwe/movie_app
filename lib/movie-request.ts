export const movieRequestRoleOptions = ["Director", "Producer", "Owner / Rights holder", "Other"] as const;

export type MovieRequestRoleOption = (typeof movieRequestRoleOptions)[number];

export type MovieRequestInput = {
  title?: unknown;
  language?: unknown;
  producer?: unknown;
  year?: unknown;
  contactPhone?: unknown;
  contactEmail?: unknown;
  role?: unknown;
  otherRole?: unknown;
};

export type MovieRequestPayload = {
  title: string;
  language: string;
  producer: string;
  year: number;
  contactPhone: string;
  contactEmail: string;
  selectedRole: MovieRequestRoleOption;
  role: string;
};

const minYear = 1880;

function normalizeSingleLineText(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

export function normalizeMovieRequestEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function isValidMovieRequestEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function getMovieRequestMaxYear() {
  return new Date().getUTCFullYear() + 1;
}

export function validateMovieRequestInput(input: MovieRequestInput) {
  const title = normalizeSingleLineText(input.title);
  const language = normalizeSingleLineText(input.language);
  const producer = normalizeSingleLineText(input.producer);
  const yearValue = normalizeSingleLineText(input.year);
  const contactPhone = normalizeSingleLineText(input.contactPhone);
  const contactEmail = normalizeMovieRequestEmail(input.contactEmail);
  const selectedRole = normalizeSingleLineText(input.role) as MovieRequestRoleOption | "";
  const otherRole = normalizeSingleLineText(input.otherRole);

  if (!title || !language || !producer || !yearValue || !contactPhone || !contactEmail || !selectedRole) {
    return { ok: false as const, message: "Complete every required field before sending your request." };
  }

  if (!isValidMovieRequestEmail(contactEmail)) {
    return { ok: false as const, message: "Use a valid email address to continue." };
  }

  if (!movieRequestRoleOptions.includes(selectedRole as MovieRequestRoleOption)) {
    return { ok: false as const, message: "Choose your role in the movie." };
  }

  if (selectedRole === "Other" && !otherRole) {
    return { ok: false as const, message: "Describe your role in the movie." };
  }

  if (!/^\d{4}$/.test(yearValue)) {
    return { ok: false as const, message: "Use a valid 4-digit release year." };
  }

  const year = Number(yearValue);
  const maxYear = getMovieRequestMaxYear();

  if (!Number.isInteger(year) || year < minYear || year > maxYear) {
    return { ok: false as const, message: "Use a valid 4-digit release year." };
  }

  return {
    ok: true as const,
    data: {
      title,
      language,
      producer,
      year,
      contactPhone,
      contactEmail,
      selectedRole,
      role: selectedRole === "Other" ? otherRole : selectedRole,
    } satisfies MovieRequestPayload,
  };
}
