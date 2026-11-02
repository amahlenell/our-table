"use client";
import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Users,
  Heart,
  ChefHat,
  Pencil,
  Copy,
  Trash2,
  CalendarPlus,
  Minus,
  Plus,
  Star,
  ExternalLink,
} from "lucide-react";
import { useApp } from "@/features/app-provider";
import { RecipeImage } from "@/components/recipes/recipe-card";
import { NutritionSummary } from "@/components/nutrition/nutrition-summary";
import { EmptyState } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { scaleIngredients, ingredientNutrition } from "@/services/nutrition";
import { formatNumber } from "@/lib/utils";
import type { Recipe } from "@/types";
function Detail({ recipe }: { recipe: Recipe }) {
  const { personal, saveRecipe, deleteRecipe, toast } = useApp();
  const router = useRouter();
  const [servings, setServings] = useState(recipe.servings),
    [checked, setChecked] = useState<string[]>([]),
    [total, setTotal] = useState(false),
    [notes, setNotes] = useState(recipe.notes),
    [rating, setRating] = useState(recipe.rating),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false);
  const ingredients = scaleIngredients(
    recipe.ingredients,
    recipe.servings,
    servings,
  );
  async function duplicate() {
    setBusy(true);
    try {
      const id = crypto.randomUUID();
      await saveRecipe({
        ...recipe,
        id,
        title: `${recipe.title} (copy)`,
        createdAt: new Date().toISOString(),
        favourite: false,
        notes: "",
        rating: 0,
        ingredients: recipe.ingredients.map((i) => ({
          ...i,
          id: crypto.randomUUID(),
        })),
      });
      router.push(`/recipes/${id}/edit`);
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await deleteRecipe(recipe.id);
      router.push("/recipes");
    } catch (e) {
      toast((e as Error).message);
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-enter recipe-detail">
      <Link href="/recipes" className="back-link">
        <ArrowLeft size={16} />
        Back to your recipe book
      </Link>
      <div className="detail-hero">
        <RecipeImage recipe={recipe} />
        <div className="detail-hero-overlay" />
        <div className="detail-hero-copy">
          <span className="pill">
            {recipe.category}
            {recipe.status === "draft" ? " · Draft" : ""}
          </span>
          <h1>{recipe.title}</h1>
          <p>{recipe.description}</p>
        </div>
        <button
          className={`favourite-button ${recipe.favourite ? "is-favourite" : ""}`}
          aria-label="Favourite recipe"
          aria-pressed={recipe.favourite}
          onClick={() =>
            personal(recipe.id, { favourite: !recipe.favourite }).catch((e) =>
              toast(e.message),
            )
          }
        >
          <Heart size={21} fill={recipe.favourite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="detail-toolbar">
        <div className="detail-times">
          <span>
            <Clock size={17} />
            {recipe.prepMinutes} min prep
          </span>
          <span>{recipe.cookMinutes} min cook</span>
          <span>{recipe.prepMinutes + recipe.cookMinutes} min total</span>
          <span>
            <Users size={16} />
            {recipe.servings} servings
          </span>
        </div>
        <div className="detail-actions">
          <Link
            href={`/recipes/${recipe.id}/edit`}
            className="btn btn-secondary btn-sm"
          >
            <Pencil size={15} />
            Edit
          </Link>
          <button
            className="icon-button"
            disabled={busy}
            aria-label="Duplicate recipe"
            onClick={() => void duplicate()}
          >
            <Copy size={18} />
          </button>
          <button
            className="icon-button danger"
            aria-label="Delete recipe"
            onClick={() => setConfirm(true)}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      <div className="detail-tag-row">
        {recipe.tags.map((t) => (
          <span className="pill" key={t}>
            {t}
          </span>
        ))}
        <span className="muted">
          By{" "}
          {(recipe.author === "PrepBook sample kitchen"
            ? "Our Table sample kitchen"
            : recipe.author) || "Your kitchen"}
        </span>
      </div>
      <div className="detail-columns">
        <div>
          <section className="detail-section">
            <div className="section-heading compact">
              <h2>What goes in.</h2>
              <div className="serving-selector">
                <button
                  aria-label="Fewer servings"
                  disabled={servings <= 0.5}
                  onClick={() => {
                    setServings(Math.max(0.5, servings - 1));
                    setChecked([]);
                  }}
                >
                  <Minus size={14} />
                </button>
                <label>
                  <input
                    aria-label="Batch servings"
                    type="number"
                    min="0.1"
                    max="1000"
                    step="any"
                    value={servings}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      if (n > 0 && n <= 1000) {
                        setServings(n);
                        setChecked([]);
                      }
                    }}
                  />
                  <span>servings</span>
                </label>
                <button
                  aria-label="More servings"
                  disabled={servings >= 1000}
                  onClick={() => {
                    setServings(Math.min(1000, servings + 1));
                    setChecked([]);
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
            <p className="muted small-text">
              Quantities and batch nutrition scale together. One serving keeps
              the same proportions.
            </p>
            <ul className="ingredient-checklist">
              {ingredients.map((i) => {
                const n = ingredientNutrition(i);
                return (
                  <li key={i.id}>
                    <label className={checked.includes(i.id) ? "checked" : ""}>
                      <input
                        type="checkbox"
                        checked={checked.includes(i.id)}
                        onChange={(e) =>
                          setChecked(
                            e.target.checked
                              ? [...checked, i.id]
                              : checked.filter((v) => v !== i.id),
                          )
                        }
                      />
                      <span>
                        <strong>
                          {formatNumber(i.quantity)} {i.unit}
                        </strong>{" "}
                        {i.name}
                        <small>
                          {i.food
                            ? `${i.food.source} · ${i.food.state} · ${formatNumber(n.calories, 0)} kcal · ${formatNumber(n.protein)} g protein`
                            : "Nutrition not linked"}
                          {i.gramEquivalent !== null
                            ? ` · ${formatNumber(i.gramEquivalent)} g equivalent`
                            : ""}
                        </small>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="detail-section">
            <div className="section-heading compact">
              <h2>Let’s make it.</h2>
              <Link href={`/recipes/${recipe.id}/cook`} className="text-link">
                <ChefHat size={17} />
                Cooking mode
              </Link>
            </div>
            <ol className="instructions-list">
              {recipe.instructions.map((s, i) => (
                <li key={i}>
                  <span className="step-number">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p>{s}</p>
                </li>
              ))}
            </ol>
            {!recipe.instructions.length && (
              <p className="muted">
                This draft is waiting for its first instruction.
              </p>
            )}
          </section>
          <section className="detail-section">
            <h2>Your kitchen notes.</h2>
            <p className="muted small-text">
              Only you can see these notes and your rating.
            </p>
            <div
              className="rating-control"
              role="group"
              aria-label="Personal recipe rating"
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  aria-label={`Rate ${i} stars`}
                  aria-pressed={rating === i}
                  onClick={() => setRating(rating === i ? 0 : i)}
                >
                  <Star
                    size={23}
                    fill={rating >= i ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
            <textarea
              aria-label="Personal cooking notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="A little extra lemon? A new family favourite?"
            />
            <Button
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await personal(recipe.id, { notes, rating });
                  toast("Your notes are saved.");
                } catch (e) {
                  toast((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Save my notes
            </Button>
          </section>
        </div>
        <aside>
          <div className="detail-side-actions">
            <Link
              className="btn btn-primary"
              href={`/recipes/${recipe.id}/cook`}
            >
              <ChefHat size={18} />
              Let’s get cooking
            </Link>
            <Link
              className="btn btn-secondary"
              href={`/meal-prep?recipe=${recipe.id}`}
            >
              <CalendarPlus size={17} />
              Add to meal prep
            </Link>
          </div>
          <div className="segmented">
            <button
              className={!total ? "selected" : ""}
              onClick={() => setTotal(false)}
            >
              Per serving
            </button>
            <button
              className={total ? "selected" : ""}
              onClick={() => setTotal(true)}
            >
              Whole batch
            </button>
          </div>
          <NutritionSummary
            ingredients={ingredients}
            servings={total ? 1 : servings}
            label={
              total
                ? `${formatNumber(servings)}-serving batch`
                : "One recipe serving"
            }
          />
          <section className="storage-card">
            <span className="eyebrow">SAVE SOME FOR LATER</span>
            <h3>Keep it good.</h3>
            {[
              ["Storage", recipe.storage],
              ["Reheat", recipe.reheat],
              ["Freeze", recipe.freezing],
            ].map(([label, text]) => (
              <div key={label}>
                <strong>{label}</strong>
                <p>{text || "No guidance added yet."}</p>
              </div>
            ))}
            <span className="pill">
              {recipe.fridgeDays === null
                ? "Refrigerated period unknown"
                : `${recipe.fridgeDays} refrigerated days`}{" "}
              · {recipe.guidanceSource}
            </span>
            {recipe.guidanceUrl && (
              <a
                href={recipe.guidanceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Guidance source <ExternalLink size={12} />
              </a>
            )}
          </section>
          {recipe.sourceUrl && (
            <a
              className="source-attribution"
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              View original recipe <ExternalLink size={13} />
            </a>
          )}
          <p className="muted small-text">
            Added {new Date(recipe.createdAt).toLocaleDateString("en-NZ")}
            <br />
            Updated {new Date(recipe.updatedAt).toLocaleDateString("en-NZ")}
          </p>
        </aside>
      </div>
      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Remove this recipe?"
        description="This removes the shared recipe for everyone in your household. Personal notes will also be removed."
      >
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Keep recipe
          </Button>
          <Button
            variant="destructive"
            disabled={busy}
            onClick={() => void remove()}
          >
            {busy ? "Removing…" : "Delete recipe"}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
export default function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data } = useApp();
  const recipe = data.recipes.find((r) => r.id === id);
  return recipe ? (
    <Detail recipe={recipe} key={recipe.id} />
  ) : (
    <EmptyState
      title="Recipe not found"
      description="This recipe may have been removed or belong to another household."
      href="/recipes"
      action="Back to recipes"
    />
  );
}
