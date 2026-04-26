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
});
