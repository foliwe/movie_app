import { createHash, randomBytes } from "crypto";
import { expect, test, type Page } from "@playwright/test";
import { NextRequest } from "next/server";
import { Client } from "pg";
import { POST as submitMovieRequest } from "@/app/api/contact/movie-request/route";

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

async function waitForMailpitMessage(
  recipient: string,
  predicate: (message: MailpitMessage) => boolean = () => true,
  timeoutMs = 15_000,
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const query = encodeURIComponent(`to:${recipient}`);
    const response = await fetch(`${mailpitBaseUrl}/api/v1/search?query=${query}&limit=10`);

    if (response.ok) {
      const payload = (await response.json()) as MailpitSearchResponse;
      for (const candidate of payload.messages) {
        const message = await getMailpitMessageById(candidate.ID);

        if (predicate(message)) {
          return message;
        }
      }
    }

    await sleep(250);
  }

  throw new Error(`Timed out waiting for a matching Mailpit message for ${recipient}.`);
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

async function countMoviesByTitle(title: string) {
  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  try {
    const result = await client.query<{ count: string }>('select count(*) from "Movie" where title = $1', [title]);
    return Number(result.rows[0]?.count ?? "0");
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
  await expect(page.getByRole("heading", { name: "Titles", exact: true })).toBeVisible();
}

test.describe("movie app smoke suite", () => {
  test.describe.configure({ mode: "serial" });

  test("core routes render a main heading", async ({ page }) => {
    const routes = [
      "/",
      "/contact",
      "/contact/movie-request",
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

    const resetMessage = await waitForMailpitMessage(email);
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

  test("movie request route validates payload and requires admin email config", async () => {
    const originalAdminEmail = process.env.MOVIE_REQUEST_ADMIN_EMAIL;

    try {
      const invalidEmailResponse = await submitMovieRequest(
        new NextRequest("http://127.0.0.1:3000/api/contact/movie-request", {
          method: "POST",
          body: JSON.stringify({
            title: "Validation Smoke Title",
            language: "English",
            producer: "Validation Producer",
            year: "2024",
            contactPhone: "+237699000000",
            contactEmail: "not-an-email",
            role: "Director",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

      expect(invalidEmailResponse.status).toBe(400);
      expect(await invalidEmailResponse.json()).toEqual({
        message: "Use a valid email address to continue.",
      });

      const missingOtherRoleResponse = await submitMovieRequest(
        new NextRequest("http://127.0.0.1:3000/api/contact/movie-request", {
          method: "POST",
          body: JSON.stringify({
            title: "Validation Smoke Title",
            language: "English",
            producer: "Validation Producer",
            year: "2024",
            contactPhone: "+237699000000",
            contactEmail: "director@example.com",
            role: "Other",
            otherRole: "",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

      expect(missingOtherRoleResponse.status).toBe(400);
      expect(await missingOtherRoleResponse.json()).toEqual({
        message: "Describe your role in the movie.",
      });

      const invalidYearResponse = await submitMovieRequest(
        new NextRequest("http://127.0.0.1:3000/api/contact/movie-request", {
          method: "POST",
          body: JSON.stringify({
            title: "Validation Smoke Title",
            language: "English",
            producer: "Validation Producer",
            year: "20A4",
            contactPhone: "+237699000000",
            contactEmail: "director@example.com",
            role: "Director",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

      expect(invalidYearResponse.status).toBe(400);
      expect(await invalidYearResponse.json()).toEqual({
        message: "Use a valid 4-digit release year.",
      });

      delete process.env.MOVIE_REQUEST_ADMIN_EMAIL;

      const missingEnvResponse = await submitMovieRequest(
        new NextRequest("http://127.0.0.1:3000/api/contact/movie-request", {
          method: "POST",
          body: JSON.stringify({
            title: "Validation Smoke Title",
            language: "English",
            producer: "Validation Producer",
            year: "2024",
            contactPhone: "+237699000000",
            contactEmail: "director@example.com",
            role: "Director",
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

      expect(missingEnvResponse.status).toBe(500);
      expect(await missingEnvResponse.json()).toEqual({
        message: "We couldn't send your request right now. Please try again later.",
      });
    } finally {
      if (originalAdminEmail === undefined) {
        delete process.env.MOVIE_REQUEST_ADMIN_EMAIL;
      } else {
        process.env.MOVIE_REQUEST_ADMIN_EMAIL = originalAdminEmail;
      }
    }
  });

  test("contact movie request form sends acknowledgement and admin emails without creating a movie", async ({ page }) => {
    test.skip(!process.env.MOVIE_REQUEST_ADMIN_EMAIL, "MOVIE_REQUEST_ADMIN_EMAIL is required for the email happy path.");

    const requestTitle = `Smoke Request ${Date.now()}`;
    const submitterEmail = `movie-request-${Date.now()}@example.com`;
    const adminEmail = process.env.MOVIE_REQUEST_ADMIN_EMAIL as string;

    await page.goto("/");
    await page.getByRole("link", { name: "Contact" }).click();
    await expect(page).toHaveURL(/\/contact$/);

    await page.getByRole("link", { name: "Open movie request" }).click();
    await expect(page).toHaveURL(/\/contact\/movie-request$/);

    const form = page.locator(".movie-request-form");

    await form.getByPlaceholder("The Fisherman's Diary").fill(requestTitle);
    await form.getByPlaceholder("English").fill("English");
    await form.getByPlaceholder("Asaba Films").fill("Smoke Producer");
    await form.getByPlaceholder("2024").fill("2024");
    await form.getByPlaceholder("+237 6 99 00 00 00").fill("+237 6 99 00 00 00");
    await form.getByPlaceholder("producer@example.com").fill(submitterEmail);
    await form.getByTestId("movie-request-role").selectOption("Other");
    await form.getByTestId("movie-request-other-role").fill("Festival representative");
    await form.getByRole("button", { name: "Send request" }).click();

    await expect(page.getByText("We received your movie request and sent a confirmation email.")).toBeVisible();

    const submitterMessage = await waitForMailpitMessage(submitterEmail, (message) =>
      message.Text.includes(`We received your movie request for "${requestTitle}".`),
    );
    expect(submitterMessage.Text).toContain(`We received your movie request for "${requestTitle}".`);

    const adminMessage = await waitForMailpitMessage(adminEmail, (message) =>
      message.Text.includes(`Title: ${requestTitle}`),
    );
    expect(adminMessage.Text).toContain(`Title: ${requestTitle}`);
    expect(adminMessage.Text).toContain("Festival representative");

    await expect.poll(async () => countMoviesByTitle(requestTitle)).toBe(0);
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
      await expect(page).toHaveURL(new RegExp(`/login\\?next=${route.replaceAll("/", "\\/")}$`));
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
    await page.goto("/admin/movies/new");
    await expect(page.getByRole("heading", { name: "Add New Title" })).toBeVisible();

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
    await page.goto("/admin/movies/new");
    await expect(page.getByRole("button", { name: /Beleh/ })).toBeVisible();
    await page.getByRole("button", { name: "Draft", exact: true }).first().click();
    await expect(page.getByRole("button", { name: /Beleh/ })).toBeVisible();
  });

  test("admin routes require an admin session", async ({ page, request }) => {
    await page.goto("/admin/login");
    await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fmovies|\/login\?next=\/admin\/movies/);

    await page.goto("/admin/movies");
    await expect(page).toHaveURL(/\/login\?next=(\/admin\/movies|%2Fadmin%2Fmovies)/);

    await page.goto("/account/reviews");
    await expect(page).toHaveURL(/\/login\?next=(\/account\/reviews|%2Faccount%2Freviews)/);

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
    await expect(page.getByRole("heading", { name: "Reviews" })).toBeVisible();
    await expect(page.getByText("Review Queue")).toBeVisible();
    await expect(page.locator(".cineverse-status").first()).toBeVisible();
  });

  test("admin dashboard actions and title detail tabs stay interactive", async ({ page }) => {
    await signInAdmin(page);
    await page.goto("/admin/dashboard");

    const featuredTitle = await page.locator(".cineverse-featured-title h3").innerText();
    await page.getByRole("link", { name: "View Details" }).click();

    await expect(page).toHaveURL(/\/admin\/movies\?movieId=/);
    await expect(page.getByTestId("movie-detail-panel")).toContainText(featuredTitle);

    await page.getByRole("tab", { name: "Details" }).click();
    await expect(page.getByTestId("movie-detail-panel")).toContainText("Director");
    await expect(page.getByTestId("movie-detail-panel")).toContainText(featuredTitle);

    await page.getByRole("tab", { name: "Media" }).click();
    await expect(page.getByTestId("movie-detail-panel")).toContainText("Gallery Images");

    await page.getByRole("tab", { name: "Reviews" }).click();
    await expect(page.getByTestId("movie-detail-panel")).toContainText("Latest feedback");

    const alternateRow = page.locator(".cineverse-table tbody tr").nth(2);
    const alternateTitle = await alternateRow.locator("td").first().locator("strong").innerText();
    await alternateRow.click();
    await expect(page.getByTestId("movie-detail-panel")).toContainText(alternateTitle);

    await page.getByRole("link", { name: "Go to the Cineverse home page" }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("admin list actions update supporting detail panes", async ({ page }) => {
    await signInAdmin(page);

    await page.goto("/admin/people");
    const selectedPersonName = await page.locator(".cineverse-table tbody tr").nth(1).locator("td").first().locator("strong").innerText();
    await page.locator(".cineverse-table tbody tr").nth(1).getByRole("button", { name: `Edit ${selectedPersonName}` }).click();
    await expect(page.locator(".cineverse-detail-panel h2")).toHaveText(selectedPersonName);
    await expect(page.getByRole("tab", { name: "Credits" })).toHaveAttribute("aria-selected", "true");

    await page.goto("/admin/users");
    const selectedDisplayName = await page.locator(".cineverse-table tbody tr").nth(1).locator("td").first().locator("small").innerText();
    await page.locator(".cineverse-table tbody tr").nth(1).getByRole("button", { name: `Edit ${selectedDisplayName}` }).click();
    await expect(page.locator(".cineverse-detail-panel h2")).toHaveText(selectedDisplayName);
    await expect(page.getByRole("tab", { name: "Activity" })).toHaveAttribute("aria-selected", "true");
  });

  test("admin genres, reviews, and media actions stay connected to detail views", async ({ page }) => {
    await signInAdmin(page);

    await page.goto("/admin/genres");
    const selectedGenre = await page.locator(".cineverse-table tbody tr").nth(1).locator("td").nth(1).innerText();
    await page.locator(".cineverse-table tbody tr").nth(1).getByRole("button", { name: `Edit ${selectedGenre}` }).click();
    await expect(page.locator(".cineverse-detail-panel h2")).toHaveText(selectedGenre);
    await expect(page.getByRole("tab", { name: "Titles" })).toHaveAttribute("aria-selected", "true");

    await page.goto("/admin/reviews");
    const reviewRow = page.locator(".cineverse-table tbody tr").nth(0);
    const reviewTitle = await reviewRow.locator("td").nth(3).innerText();
    await reviewRow.getByRole("button", { name: `View ${reviewTitle}` }).click();
    await expect(page.locator(".cineverse-detail-panel h2")).toHaveText(reviewTitle);

    await page.goto("/admin/media");
    const mediaAsset = page.locator(".cineverse-asset-card").first();
    const mediaTitle = await mediaAsset.locator("strong").innerText();
    await mediaAsset.getByRole("link", { name: `Edit ${mediaTitle} Poster` }).click();
    await expect(page).toHaveURL(/\/admin\/movies\?movieId=.*&tab=media/);
    await expect(page.getByTestId("movie-detail-panel")).toContainText(mediaTitle);
    await expect(page.getByRole("tab", { name: "Media" })).toHaveAttribute("aria-selected", "true");
  });

  test("admin suite routes render inside the 1920px shell", async ({ page }) => {
    await signInAdmin(page);
    await page.setViewportSize({ width: 2200, height: 1100 });

    const routes = [
      ["/admin/dashboard", "Dashboard"],
      ["/admin/movies", "Titles"],
      ["/admin/movies/new", "Add New Title"],
      ["/admin/people", "People"],
      ["/admin/genres", "Genres"],
      ["/admin/reviews", "Reviews"],
      ["/admin/users", "Users"],
      ["/admin/media", "Media Assets"],
      ["/admin/analytics", "Analytics"],
      ["/admin/settings", "Settings"],
    ] as const;

    for (const [route, heading] of routes) {
      await page.goto(route);
      await expect(page.locator("h1", { hasText: heading })).toBeVisible();
      await expect(page.getByTestId("admin-shell")).toBeVisible();
    }

    const shellWidth = await page.getByTestId("admin-shell").evaluate((element) => element.getBoundingClientRect().width);
    expect(shellWidth).toBeLessThanOrEqual(1920);
  });

  test("admin Cloudinary signing endpoint stays admin protected and usable", async ({ page, request }) => {
    const anonymousSign = await request.post("/api/cloudinary/sign", {
      data: {
        paramsToSign: {
          folder: "movies/smoke/poster",
          timestamp: 1716500000,
          upload_preset: "smoke",
        },
      },
    });
    expect(anonymousSign.status()).toBe(401);

    await signInAdmin(page);
    const signedResponse = await page.request.post("/api/cloudinary/sign", {
      data: {
        paramsToSign: {
          folder: "movies/smoke/poster",
          timestamp: 1716500000,
          upload_preset: "smoke",
        },
      },
    });
    expect(signedResponse.status()).toBe(200);
    await expect(page.getByText("Cloudinary", { exact: false })).toHaveCount(0);
  });

  test("movie detail page shows trailer, gallery, and cast portraits", async ({ page }) => {
    await page.goto("/movies/the-fishermans-diary");

    await expect(page.getByTestId("movie-media-section")).toBeVisible();
    await expect(page.getByTitle("The Fisherman's Diary trailer")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Gallery" })).toBeVisible();
    await expect(page.locator('[data-testid="credit-avatar"]')).toHaveCount(4);
    await expect(page.locator('[data-testid="credit-avatar"][data-photo-state="fallback"]')).toHaveCount(1);
  });
});
