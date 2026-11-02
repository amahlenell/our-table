"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ImagePlus,
  Link2,
  Sparkles,
  Save,
} from "lucide-react";
import { useApp, api } from "@/features/app-provider";
import { blankRecipe } from "@/features/demo";
import { categories, type Recipe } from "@/types";
import { Button } from "@/components/ui/button";
import { IngredientEditor } from "./ingredient-editor";
import { NutritionSummary } from "@/components/nutrition/nutrition-summary";
export function RecipeForm({ initial }: { initial?: Recipe }) {
  const router = useRouter();
  const { saveRecipe, demo, data, toast } = useApp();
  const [recipe, setRecipe] = useState<Recipe>(
    () => initial || { ...blankRecipe(), author: data.profile.name },
  );
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [method, setMethod] = useState("manual"),
    [url, setUrl] = useState(""),
    [prompt, setPrompt] = useState(""),
    [review, setReview] = useState("");
  const [tagsInput, setTagsInput] = useState(initial?.tags.join(", ") || "");
  function patch(p: Partial<Recipe>) {
    setRecipe((old) => ({ ...old, ...p }));
  }
  async function save(status: Recipe["status"]) {
    setBusy(true);
    setError("");
    try {
      await saveRecipe({
        ...recipe,
        tags: [
          ...new Set(
            tagsInput
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean),
          ),
        ],
        title:
          recipe.title.trim() || (status === "draft" ? "Untitled recipe" : ""),
        status,
        ingredients:
          status === "draft"
            ? recipe.ingredients.filter((i) => i.name.trim())
            : recipe.ingredients,
        instructions: recipe.instructions.filter((s) => s.trim()),
      });
      router.push(`/recipes/${recipe.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function draft() {
    setBusy(true);
    setError("");
    try {
      if (demo)
        throw new Error(
          `${method === "import" ? "Recipe importing" : "AI drafting"} needs a connected account and service configuration. Manual entry works in this demo.`,
        );
      const result = await api<Partial<Recipe>>(
        method === "import" ? "import" : "ai",
        method === "import" ? { url } : { prompt },
      );
      const ingredients = (result.ingredients || []).map((i) => ({
        ...i,
        id: crypto.randomUUID(),
        food: null,
        gramEquivalent: null,
      }));
      patch({ ...result, ingredients, status: "draft" });
      setTagsInput(result.tags?.join(", ") || "");
      setReview(
        method === "import"
          ? "Imported draft: ingredient text is preserved verbatim. Review quantities and units, attribution and every step before saving. Images are not copied without permission."
          : "AI draft: review all ingredients, quantities and instructions. Nutrition targets are unverified until real food records are linked.",
      );
      setMethod("manual");
      toast("Draft ready for your review. Nothing has been saved.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function photo(file: File) {
    setBusy(true);
    setError("");
    try {
      if (
        file.size > 4 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(file.type)
      )
        throw new Error("Choose a JPEG, PNG or WebP photo up to 4 MB.");
      if (demo) {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        const ratio = Math.min(1, 1000 / Math.max(bitmap.width, bitmap.height));
        canvas.width = bitmap.width * ratio;
        canvas.height = bitmap.height * ratio;
        canvas
          .getContext("2d")!
          .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        patch({ image: canvas.toDataURL("image/jpeg", 0.75), imagePath: "" });
        bitmap.close();
      } else {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/images", {
          method: "POST",
          body: form,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        patch(result);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-enter editor-page">
      <Link
        className="back-link"
        href={initial ? `/recipes/${initial.id}` : "/recipes"}
      >
        <ArrowLeft size={16} />
        Back to your recipes
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">A PLACE IN YOUR RECIPE BOOK</span>
          <h1>
            {initial ? "A little refinement." : "Something worth saving."}
          </h1>
          <p>
            {initial
              ? "Make this recipe feel a little more like you."
              : "Start from scratch, a favourite website, or a little inspiration."}
          </p>
        </div>
      </div>
      <div className="method-tabs">
        {[
          { id: "manual", label: "Write a recipe", icon: Save },
          { id: "import", label: "Import from a link", icon: Link2 },
          { id: "ai", label: "Create with AI", icon: Sparkles },
        ].map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            key={id}
            className={method === id ? "selected" : ""}
            onClick={() => {
              setMethod(id);
              setError("");
            }}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
      {error && (
        <div className="form-error" role="alert">
          {error}
        </div>
      )}
      {review && <div className="callout">{review}</div>}
      {method !== "manual" ? (
        <section className="form-section source-panel">
          <span className="eyebrow">
            {method === "import"
              ? "BRING YOUR FAVOURITES HOME"
              : "YOUR KITCHEN, A LITTLE MORE CREATIVE"}
          </span>
          <h2>
            {method === "import"
              ? "Found something delicious?"
              : "What would you like to cook?"}
          </h2>
          <p className="muted">
            {method === "import"
              ? "We’ll look for structured recipe data and bring back an editable draft with attribution."
              : "Tell us your ingredients, preferences, or the changes you’d like to make."}
          </p>
          {method === "import" ? (
            <label>
              Recipe URL
              <input
                type="url"
                placeholder="https://…"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </label>
          ) : (
            <label>
              Your recipe idea
              <textarea
                rows={5}
                placeholder="A high-protein breakfast with eggs, broccoli, and cottage cheese…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </label>
          )}
          <Button
            disabled={busy || (method === "import" ? !url : prompt.length < 10)}
            onClick={() => void draft()}
          >
            {busy ? "Preparing your draft…" : "Create an editable draft"}
          </Button>
        </section>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save("published");
          }}
        >
          <div className="editor-columns">
            <div className="editor-main">
              <section className="form-section">
                <h2>The essentials</h2>
                <label>
                  Recipe name
                  <input
                    required
                    maxLength={160}
                    value={recipe.title}
                    onChange={(e) => patch({ title: e.target.value })}
                    placeholder="Give it a name you’ll remember"
                  />
                </label>
                <label>
                  A few words about it
                  <textarea
                    rows={3}
                    value={recipe.description}
                    onChange={(e) => patch({ description: e.target.value })}
                    placeholder="What makes this one special?"
                  />
                </label>
                <div className="form-grid">
                  <label>
                    Category
                    <select
                      value={recipe.category}
                      onChange={(e) =>
                        patch({
                          category: e.target.value as Recipe["category"],
                        })
                      }
                    >
                      {categories.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Tags, separated by commas
                    <input
                      value={tagsInput}
                      onChange={(e) => setTagsInput(e.target.value)}
                      placeholder="Meal prep, Vegetarian"
                    />
                  </label>
                </div>
                <div className="form-grid three">
                  <label>
                    Prep time (min)
                    <input
                      type="number"
                      min="0"
                      required
                      value={recipe.prepMinutes}
                      onChange={(e) =>
                        patch({ prepMinutes: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Cook time (min)
                    <input
                      type="number"
                      min="0"
                      required
                      value={recipe.cookMinutes}
                      onChange={(e) =>
                        patch({ cookMinutes: Number(e.target.value) })
                      }
                    />
                  </label>
                  <label>
                    Servings
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      required
                      value={recipe.servings}
                      onChange={(e) =>
                        patch({ servings: Number(e.target.value) })
                      }
                    />
                  </label>
                </div>
              </section>
              <section className="form-section">
                <h2>Good things go in.</h2>
                <p className="muted">
                  Link an ingredient to USDA or your own food label for
                  nutrition.
                </p>
                <IngredientEditor
                  value={recipe.ingredients}
                  onChange={(ingredients) => patch({ ingredients })}
                />
              </section>
              <section className="form-section">
                <h2>Make it, step by step.</h2>
                {recipe.instructions.map((step, index) => (
                  <div className="instruction-edit" key={index}>
                    <span className="step-number">{index + 1}</span>
                    <textarea
                      aria-label={`Instruction ${index + 1}`}
                      rows={3}
                      value={step}
                      onChange={(e) =>
                        patch({
                          instructions: recipe.instructions.map((s, i) =>
                            i === index ? e.target.value : s,
                          ),
                        })
                      }
                    />
                    <div>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Remove step ${index + 1}`}
                        onClick={() =>
                          patch({
                            instructions: recipe.instructions.filter(
                              (_, i) => i !== index,
                            ),
                          })
                        }
                      >
                        <Trash2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Move step ${index + 1} up`}
                        disabled={index === 0}
                        onClick={() => {
                          const a = [...recipe.instructions];
                          [a[index], a[index - 1]] = [a[index - 1], a[index]];
                          patch({ instructions: a });
                        }}
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Move step ${index + 1} down`}
                        disabled={index === recipe.instructions.length - 1}
                        onClick={() => {
                          const a = [...recipe.instructions];
                          [a[index], a[index + 1]] = [a[index + 1], a[index]];
                          patch({ instructions: a });
                        }}
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() =>
                    patch({ instructions: [...recipe.instructions, ""] })
                  }
                >
                  <Plus size={16} />
                  Add a step
                </Button>
              </section>
              <section className="form-section">
                <h2>For another day.</h2>
                <label>
                  Storage recommendations
                  <textarea
                    value={recipe.storage}
                    onChange={(e) => patch({ storage: e.target.value })}
                  />
                </label>
                <div className="form-grid">
                  <label>
                    Refrigerated days (unknown if blank)
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={recipe.fridgeDays ?? ""}
                      onChange={(e) =>
                        patch({
                          fridgeDays:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    Guidance source
                    <select
                      value={recipe.guidanceSource}
                      onChange={(e) =>
                        patch({
                          guidanceSource: e.target
                            .value as Recipe["guidanceSource"],
                        })
                      }
                    >
                      <option>User entered</option>
                      <option>Verified source</option>
                    </select>
                  </label>
                </div>
                {recipe.guidanceSource === "Verified source" && (
                  <label>
                    Guidance source URL
                    <input
                      required
                      type="url"
                      value={recipe.guidanceUrl}
                      onChange={(e) => patch({ guidanceUrl: e.target.value })}
                    />
                  </label>
                )}
                <label>
                  Reheating notes
                  <textarea
                    value={recipe.reheat}
                    onChange={(e) => patch({ reheat: e.target.value })}
                  />
                </label>
                <label>
                  Freezing information
                  <textarea
                    value={recipe.freezing}
                    onChange={(e) => patch({ freezing: e.target.value })}
                  />
                </label>
              </section>
              <section className="form-section">
                <h2>Where it came from</h2>
                <label>
                  Author or source
                  <input
                    value={recipe.author}
                    onChange={(e) => patch({ author: e.target.value })}
                  />
                </label>
                <label>
                  Original recipe URL
                  <input
                    type="url"
                    value={recipe.sourceUrl}
                    onChange={(e) => patch({ sourceUrl: e.target.value })}
                  />
                </label>
              </section>
            </div>
            <aside className="editor-aside">
              <section className="form-section">
                <h3>A picture of something good.</h3>
                <label className="photo-upload">
                  {recipe.image ? (
                    <img src={recipe.image} alt="Recipe photo preview" />
                  ) : (
                    <>
                      <ImagePlus size={30} />
                      <span>Add your own photo</span>
                      <small>JPEG, PNG or WebP · up to 4 MB</small>
                    </>
                  )}
                  <input
                    aria-label="Upload recipe photo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) =>
                      e.target.files?.[0] && void photo(e.target.files[0])
                    }
                  />
                </label>
                {recipe.image && (
                  <button
                    className="text-link"
                    type="button"
                    onClick={() => patch({ image: "", imagePath: "" })}
                  >
                    Remove photo
                  </button>
                )}
              </section>
              <NutritionSummary
                ingredients={recipe.ingredients}
                servings={recipe.servings || 1}
              />
              <p className="muted small-text">
                A recipe can be saved as a draft while you’re still working on
                it. Imported and AI content is only saved when you choose.
              </p>
            </aside>
          </div>
          <div className="editor-actions">
            <Link href="/recipes" className="btn btn-ghost">
              Cancel
            </Link>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void save("draft")}
            >
              Save draft
            </Button>
            <Button disabled={busy}>
              {busy ? "Saving…" : "Save recipe"}
              <Save size={16} />
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
