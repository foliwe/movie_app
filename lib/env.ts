const defaultDatabaseUrl = "postgresql://movieapp:movieapp@localhost:5432/movieapp";
const defaultAppUrl = "http://127.0.0.1:3000";
const defaultSmtpHost = "127.0.0.1";
const defaultSmtpPort = 1025;
const defaultSmtpFrom = "Mboko Reels <noreply@mbokoreels.local>";

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

function readEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readEnvOrDefault(name: string, fallback: string) {
  const value = readEnv(name);

  if (value) {
    return value;
  }

  if (isProductionRuntime()) {
    throw new Error(`Missing required environment variable ${name}.`);
  }

  return fallback;
}

function validateUrl(name: string, value: string) {
  try {
    return new URL(value).toString().replace(/\/+$/, "");
  } catch {
    throw new Error(`Environment variable ${name} must be a valid URL.`);
  }
}

function validatePort(name: string, value: string) {
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Environment variable ${name} must be a valid TCP port.`);
  }

  return port;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function getDatabaseUrl() {
  return readEnvOrDefault("DATABASE_URL", defaultDatabaseUrl);
}

export function getAppUrl() {
  return validateUrl("APP_URL", readEnvOrDefault("APP_URL", defaultAppUrl));
}

export function getSmtpConfig() {
  const host = readEnvOrDefault("SMTP_HOST", defaultSmtpHost);
  const port = validatePort("SMTP_PORT", readEnvOrDefault("SMTP_PORT", String(defaultSmtpPort)));
  const from = readEnvOrDefault("SMTP_FROM", defaultSmtpFrom);

  return {
    host,
    port,
    from,
  };
}

export function getMovieRequestAdminEmail() {
  const adminEmail = readEnv("MOVIE_REQUEST_ADMIN_EMAIL");

  if (!adminEmail) {
    if (isProductionRuntime()) {
      throw new Error("Missing required environment variable MOVIE_REQUEST_ADMIN_EMAIL.");
    }

    return "";
  }

  if (!isValidEmail(adminEmail)) {
    throw new Error("Environment variable MOVIE_REQUEST_ADMIN_EMAIL must be a valid email address.");
  }

  return adminEmail;
}

export function validateRuntimeEnv() {
  getDatabaseUrl();
  getAppUrl();
  getSmtpConfig();
  getMovieRequestAdminEmail();
}
