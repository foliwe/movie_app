import { createHash, randomBytes } from "crypto";
import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL ?? "postgresql://movieapp:movieapp@localhost:5432/movieapp";
const mailpitBaseUrl = process.env.MAILPIT_BASE_URL ?? "http://127.0.0.1:8025";

type MailpitSearchResponse = {
  messages: Array<{
    ID: string;
  }>;
};

type MailpitMessage = {
  ID: string;
  Text: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getMailpitMessageById(id: string) {
  const response = await fetch(`${mailpitBaseUrl}/api/v1/message/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`Failed to load Mailpit message ${id}: ${response.status}`);
  }

  return (await response.json()) as MailpitMessage;
}

async function waitForLatestMailpitMessage(recipient: string, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const query = encodeURIComponent(`to:${recipient}`);
    const response = await fetch(`${mailpitBaseUrl}/api/v1/search?query=${query}&limit=1`);

    if (response.ok) {
      const payload = (await response.json()) as MailpitSearchResponse;
      const latestId = payload.messages[0]?.ID;

      if (latestId) {
        return getMailpitMessageById(latestId);
      }
    }

    await sleep(250);
  }

  throw new Error(`Timed out waiting for a Mailpit message for ${recipient}.`);
}

function extractResetLink(messageText: string) {
  const match = messageText.match(/https?:\/\/[^\s]+\/reset-password\/[^\s]+/);

  if (!match) {
    throw new Error("Reset link not found in Mailpit message.");
  }

  return match[0];
}

function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("base64url");
}

async function createPasswordResetTokenForTest(
  email: string,
  options?: { expiresAt?: Date; usedAt?: Date | null },
) {
  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  try {
    const userResult = await client.query<{ id: string }>('select id from "User" where email = $1 limit 1', [email]);
    const userId = userResult.rows[0]?.id;

    if (!userId) {
      return null;
    }

    const token = randomBytes(32).toString("base64url");
    const expiresAt = options?.expiresAt ?? new Date(Date.now() + 30 * 60 * 1000);
    const usedAt = options?.usedAt ?? null;

    await client.query('delete from "PasswordResetToken" where "userId" = $1', [userId]);
    await client.query(
      'insert into "PasswordResetToken" (id, "userId", "tokenHash", "expiresAt", "usedAt") values ($1, $2, $3, $4, $5)',
      [randomBytes(16).toString("hex"), userId, hashPasswordResetToken(token), expiresAt, usedAt],
    );

    return { token, userId };
  } finally {
    await client.end();
  }
}

async function signInAdmin(page: Page) {
  await page.goto("/login?next=/admin/movies");
  await page.getByPlaceholder("you@example.com").fill("admin@example.com");
  await page.getByPlaceholder("At least 8 characters").fill("admin1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/movies$/);
  await expect(page.getByRole("heading", { name: "Create, stage, and publish catalogue entries" })).toBeVisible();
}

test.describe("movie app smoke suite", () => {
  test.describe.configure({ mode: "serial" });

  test("core routes render a main heading", async ({ page }) => {
    const routes = [
      "/",
      "/movies",
      "/movies/the-fishermans-diary",
      "/reviews",
      "/search",
      "/login",
      "/register",
      "/forgot-password",
    ];

    for (const route of routes) {
      await page.goto(route);
      await expect(page.locator("main")).toBeVisible();
      await expect(page.locator("h1")).toBeVisible();
    }
  });

  test("search supports locale switching and filters", async ({ page }) => {
    await page.goto("/search");

    await page.getByTestId("locale-toggle").getByRole("button", { name: "FR" }).click();
    await expect(page.getByRole("heading", { name: "Trouver films, voix et critiques" })).toBeVisible();

    const queryInput = page.getByPlaceholder("Essayez Pidgin, Douala, Mambar ou education");
    await queryInput.fill("education");
    await expect(page.getByRole("heading", { name: "1 films" })).toBeVisible();
    await expect(page.locator('a[href="/movies/the-fishermans-diary"]')).toBeVisible();

    await queryInput.fill("");
    await page.getByTestId("search-filter-language").getByRole("button", { name: "Duala", exact: true }).click();
    await expect(page.getByRole("heading", { name: "1 films" })).toBeVisible();
    await expect(page.locator('a[href="/movies/muna-moto"]')).toBeVisible();
    await expect(page.locator('a[href="/movies/the-fishermans-diary"]')).toHaveCount(0);

    await page.getByTestId("search-filter-language").getByRole("button", { name: "Toutes langues", exact: true }).click();
    await page.getByTestId("search-filter-year").getByRole("button", { name: "2020", exact: true }).click();
    await expect(page.getByRole("heading", { name: "1 films" })).toBeVisible();
    await expect(page.locator('a[href="/movies/the-fishermans-diary"]')).toBeVisible();
  });

  test("auth forms validate, register, and sign in with a real session", async ({ page }) => {
    const email = `smoke-${Date.now()}@example.com`;

    await page.goto("/login");

    await page.getByPlaceholder("you@example.com").fill("invalid-email");
    await page.getByPlaceholder("At least 8 characters").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Use a valid email and password to continue.")).toBeVisible();

    await page.goto("/register");
    await page.getByPlaceholder("Aline N.").fill("Smoke Critic");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("At least 8 characters").fill("password123");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Account session is active.")).toBeVisible();

    await page.request.post("/api/auth/logout");
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("At least 8 characters").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Account session is active.")).toBeVisible();
  });

  test("forgot-password records the request and validates input", async ({ page }) => {
    const email = `reset-link-${Date.now()}@example.com`;

    await page.goto("/register");
    await page.getByPlaceholder("Aline N.").fill("Reset Link Smoke");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("At least 8 characters").fill("password123");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Account session is active.")).toBeVisible();

    await page.goto("/forgot-password");
    await page.getByPlaceholder("you@example.com").fill("invalid-email");
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("Use a valid email address to continue.")).toBeVisible();

    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("If that account exists, we recorded the reset request.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open reset link" })).toHaveCount(0);
  });

  test("forgot-password sends a reset email through Mailpit", async ({ page }) => {
    const email = `mailpit-reset-${Date.now()}@example.com`;
    const oldPassword = "password123";
    const newPassword = "newpassword123";

    await page.goto("/register");
    await page.getByPlaceholder("Aline N.").fill("Mailpit Reset Smoke");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("At least 8 characters").fill(oldPassword);
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Account session is active.")).toBeVisible();

    await page.request.post("/api/auth/logout");
    await page.goto("/forgot-password");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByText("If that account exists, we recorded the reset request.")).toBeVisible();

    const resetMessage = await waitForLatestMailpitMessage(email);
    expect(resetMessage.Text).toContain("This reset link expires in 30 minutes.");

    const resetLink = extractResetLink(resetMessage.Text);
    await page.goto(resetLink);
    await page.getByPlaceholder("At least 8 characters").fill(newPassword);
    await page.getByPlaceholder("Repeat your new password").fill(newPassword);
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByText("Password updated. Sign in with your new password.")).toBeVisible();

    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("At least 8 characters").fill(oldPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Email or password is incorrect.")).toBeVisible();

    await page.getByPlaceholder("At least 8 characters").fill(newPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Account session is active.")).toBeVisible();
  });

  test("password reset handles invalid, expired, reused tokens and invalidates prior sessions", async ({ page }) => {
    const email = `reset-flow-${Date.now()}@example.com`;
    const oldPassword = "password123";
    const racedPassword = "racedpassword123";
    const newPassword = "newpassword123";

    await page.goto("/register");
    await page.getByPlaceholder("Aline N.").fill("Reset Flow Smoke");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("At least 8 characters").fill(oldPassword);
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Account session is active.")).toBeVisible();

    const invalidReset = await page.request.post("/api/auth/reset-password", {
      data: {
        token: "not-a-real-token",
        password: newPassword,
      },
    });
    expect(invalidReset.status()).toBe(400);
    expect(await invalidReset.json()).toMatchObject({
      message: "This reset link is invalid or has expired.",
    });

    const expiredReset = await createPasswordResetTokenForTest(email, {
      expiresAt: new Date(Date.now() - 60_000),
      usedAt: new Date(Date.now() - 30_000),
    });
    expect(expiredReset?.token).toBeTruthy();

    await page.goto(`/reset-password/${expiredReset?.token}`);
    await page.getByPlaceholder("At least 8 characters").fill(newPassword);
    await page.getByPlaceholder("Repeat your new password").fill(newPassword);
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByText("This reset link is invalid or has expired.")).toBeVisible();

    const concurrentReset = await createPasswordResetTokenForTest(email);
    expect(concurrentReset?.token).toBeTruthy();
    const concurrentResults = await Promise.all([
      page.request.post("/api/auth/reset-password", {
        data: {
          token: concurrentReset?.token,
          password: racedPassword,
        },
      }),
      page.request.post("/api/auth/reset-password", {
        data: {
          token: concurrentReset?.token,
          password: racedPassword,
        },
      }),
    ]);
    const concurrentStatuses = concurrentResults
      .map((response) => response.status())
      .sort((left, right) => left - right);
    expect(concurrentStatuses).toEqual([200, 400]);

    const activeReset = await createPasswordResetTokenForTest(email);
    expect(activeReset?.token).toBeTruthy();
    const activeToken = activeReset?.token ?? "";

    await page.goto(`/reset-password/${activeToken}`);
    await page.getByPlaceholder("At least 8 characters").fill(newPassword);
    await page.getByPlaceholder("Repeat your new password").fill(newPassword);
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByText("Password updated. Sign in with your new password.")).toBeVisible();

    await page.goto("/account/profile");
    await expect(page).toHaveURL(/\/login\?next=\/account\/profile/);

    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("At least 8 characters").fill(oldPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Email or password is incorrect.")).toBeVisible();

    await page.getByPlaceholder("At least 8 characters").fill(newPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Account session is active.")).toBeVisible();

    const reusedReset = await page.request.post("/api/auth/reset-password", {
      data: {
        token: activeToken,
        password: "anotherpass123",
      },
    });
    expect(reusedReset.status()).toBe(400);
    expect(await reusedReset.json()).toMatchObject({
      message: "This reset link is invalid or has expired.",
    });
  });

  test("write review restores local drafts and publishes to the database", async ({ page }) => {
    const email = `reviewer-${Date.now()}@example.com`;
    const reviewTitle = `Measured, intimate, unforgettable ${Date.now()}`;

    await page.goto("/register");
    await page.getByPlaceholder("Aline N.").fill("Review Smoke");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("At least 8 characters").fill("password123");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Account session is active.")).toBeVisible();

    await page.goto("/write-review/mambar-pierrette");

    await page.getByLabel("Review title", { exact: true }).fill(reviewTitle);
    await page
      .getByLabel("Your review", { exact: true })
      .fill("A beautifully observed portrait that keeps revealing character through routine, labour, and pressure.");
    await page.getByLabel("Contains spoilers", { exact: true }).check();
    await page.getByRole("button", { name: "Save draft locally" }).click();

    await expect(page.getByText("Draft saved locally on this device.")).toBeVisible();
    await expect(page.getByTestId("review-preview-card")).toContainText("Spoilers flagged");

    await page.reload();
    await expect(page.getByText("Saved draft restored for this title.")).toBeVisible();
    await expect(page.getByLabel("Review title", { exact: true })).toHaveValue(reviewTitle);
    await expect(page.getByLabel("Contains spoilers", { exact: true })).toBeChecked();

    await page.getByRole("button", { name: "Publish review" }).click();
    await expect(page.getByText("Review published to the community feed.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open published review" })).toBeVisible();
    await expect(page.getByLabel("Review title", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("Contains spoilers", { exact: true })).not.toBeChecked();

    await page.goto("/account/reviews");
    await expect(page.getByRole("heading", { name: "All authored reviews" })).toBeVisible();
    await expect(page.getByRole("link", { name: reviewTitle })).toBeVisible();

    await page.getByRole("link", { name: reviewTitle }).click();
    await expect(page.getByRole("heading", { name: "Manage your review" })).toBeVisible();
    await page.getByLabel("Review title", { exact: true }).fill(`${reviewTitle} edited`);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Review updated.")).toBeVisible();

    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete review" }).click();
    await expect(page).toHaveURL(/\/profile\/review-smoke/);
  });

  test("account routes require sign-in and signed-in settings update profile and password", async ({ page }) => {
    for (const route of ["/account/profile", "/account/security", "/account/reviews"] as const) {
      await page.goto(route);
      await expect(page).toHaveURL(`http://127.0.0.1:3000/login?next=${route}`);
    }

    const email = `account-${Date.now()}@example.com`;
    const oldPassword = "password123";
    const newPassword = "newpassword123";

    await page.goto("/register");
    await page.getByPlaceholder("Aline N.").fill("Account Owner");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("At least 8 characters").fill(oldPassword);
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Account session is active.")).toBeVisible();

    await page.goto("/account/profile");
    await expect(page.getByRole("heading", { name: "Edit your public profile" })).toBeVisible();
    await page.getByLabel("Display name", { exact: true }).fill("Account Editor");
    await page.getByLabel("Location", { exact: true }).fill("Yaounde");
    await page
      .getByRole("textbox", { name: "Bio" })
      .fill("Keeps notes on films that thrive in family rooms, classrooms, and long post-screening debates.");
    await page.getByRole("checkbox", { name: "French", exact: true }).check();
    await page.getByRole("checkbox", { name: "Pidgin", exact: true }).check();
    await page.getByRole("button", { name: "Save profile" }).click();
    await expect(page.getByText("Account profile updated.")).toBeVisible();

    await page.getByRole("link", { name: "View public profile" }).click();
    await expect(page.getByRole("heading", { name: "Account Editor" })).toBeVisible();
    await expect(page.getByText("Keeps notes on films that thrive in family rooms, classrooms, and long post-screening debates.")).toBeVisible();
    await expect(page.getByText("French, Pidgin")).toBeVisible();

    await page.goto("/account/security");
    await expect(page.getByRole("heading", { name: "Protect your sign-in" })).toBeVisible();

    await page.getByLabel("Current password", { exact: true }).fill("wrongpassword");
    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirm new password", { exact: true }).fill(newPassword);
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Current password is incorrect.")).toBeVisible();

    await page.getByLabel("Current password", { exact: true }).fill(oldPassword);
    await page.getByLabel("New password", { exact: true }).fill("short");
    await page.getByLabel("Confirm new password", { exact: true }).fill("short");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Use a password with at least 8 characters.")).toBeVisible();

    await page.getByLabel("Current password", { exact: true }).fill(oldPassword);
    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirm new password", { exact: true }).fill("differentpass123");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Use the same password in both fields.")).toBeVisible();

    await page.getByLabel("Current password", { exact: true }).fill(oldPassword);
    await page.getByLabel("New password", { exact: true }).fill(newPassword);
    await page.getByLabel("Confirm new password", { exact: true }).fill(newPassword);
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Password updated.")).toBeVisible();

    await page.goto("/account/reviews");
    await expect(page.getByRole("heading", { name: "All authored reviews" })).toBeVisible();

    await page.request.post("/api/auth/logout");
    await page.goto("/login");
    await page.getByPlaceholder("you@example.com").fill(email);
    await page.getByPlaceholder("At least 8 characters").fill(oldPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Email or password is incorrect.")).toBeVisible();

    await page.getByPlaceholder("At least 8 characters").fill(newPassword);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Account session is active.")).toBeVisible();
  });

  test("admin movie desk previews and publishes a new draft", async ({ page }) => {
    await signInAdmin(page);

    await page.getByRole("button", { name: "New draft" }).click();
    await expect(page.getByText("Draft created in the database.")).toBeVisible();
    await page.getByLabel("Title", { exact: true }).fill("River Spirits");
    await page.getByLabel("Director", { exact: true }).fill("Muna Esiene");
    await page
      .getByLabel("Synopsis", { exact: true })
      .fill("A river guide returns home and finds the town negotiating memory, grief, and a new generation of filmmakers.");
    await page
      .locator(".admin-tag-grid .admin-field")
      .filter({ hasText: "Languages covered" })
      .locator("button")
      .filter({ hasText: /^English$/ })
      .click();
    await page
      .locator(".admin-tag-grid .admin-field")
      .filter({ hasText: "Genres" })
      .locator("button")
      .filter({ hasText: /^Drama$/ })
      .click();
    await page.getByLabel("Trailer URL", { exact: true }).fill("https://example.com/trailers/river-spirits");
    await page.getByRole("button", { name: "Publish record" }).click();

    await expect(page.getByText("Record published to the database.")).toBeVisible();
    await expect(page.getByTestId("admin-preview-card")).toContainText("River Spirits");
    await expect(page.getByTestId("admin-preview-card")).toContainText("Trailer ready");
    await expect(page.locator('a[href^="/movies/river-spirits"]')).toBeVisible();
    await expect(page.locator('a[href^="/write-review/river-spirits"]')).toBeVisible();

    await page.getByRole("button", { name: /Mambar Pierrette/ }).click();
    await expect(page.locator('a[href="/movies/mambar-pierrette"]')).toBeVisible();
    await expect(page.locator('a[href="/write-review/mambar-pierrette"]')).toBeVisible();
  });

  test("admin saves duplicate custom people in one movie payload without conflicts", async ({ page }) => {
    await signInAdmin(page);

    const createResponse = await page.request.post("/api/admin/movies");
    expect(createResponse.status()).toBe(201);
    const movie = (await createResponse.json()) as {
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
      trailerEmbedUrl?: string;
      cast: Array<{ personSlug: string; name: string; character: string }>;
      crew: Array<{ personSlug: string; name: string; job: string }>;
    };

    const duplicateName = `Ada Nfor ${Date.now()}`;
    const saveResponse = await page.request.patch(`/api/admin/movies/${movie.id}`, {
      data: {
        mode: "draft",
        movie: {
          ...movie,
          title: `Duplicate person smoke ${Date.now()}`,
          slug: `duplicate-person-smoke-${Date.now()}`,
          releaseYear: 2024,
          country: "Cameroon",
          runtimeMinutes: 102,
          director: "Smoke Director",
          genres: ["Drama"],
          languages: ["English"],
          synopsis:
            "A focused smoke test payload that intentionally repeats the same custom contributor name across cast and crew credits.",
          trend: "Admin duplicate person test",
          cast: [
            { personSlug: "", name: duplicateName, character: "Lead" },
            { personSlug: "", name: duplicateName, character: "Narrator" },
          ],
          crew: [
            { personSlug: "", name: duplicateName, job: "Director" },
            { personSlug: "", name: duplicateName, job: "Writer" },
          ],
        },
      },
    });

    expect(saveResponse.status()).toBe(200);
    const savedMovie = (await saveResponse.json()) as {
      cast: Array<{ personSlug: string }>;
      crew: Array<{ personSlug: string }>;
    };

    const personSlugs = new Set([
      ...savedMovie.cast.map((credit) => credit.personSlug),
      ...savedMovie.crew.map((credit) => credit.personSlug),
    ]);

    expect(savedMovie.cast).toHaveLength(2);
    expect(savedMovie.crew).toHaveLength(2);
    expect(personSlugs.size).toBe(1);
  });

  test("review surfaces keep film language context visible", async ({ page }) => {
    await page.goto("/reviews");

    await expect(page.getByText("Mambar Pierrette / French, Pidgin").first()).toBeVisible();
    await expect(page.locator('a[href="/write-review/mambar-pierrette"]').getByText("French")).toBeVisible();
    await expect(page.locator('a[href="/write-review/mambar-pierrette"]').getByText("Pidgin")).toBeVisible();
  });

  test("draft movies stay out of public catalogue routes but remain visible to admin", async ({ page }) => {
    await page.goto("/movies");
    await expect(page.getByRole("heading", { name: "Beleh" })).toHaveCount(0);

    const draftMovieResponse = await page.goto("/movies/beleh");
    expect(draftMovieResponse?.status()).toBe(404);

    const draftReviewResponse = await page.goto("/write-review/beleh");
    expect(draftReviewResponse?.status()).toBe(404);

    await signInAdmin(page);
    await expect(page.getByRole("button", { name: /Beleh/ })).toBeVisible();
    await page.getByRole("button", { name: "Draft", exact: true }).click();
    await expect(page.getByRole("button", { name: /Beleh/ })).toBeVisible();
  });

  test("admin routes require an admin session", async ({ page, request }) => {
    await page.goto("/admin/login");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fmovies|\/login\?next=\/admin\/movies/);

    await page.goto("/admin/movies");
    await expect(page).toHaveURL(/\/login\?next=\/admin\/movies/);

    await page.goto("/account/reviews");
    await expect(page).toHaveURL(/\/login\?next=\/account\/reviews/);

    const anonymousCreate = await request.post("/api/admin/movies");
    expect(anonymousCreate.status()).toBe(401);

    await page.goto("/register");
    await page.getByPlaceholder("Aline N.").fill("Regular Member");
    await page.getByPlaceholder("you@example.com").fill(`member-${Date.now()}@example.com`);
    await page.getByPlaceholder("At least 8 characters").fill("password123");
    await page.getByRole("button", { name: "Register" }).click();
    await expect(page.getByText("Account session is active.")).toBeVisible();

    const memberCreate = await page.request.post("/api/admin/movies");
    expect(memberCreate.status()).toBe(403);
  });

  test("admin review queue lists reviews for moderation", async ({ page }) => {
    await signInAdmin(page);
    await page.goto("/admin/reviews");
    await expect(page.getByRole("heading", { name: "Moderate the public conversation" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ordinary resilience, filmed with patience" })).toBeVisible();
    await expect(page.locator(".review-status-badge").first()).toContainText("Published");
  });

  test("movie detail page shows trailer, gallery, and cast portraits", async ({ page }) => {
    await page.goto("/movies/the-fishermans-diary");

    await expect(page.getByTestId("movie-media-section")).toBeVisible();
    await expect(page.getByTitle("The Fisherman's Diary trailer")).toBeVisible();
    await expect(page.getByTestId("movie-gallery").locator("img")).toHaveCount(3);
    await expect(page.locator('[data-testid="credit-avatar"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="credit-avatar"][data-photo-state="fallback"]')).toHaveCount(1);
  });
});
