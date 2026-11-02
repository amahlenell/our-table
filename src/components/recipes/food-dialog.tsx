"use client";
import { useState } from "react";
import { Search } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useApp, api } from "@/features/app-provider";
import type { Food, NutrientKey } from "@/types";
import { unknownNutrients } from "@/services/nutrition";
import { formatNumber } from "@/lib/utils";
export function FoodDialog({
  open,
  onClose,
  onSelect,
  name,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (food: Food) => void;
  name: string;
}) {
  const { data, demo, saveFood } = useApp();
  const [mode, setMode] = useState<"search" | "custom">("search"),
    [query, setQuery] = useState(name),
    [results, setResults] = useState<Food[]>([]),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [custom, setCustom] = useState<Food>({
    id: crypto.randomUUID(),
    name,
    source: "User label",
    state: "As sold",
    per100: unknownNutrients(),
    gramsPerUnit: {},
  });
  async function search() {
    setBusy(true);
    setError("");
    try {
      if (demo)
        throw new Error(
          "USDA lookup needs a connected account and API key. Try a saved food or enter a packaging label.",
        );
      setResults(await api<Food[]>(`foods?q=${encodeURIComponent(query)}`));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function select(food: Food, persist = false) {
    setBusy(true);
    setError("");
    try {
      onSelect(persist ? await saveFood(food) : food);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const matches = data.foods.filter((f) =>
    f.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      title="Find the right ingredient"
      description="Choose the correct raw or cooked entry. Values are per 100 g."
    >
      <div className="segmented">
        <button
          onClick={() => setMode("search")}
          className={mode === "search" ? "selected" : ""}
        >
          Find a food
        </button>
        <button
          onClick={() => setMode("custom")}
          className={mode === "custom" ? "selected" : ""}
        >
          Enter a food label
        </button>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {mode === "search" ? (
        <>
          <div className="inline-form">
            <input
              aria-label="Food search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. chicken breast, raw"
            />
            <Button
              disabled={busy || query.trim().length < 2}
              onClick={() => void search()}
            >
              <Search size={16} />
              {busy ? "Searching…" : "USDA"}
            </Button>
          </div>
          <p className="muted small-text">
            {matches.length
              ? "Your saved foods"
              : "No matching saved foods yet"}
          </p>
          <div className="food-results">
            {[...matches, ...results].map((f, i) => (
              <button
                key={`${f.id}-${i}`}
                disabled={busy}
                className="food-result"
                onClick={() =>
                  void select(f, !matches.some((m) => m.id === f.id))
                }
              >
                <strong>{f.name}</strong>
                <span>
                  {f.source} · {f.state} · {formatNumber(f.per100.calories)}{" "}
                  kcal / 100 g
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <form
          className="stack"
          onSubmit={(e) => {
            e.preventDefault();
            void select({ ...custom, id: crypto.randomUUID() }, true);
          }}
        >
          <label>
            Product or ingredient name
            <input
              required
              maxLength={200}
              value={custom.name}
              onChange={(e) => setCustom({ ...custom, name: e.target.value })}
            />
          </label>
          <label>
            State / brand
            <input
              value={custom.state}
              onChange={(e) => setCustom({ ...custom, state: e.target.value })}
              placeholder="e.g. raw, cooked, or NZ brand"
            />
          </label>
          <p className="callout">
            Enter values per 100 g from your packaging. Leave unavailable values
            blank. kJ ÷ 4.184 = kcal.
          </p>
          <div className="form-grid three">
            {(
              ["calories", "protein", "carbs", "fat", "fibre"] as NutrientKey[]
            ).map((k) => (
              <label key={k}>
                {k === "calories"
                  ? "Energy (kcal)"
                  : `${k[0].toUpperCase() + k.slice(1)} (g)`}
                <input
                  aria-label={`${k} per 100 g`}
                  type="number"
                  min="0"
                  step="any"
                  value={custom.per100[k] ?? ""}
                  onChange={(e) =>
                    setCustom({
                      ...custom,
                      per100: {
                        ...custom.per100,
                        [k]:
                          e.target.value === "" ? null : Number(e.target.value),
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
          <label>
            Grams per piece (optional)
            <input
              type="number"
              min="0.001"
              step="any"
              value={custom.gramsPerUnit?.piece ?? ""}
              onChange={(e) =>
                setCustom({
                  ...custom,
                  gramsPerUnit: e.target.value
                    ? { piece: Number(e.target.value) }
                    : {},
                })
              }
            />
          </label>
          <Button disabled={busy}>
            {busy ? "Saving…" : "Save food & use ingredient"}
          </Button>
        </form>
      )}
    </Dialog>
  );
}
