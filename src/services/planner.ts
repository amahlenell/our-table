import type { MealPlan, Recipe } from "@/types";
import { scaleIngredients } from "./nutrition";
export function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
export function portions(plan: MealPlan, recipeId?: string) {
  return plan.entries
    .filter((e) => !recipeId || e.recipeId === recipeId)
    .reduce(
      (sum, e) => sum + Object.values(e.portions).reduce((a, b) => a + b, 0),
      0,
    );
}
export function batchIngredients(plan: MealPlan, recipes: Recipe[]) {
  const items = new Map<string, ReturnType<typeof scaleIngredients>[number]>();
  for (const recipe of recipes) {
    const total = portions(plan, recipe.id);
    if (!total) continue;
    for (const ingredient of scaleIngredients(
      recipe.ingredients,
      recipe.servings,
      total,
    )) {
      // Different raw/cooked food records and unknown ingredients are never merged blindly.
      const key = `${ingredient.food?.id ?? `${recipe.id}:${ingredient.id}`}|${ingredient.unit}|${ingredient.gramEquivalent === null ? "unit" : "grams"}`;
      const existing = items.get(key);
      if (existing) {
        existing.quantity += ingredient.quantity;
        if (existing.gramEquivalent !== null)
          existing.gramEquivalent += ingredient.gramEquivalent ?? 0;
      } else items.set(key, { ...ingredient });
    }
  }
  return [...items.values()];
}
export function storageWarnings(plan: MealPlan, recipes: Recipe[]) {
  return plan.entries.flatMap((e) => {
    const recipe = recipes.find((r) => r.id === e.recipeId);
    if (!recipe || e.frozen || Object.values(e.portions).every((n) => n === 0))
      return [];
    const day =
      Math.round(
        (Date.parse(e.date + "T12:00:00Z") -
          Date.parse(plan.startDate + "T12:00:00Z")) /
          86400000,
      ) + 1;
    if (recipe.fridgeDays === null)
      return [`${recipe.title}: refrigerated storage period has not been set.`];
    return day > recipe.fridgeDays
      ? [
          `${recipe.title} on day ${day} exceeds its ${recipe.fridgeDays}-day guidance. Freeze this portion or revise the plan.`,
        ]
      : [];
  });
}
