import type { Ingredient } from "@/types";
import { nutrition } from "@/services/nutrition";
import { formatNumber } from "@/lib/utils";
import { Info } from "lucide-react";
export function NutritionSummary({
  ingredients,
  servings,
  label = "Per serving",
}: {
  ingredients: Ingredient[];
  servings: number;
  label?: string;
}) {
  const n = nutrition(ingredients, servings);
  const incomplete = Object.values(n).some((v) => v === null);
  return (
    <section className="nutrition-summary">
      <div className="nutrition-header">
        <h3>A little nourishment</h3>
        <span>{label}</span>
      </div>
      <div className="macro-grid">
        {(
          [
            { key: "calories", label: "Calories", unit: "kcal" },
            { key: "protein", label: "Protein", unit: "g" },
            { key: "carbs", label: "Carbs", unit: "g" },
            { key: "fat", label: "Fat", unit: "g" },
            { key: "fibre", label: "Fibre", unit: "g" },
          ] as const
        ).map(({ key, label, unit }) => (
          <div className={`macro macro-${key}`} key={key}>
            <strong>
              {formatNumber(n[key], key === "calories" ? 0 : 1)}
              <small>{unit}</small>
            </strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <p className="nutrition-footnote">
        <Info size={13} />
        {incomplete
          ? "Missing food matches or gram conversions are shown as —. Complete the ingredient data to calculate them."
          : "Calculated from linked ingredient records. Values are estimates; review raw/cooked state and packaging."}
      </p>
      <p className="source-list">
        Sources:{" "}
        {[
          ...new Set(ingredients.map((i) => i.food?.source || "Unlinked")),
        ].join(", ") || "No ingredients"}
      </p>
    </section>
  );
}
