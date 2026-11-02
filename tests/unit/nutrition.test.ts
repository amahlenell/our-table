import { describe, it, expect } from "vitest";
import {
  ingredientNutrition,
  nutrition,
  grams,
  scaleIngredients,
} from "@/services/nutrition";
import { ingredient } from "../fixtures";
describe("source-aware nutrition", () => {
  it("uses source calories and preserves missing fibre", () => {
    expect(ingredientNutrition(ingredient)).toEqual({
      calories: 246,
      protein: 40,
      carbs: 10,
      fat: 8,
      fibre: null,
    });
    expect(nutrition([ingredient], 2).calories).toBe(123);
  });
  it("propagates unknown nutrients across the entire recipe", () => {
    expect(
      nutrition([ingredient, { ...ingredient, food: null }], 2).protein,
    ).toBeNull();
    expect(nutrition([], 2).calories).toBeNull();
  });
  it("does not convert volumes without ingredient-specific data", () => {
    expect(grams({ ...ingredient, unit: "ml" })).toBeNull();
    expect(grams({ ...ingredient, unit: "cup", quantity: 2 })).toBe(180);
    expect(
      grams({ ...ingredient, unit: "cup", quantity: 2, gramEquivalent: 175 }),
    ).toBe(175);
  });
  it("converts kilograms, pieces, and explicit batch gram equivalents", () => {
    expect(grams({ ...ingredient, unit: "kg", quantity: 1.5 })).toBe(1500);
    expect(grams({ ...ingredient, unit: "piece", quantity: 3 })).toBe(150);
    expect(
      ingredientNutrition({ ...ingredient, quantity: 0, food: null }).calories,
    ).toBe(0);
  });
  it("scales ingredients and batch totals while keeping per-serving macros stable", () => {
    const scaled = scaleIngredients(
      [{ ...ingredient, gramEquivalent: 200 }],
      2,
      6,
    );
    expect(scaled[0].quantity).toBe(600);
    expect(scaled[0].gramEquivalent).toBe(600);
    expect(nutrition(scaled, 6)).toEqual(
      nutrition([{ ...ingredient, gramEquivalent: 200 }], 2),
    );
    expect(nutrition(scaled).calories).toBe(738);
  });
  it("rejects invalid serving counts", () => {
    expect(() => nutrition([ingredient], 0)).toThrow();
    expect(() => scaleIngredients([ingredient], 0, 2)).toThrow();
  });
});
