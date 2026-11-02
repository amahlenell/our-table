import type { Ingredient, Recipe, MealPlan } from "@/types";
import { blankRecipe } from "@/features/demo";
export const alex = "10000000-0000-4000-8000-000000000001",
  jamie = "10000000-0000-4000-8000-000000000002";
export const ingredient: Ingredient = {
  id: "20000000-0000-4000-8000-000000000001",
  name: "Test food",
  quantity: 200,
  unit: "g",
  gramEquivalent: null,
  food: {
    id: "30000000-0000-4000-8000-000000000001",
    name: "Synthetic test record",
    source: "User label",
    state: "raw",
    per100: { calories: 123, protein: 20, carbs: 5, fat: 4, fibre: null },
    gramsPerUnit: { cup: 90, piece: 50 },
  },
};
export function fixtureRecipe(): Recipe {
  return {
    ...blankRecipe(),
    title: "Test recipe",
    servings: 2,
    status: "published",
    ingredients: [structuredClone(ingredient)],
    instructions: ["Cook thoroughly."],
    fridgeDays: 3,
  };
}
export function fixturePlan(recipeId: string): MealPlan {
  return {
    id: crypto.randomUUID(),
    title: "Test plan",
    startDate: "2026-09-30",
    days: 3,
    entries: [0, 1, 2].map((i) => ({
      id: crypto.randomUUID(),
      date: `2026-${i === 0 ? "09-30" : `10-0${i}`}`,
      slot: "Lunch",
      recipeId,
      frozen: false,
      portions: { [alex]: 1, [jamie]: 1.5 },
    })),
  };
}
