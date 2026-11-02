import { test, expect } from "@playwright/test";
test("recipe creation, food label, scaling, notes, and cooking progress", async ({
  page,
}) => {
  await page.goto("/recipes/new");
  await expect(
    page.getByRole("heading", { name: "Something worth saving." }),
  ).toBeVisible();
  await page
    .getByLabel("Recipe name", { exact: true })
    .fill("Browser test oats");
  await page.getByLabel("Servings", { exact: true }).fill("2");
  await page
    .getByLabel("Tags, separated by commas")
    .fill("Meal prep, Weeknight");
  await page.getByLabel("Upload recipe photo").setInputFiles({
    name: "test-kitchen.png",
    mimeType: "image/png",
    buffer: await page.screenshot(),
  });
  await expect(page.getByAltText("Recipe photo preview")).toBeVisible();
  await page
    .getByRole("button", { name: "Add ingredient", exact: true })
    .click();
  await page.getByLabel("Ingredient 1 name").fill("Oats");
  await page.getByLabel("Ingredient 1 quantity").fill("100");
  await page
    .getByRole("button", { name: "Link nutrition / food label" })
    .click();
  await page.getByRole("button", { name: "Enter a food label" }).click();
  await page.getByLabel("calories per 100 g").fill("400");
  await page.getByLabel("protein per 100 g").fill("20");
  await page.getByLabel("carbs per 100 g").fill("60");
  await page.getByLabel("fat per 100 g").fill("10");
  await page.getByLabel("fibre per 100 g").fill("5");
  await page
    .getByRole("button", { name: "Save food & use ingredient" })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Add a step", exact: true }).click();
  await page.getByLabel("Instruction 1").fill("Mix the oats with water.");
  await page.getByRole("button", { name: "Add a step", exact: true }).click();
  await page.getByLabel("Instruction 2").fill("Cook until creamy.");
  await page.getByRole("button", { name: "Save recipe", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Browser test oats", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".macro-calories strong")).toHaveText("200kcal");
  await page.getByLabel("Batch servings").fill("4");
  await expect(page.getByText("200 g", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Whole batch", exact: true }).click();
  await expect(page.locator(".macro-calories strong")).toHaveText("800kcal");
  await page
    .getByLabel("Personal cooking notes")
    .fill("Add cinnamon next time.");
  await page.getByRole("button", { name: "Save my notes" }).click();
  await page.reload();
  await expect(page.getByLabel("Personal cooking notes")).toHaveValue(
    "Add cinnamon next time.",
  );
  await page.getByRole("link", { name: "Let’s get cooking" }).click();
  await expect(
    page.getByText("Mix the oats with water.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next step" }).click();
  await page.reload();
  await expect(
    page.getByText("Cook until creamy.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "All done" }).click();
  await expect(
    page.getByRole("heading", { name: "Browser test oats", exact: true }),
  ).toBeVisible();
});
test("unequal portions, storage warnings, search and responsive layout", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Good (morning|afternoon|evening), Alex/,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: `../prepbook-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto("/recipes");
  await page.getByLabel("Search recipes or ingredients").fill("broccoli");
  await expect(
    page.getByRole("heading", { name: "Chicken & broccoli egg muffins" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Berry overnight oats" }),
  ).not.toBeVisible();
  await page.goto("/meal-prep");
  await page.getByRole("button", { name: "Add a meal", exact: true }).click();
  await page.getByLabel("Jamie · portions per day").fill("1.5");
  await expect(
    page.getByText("7.5 total portions will be prepared."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add to your plan" }).click();
  await expect(page.locator(".plan-overview")).toContainText("7.5");
  await expect(page.getByText("A note on keeping things good")).toBeVisible();
  await page.getByRole("button", { name: "Save meal-prep plan" }).click();
  await page.reload();
  await expect(page.locator(".plan-overview")).toContainText("7.5");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
