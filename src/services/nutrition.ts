import {
  nutrientKeys,
  type Ingredient,
  type Nutrients,
  type Unit,
} from "@/types";
export const unknownNutrients = (): Nutrients => ({
  calories: null,
  protein: null,
  carbs: null,
  fat: null,
  fibre: null,
});
export function grams(i: Ingredient): number | null {
  if (i.quantity === 0) return 0;
  if (i.gramEquivalent !== null) return i.gramEquivalent;
  if (i.unit === "g") return i.quantity;
  if (i.unit === "kg") return i.quantity * 1000;
  const conversion = i.food?.gramsPerUnit?.[i.unit];
  return conversion === undefined ? null : i.quantity * conversion;
}
export function ingredientNutrition(i: Ingredient): Nutrients {
  const weight = grams(i);
  return Object.fromEntries(
    nutrientKeys.map((k) => [
      k,
      weight === 0
        ? 0
        : weight === null || i.food?.per100[k] == null
          ? null
          : (weight / 100) * i.food.per100[k]!,
    ]),
  ) as Nutrients;
}
export function nutrition(ingredients: Ingredient[], servings = 1): Nutrients {
  if (!Number.isFinite(servings) || servings <= 0)
    throw new Error("Servings must be positive.");
  if (!ingredients.length) return unknownNutrients();
  const rows = ingredients.map(ingredientNutrition);
  return Object.fromEntries(
    nutrientKeys.map((k) => [
      k,
      rows.some((r) => r[k] === null)
        ? null
        : rows.reduce((a, r) => a + r[k]!, 0) / servings,
    ]),
  ) as Nutrients;
}
export function scaleIngredients(
  ingredients: Ingredient[],
  base: number,
  target: number,
) {
  if (base <= 0 || target <= 0) throw new Error("Servings must be positive.");
  return ingredients.map((i) => ({
    ...i,
    quantity: (i.quantity * target) / base,
    gramEquivalent:
      i.gramEquivalent === null ? null : (i.gramEquivalent * target) / base,
  }));
}
export function unitLabel(unit: Unit) {
  return {
    g: "g",
    kg: "kg",
    ml: "ml",
    l: "litre",
    cup: "cup",
    tbsp: "tbsp",
    tsp: "tsp",
    piece: "piece",
    serving: "serving",
  }[unit];
}
