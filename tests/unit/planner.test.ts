import { describe, it, expect } from "vitest";
import {
  addDays,
  portions,
  batchIngredients,
  storageWarnings,
} from "@/services/planner";
import { fixturePlan, fixtureRecipe, alex, jamie } from "../fixtures";
describe("meal preparation", () => {
  it("counts unequal individual portions and scales the batch", () => {
    const r = fixtureRecipe(),
      p = fixturePlan(r.id);
    expect(portions(p)).toBe(7.5);
    expect(batchIngredients(p, [r])[0].quantity).toBe(750);
  });
  it("calculates six wraps for two people over three days", () => {
    const r = fixtureRecipe(),
      p = fixturePlan(r.id);
    p.entries.forEach((e) => (e.portions = { [alex]: 1, [jamie]: 1 }));
    expect(portions(p, r.id)).toBe(6);
  });
  it("handles month, year, and daylight-saving boundaries as calendar dates", () => {
    expect(addDays("2026-09-30", 2)).toBe("2026-10-02");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-09-26", 2)).toBe("2026-09-28");
  });
  it("flags unknown storage and durations that exceed guidance, excluding frozen portions", () => {
    const r = fixtureRecipe(),
      p = fixturePlan(r.id);
    r.fridgeDays = 2;
    expect(storageWarnings(p, [r])).toHaveLength(1);
    p.entries[2].frozen = true;
    expect(storageWarnings(p, [r])).toHaveLength(0);
    r.fridgeDays = null;
    expect(storageWarnings(p, [r])).toHaveLength(2);
  });
  it("does not merge unknown or raw/cooked ingredients indiscriminately", () => {
    const a = fixtureRecipe(),
      b = fixtureRecipe();
    b.ingredients[0].food = {
      ...b.ingredients[0].food!,
      id: crypto.randomUUID(),
      state: "cooked",
    };
    const p = fixturePlan(a.id);
    p.entries[1].recipeId = b.id;
    expect(batchIngredients(p, [a, b])).toHaveLength(2);
  });
});
