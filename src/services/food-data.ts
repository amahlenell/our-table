import type { Food, Nutrients } from "@/types";
type FdcNutrient = {
  nutrientId?: number;
  nutrientNumber?: string;
  nutrient?: { id: number; number?: string; unitName?: string };
  value?: number;
  amount?: number;
  unitName?: string;
};
type FdcFood = {
  fdcId: number;
  description: string;
  dataType?: string;
  foodNutrients?: FdcNutrient[];
  foodPortions?: {
    gramWeight: number;
    amount: number;
    measureUnit?: { name: string };
  }[];
};
export function mapFdc(food: FdcFood): Food {
  const values = food.foodNutrients || [];
  function amount(id: number, unit?: string) {
    const n = values.find(
      (v) =>
        (v.nutrientId ?? v.nutrient?.id) === id &&
        (!unit || (v.unitName ?? v.nutrient?.unitName)?.toLowerCase() === unit),
    );
    return n?.value ?? n?.amount ?? null;
  }
  const per100: Nutrients = {
    calories:
      amount(1008, "kcal") ?? amount(2047, "kcal") ?? amount(2048, "kcal"),
    protein: amount(1003),
    carbs: amount(1005),
    fat: amount(1004),
    fibre: amount(1079),
  };
  return {
    id: crypto.randomUUID(),
    name: food.description,
    source: "USDA",
    sourceId: String(food.fdcId),
    state: food.dataType || "Review raw/cooked state",
    per100,
  };
}
async function fdc(path: string) {
  if (!process.env.USDA_API_KEY)
    throw new Error(
      "USDA lookup is not configured. You can enter nutrition from a food label instead.",
    );
  const response = await fetch(
    `https://api.nal.usda.gov/fdc/v1/${path}${path.includes("?") ? "&" : "?"}api_key=${encodeURIComponent(process.env.USDA_API_KEY)}`,
    { signal: AbortSignal.timeout(10000), cache: "no-store" },
  );
  if (!response.ok)
    throw new Error(
      "USDA is unavailable. Please try again or use a food label.",
    );
  return response.json();
}
export async function searchFoods(query: string) {
  const result = await fdc(
    `foods/search?query=${encodeURIComponent(query)}&pageSize=12`,
  );
  return ((result.foods || []) as FdcFood[]).map(mapFdc);
}
export async function fetchFood(id: string) {
  if (!/^\d{1,12}$/.test(id)) throw new Error("Invalid USDA food ID.");
  return mapFdc(await fdc(`food/${id}`));
}
