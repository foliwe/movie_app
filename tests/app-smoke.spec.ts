import { expect, test } from "@playwright/test";

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

  test("login form shows validation and success states", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("you@example.com").fill("invalid-email");
    await page.getByPlaceholder("At least 8 characters").fill("password123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Use a valid email address to continue.")).toBeVisible();

    await page.getByPlaceholder("you@example.com").fill("tester@example.com");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Mock account flow completed.")).toBeVisible();
  });

  test("write review restores local drafts and resets after publish", async ({ page }) => {
    await page.goto("/write-review/mambar-pierrette");

    await page.getByLabel("Review title", { exact: true }).fill("Measured, intimate, unforgettable");
    await page
      .getByLabel("Your review", { exact: true })
      .fill("A beautifully observed portrait that keeps revealing character through routine, labour, and pressure.");
    await page.getByLabel("Contains spoilers", { exact: true }).check();
    await page.getByRole("button", { name: "Save draft locally" }).click();

    await expect(page.getByText("Draft saved locally on this device.")).toBeVisible();
    await expect(page.getByTestId("review-preview-card")).toContainText("Spoilers flagged");

    await page.reload();
    await expect(page.getByText("Saved draft restored for this title.")).toBeVisible();
    await expect(page.getByLabel("Review title", { exact: true })).toHaveValue("Measured, intimate, unforgettable");
    await expect(page.getByLabel("Contains spoilers", { exact: true })).toBeChecked();

    await page.getByRole("button", { name: "Publish mock review" }).click();
    await expect(page.getByText("Review saved locally for the Phase 1 demo.")).toBeVisible();
    await expect(page.getByLabel("Review title", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("Contains spoilers", { exact: true })).not.toBeChecked();
  });

  test("admin movie desk previews and publishes a new draft", async ({ page }) => {
    await page.goto("/admin/movies");

    await page.getByRole("button", { name: "New draft" }).click();
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

    await expect(page.getByText("Record published locally.")).toBeVisible();
    await expect(page.getByTestId("admin-preview-card")).toContainText("River Spirits");
    await expect(page.getByTestId("admin-preview-card")).toContainText("Trailer ready");
    await expect(page.locator('a[href="/movies/river-spirits"]')).toBeVisible();
    await expect(page.locator('a[href="/write-review/river-spirits"]')).toBeVisible();
  });

  test("review surfaces keep film language context visible", async ({ page }) => {
    await page.goto("/reviews");

    await expect(page.getByText("Mambar Pierrette / French, Pidgin")).toBeVisible();
    await expect(page.locator('a[href="/write-review/mambar-pierrette"]').getByText("French")).toBeVisible();
    await expect(page.locator('a[href="/write-review/mambar-pierrette"]').getByText("Pidgin")).toBeVisible();
  });
});
