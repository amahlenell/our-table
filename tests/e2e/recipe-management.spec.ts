import { test, expect } from "@playwright/test";
test("recipe editing, duplication, favourite and confirmed deletion", async ({
  page,
}) => {
  await page.goto("/recipes/20000000-0000-4000-8000-000000000001");
  await page
    .getByRole("button", { name: "Favourite recipe", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Favourite recipe", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await page
    .getByLabel("Recipe name", { exact: true })
    .fill("Revised chicken bowls");
  await page
    .getByLabel("Tags, separated by commas")
    .fill("Batch cooking, Weeknight");
  await page.getByRole("button", { name: "Save recipe", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Revised chicken bowls", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Batch cooking", { exact: true })).toBeVisible();
  await expect(page.getByText("Weeknight", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Duplicate recipe" }).click();
  await expect(page.getByLabel("Recipe name", { exact: true })).toHaveValue(
    "Revised chicken bowls (copy)",
  );
  await page.getByRole("button", { name: "Save recipe", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Revised chicken bowls (copy)",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Delete recipe", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete recipe", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your recipe book." }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Revised chicken bowls", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Revised chicken bowls (copy)",
      exact: true,
    }),
  ).not.toBeVisible();
});
