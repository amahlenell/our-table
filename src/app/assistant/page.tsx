"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowUp, Leaf, ChefHat } from "lucide-react";
import { useApp, api } from "@/features/app-provider";
import { blankRecipe } from "@/features/demo";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { Button } from "@/components/ui/button";
import type { Recipe } from "@/types";
const ideas = [
  "A high-protein breakfast with eggs and broccoli",
  "What can I make with chicken, mozzarella, and vegetables?",
  "A vegetarian dinner that reheats well",
  "Turn my rough cooking notes into a recipe",
];
export default function Assistant() {
  const { demo } = useApp();
  const router = useRouter();
  const [prompt, setPrompt] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [draft, setDraft] = useState<Recipe | null>(null),
    [selected, setSelected] = useState("");
  const { data } = useApp();
  async function generate() {
    setBusy(true);
    setError("");
    try {
      if (demo)
        throw new Error(
          "AI drafting needs a connected account, OPENAI_API_KEY and AI_MODEL. You can still write recipes and plan meals in this demo.",
        );
      const base = data.recipes.find((r) => r.id === selected);
      const context = base
        ? `\nAdapt this existing recipe into a NEW draft. Never overwrite it. ${JSON.stringify({ title: base.title, ingredients: base.ingredients.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit })), instructions: base.instructions })}`
        : "";
      const result = await api<Partial<Recipe>>("ai", {
        prompt: prompt + context,
      });
      setDraft({
        ...blankRecipe(),
        ...result,
        ingredients: (result.ingredients || []).map((i) => ({
          ...i,
          id: crypto.randomUUID(),
          food: null,
          gramEquivalent: null,
        })),
        author: "AI-assisted draft",
        status: "draft",
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (draft)
    return (
      <>
        <div className="callout">
          Review this AI draft before saving. Nutrition is unlinked. Calorie and
          protein targets have not been verified. Your original recipe remains
          unchanged.
        </div>
        <RecipeForm initial={draft} />
        <Button
          variant="ghost"
          onClick={() => {
            setDraft(null);
            router.refresh();
          }}
        >
          Back to assistant
        </Button>
      </>
    );
  return (
    <div className="page-enter assistant-page">
      <div className="assistant-mark">
        <Sparkles size={27} />
      </div>
      <span className="eyebrow">A LITTLE HELP IN THE KITCHEN</span>
      <h1>
        Good ideas
        <br />
        <em>start with what you have.</em>
      </h1>
      <p>
        Tell me what’s in your fridge, what you’re craving,
        <br className="desktop-break" /> or how you’d like to make a recipe your
        own.
      </p>
      <form
        className="assistant-prompt"
        onSubmit={(e) => {
          e.preventDefault();
          void generate();
        }}
      >
        <textarea
          aria-label="Recipe idea"
          required
          minLength={10}
          maxLength={3000}
          rows={4}
          placeholder="I have chicken, broccoli, eggs, and a little mozzarella…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <div>
          <span>
            <Leaf size={14} />
            Made for your everyday kitchen
          </span>
          <Button
            size="icon"
            aria-label="Generate recipe draft"
            disabled={busy || prompt.trim().length < 10}
          >
            {busy ? <span className="spinner" /> : <ArrowUp size={22} />}
          </Button>
        </div>
      </form>
      <label className="adapt-recipe">
        Adapt a recipe from your book (optional)
        <select value={selected} onChange={(e) => setSelected(e.target.value)}>
          <option value="">Start with a new idea</option>
          {data.recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="idea-grid">
        {ideas.map((idea, i) => (
          <button key={idea} onClick={() => setPrompt(idea)}>
            <span>
              {i === 0 ? (
                <ChefHat size={18} />
              ) : i === 1 ? (
                <Leaf size={18} />
              ) : (
                <Sparkles size={18} />
              )}
            </span>
            {idea}
          </button>
        ))}
      </div>
      <p className="assistant-footnote">
        Every idea becomes an editable draft. You review it before it joins your
        recipe book.
        <br />
        Nutrition is calculated from food records, never guessed by AI.
      </p>
    </div>
  );
}
