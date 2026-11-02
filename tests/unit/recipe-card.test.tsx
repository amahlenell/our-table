// @vitest-environment jsdom
import { it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { fixtureRecipe } from "../fixtures";
const personal = vi.fn().mockResolvedValue(undefined);
vi.mock("@/features/app-provider", () => ({
  useApp: () => ({ personal, toast: vi.fn() }),
}));
it("renders calculated nutrition and saves the user’s favourite action", () => {
  const recipe = fixtureRecipe();
  render(<RecipeCard recipe={recipe} />);
  expect(screen.getByText("20 g protein")).toBeInTheDocument();
  expect(screen.getByText("123 kcal")).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Favourite Test recipe" }),
  );
  expect(personal).toHaveBeenCalledWith(recipe.id, { favourite: true });
});
