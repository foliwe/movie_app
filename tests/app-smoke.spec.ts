import { expect, test, type Page } from "@playwright/test";

async function signInAdmin(page: Page) {
  await page.goto("/login?next=/admin/movies");
  await page.getByPlaceholder("you@example.com").fill("admin@example.com");
  await page.getByPlaceholder("At least 8 characters").fill("admin1234");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/movies$/);
  await expect(page.getByRole("heading", { name: "Create, stage, and publish catalogue entries" })).toBeVisible();
}

test.describe("movie app smoke suite", () => {
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
    await expect(page.getByRole("heading", { name: "Your review desk" })).toBeVisible();
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

  test("review surfaces keep film language context visible", async ({ page }) => {
    await page.goto("/reviews");

    await expect(page.getByText("Mambar Pierrette / French, Pidgin")).toBeVisible();
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
