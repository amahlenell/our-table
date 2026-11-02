"use client";
import { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Link2 } from "lucide-react";
import type { Ingredient } from "@/types";
import { units } from "@/types";
import { FoodDialog } from "./food-dialog";
import { Button } from "@/components/ui/button";
import { ingredientNutrition, grams } from "@/services/nutrition";
import { formatNumber } from "@/lib/utils";
export function IngredientEditor({
  value,
  onChange,
}: {
  value: Ingredient[];
  onChange: (v: Ingredient[]) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const active = value.find((i) => i.id === selected);
  function patch(id: string, p: Partial<Ingredient>) {
    onChange(value.map((i) => (i.id === id ? { ...i, ...p } : i)));
  }
  function move(index: number, delta: number) {
    const next = [...value];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    onChange(next);
  }
  return (
    <div className="ingredient-editor">
      {value.map((i, index) => {
        const n = ingredientNutrition(i);
        return (
          <div className="ingredient-edit-row" key={i.id}>
            <div className="ingredient-top">
              <span className="row-number">{index + 1}</span>
              <input
                aria-label={`Ingredient ${index + 1} name`}
                placeholder="Ingredient name"
                value={i.name}
                onChange={(e) => patch(i.id, { name: e.target.value })}
              />
              <input
                aria-label={`Ingredient ${index + 1} quantity`}
                type="number"
                min="0"
                step="any"
                value={i.quantity}
                onChange={(e) =>
                  patch(i.id, {
                    quantity: Number(e.target.value),
                    gramEquivalent: null,
                  })
                }
              />
              <select
                aria-label={`Ingredient ${index + 1} unit`}
                value={i.unit}
                onChange={(e) =>
                  patch(i.id, {
                    unit: e.target.value as Ingredient["unit"],
                    gramEquivalent: null,
                  })
                }
              >
                {units.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ingredient ${index + 1}`}
                onClick={() => onChange(value.filter((v) => v.id !== i.id))}
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="ingredient-bottom">
              <button
                type="button"
                className="food-link"
                onClick={() => setSelected(i.id)}
              >
                <Link2 size={13} />
                {i.food
                  ? `${i.food.name} · ${i.food.source}`
                  : "Link nutrition / food label"}
              </button>
              <span>
                {formatNumber(n.calories, 0)} kcal · {formatNumber(n.protein)} g
                protein
              </span>
              <div className="row-reorder">
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Move ingredient ${index + 1} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Move ingredient ${index + 1} down`}
                  disabled={index === value.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={14} />
                </button>
              </div>
            </div>
            {(grams(i) === null || i.gramEquivalent !== null) && (
              <label className="gram-equivalent">
                Total grams for this quantity{" "}
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={i.gramEquivalent ?? ""}
                  placeholder="Unknown"
                  onChange={(e) =>
                    patch(i.id, {
                      gramEquivalent:
                        e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                />
                <span>
                  Ingredient-specific conversion; never a universal cup weight.
                </span>
              </label>
            )}
          </div>
        );
      })}
      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          onChange([
            ...value,
            {
              id: crypto.randomUUID(),
              name: "",
              quantity: 1,
              unit: "g",
              gramEquivalent: null,
              food: null,
            },
          ])
        }
      >
        <Plus size={16} />
        Add ingredient
      </Button>
      {active && (
        <FoodDialog
          key={active.id}
          open
          onClose={() => setSelected(null)}
          name={active.name}
          onSelect={(food) => patch(active.id, { food })}
        />
      )}
    </div>
  );
}
