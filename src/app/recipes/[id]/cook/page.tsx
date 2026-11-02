"use client";
import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChefHat,
  List,
  Timer,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { useApp } from "@/features/app-provider";
import { EmptyState, LoadingSkeleton } from "@/components/ui/states";
import { Button } from "@/components/ui/button";
import type { Recipe } from "@/types";
function CookingMode({ recipe }: { recipe: Recipe }) {
  const { data } = useApp();
  const key = `prepbook-cooking:${data.profile.id}:${recipe.id}`;
  const [step, setStep] = useState(0),
    [checked, setChecked] = useState<string[]>([]),
    [ready, setReady] = useState(false),
    [all, setAll] = useState(false),
    [minutes, setMinutes] = useState(5),
    [deadline, setDeadline] = useState<number | null>(null),
    [remaining, setRemaining] = useState(300),
    [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const v = JSON.parse(stored);
        setStep(Math.min(v.step, Math.max(0, recipe.instructions.length - 1)));
        setChecked(v.checked || []);
        setRemaining(v.remaining ?? 300);
        setDeadline(v.deadline ?? null);
      }
    } catch {
      /* A fresh cooking session is safe. */
    }
    setReady(true);
  }, [key, recipe.instructions.length]);
  useEffect(() => {
    if (ready)
      sessionStorage.setItem(
        key,
        JSON.stringify({ step, checked, remaining, deadline }),
      );
  }, [key, step, checked, ready, remaining, deadline]);
  useEffect(() => {
    if (deadline === null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [deadline]);
  const seconds =
    deadline === null
      ? remaining
      : Math.max(0, Math.ceil((deadline - now) / 1000));
  const finished = deadline !== null && seconds === 0;
  if (!recipe.instructions.length)
    return (
      <EmptyState
        title="This recipe needs a few steps"
        description="Add instructions before entering cooking mode."
        href={`/recipes/${recipe.id}/edit`}
        action="Edit recipe"
      />
    );
  return (
    <main id="main-content" className="cooking-mode">
      <header className="cooking-header">
        <Link href={`/recipes/${recipe.id}`}>
          <ArrowLeft size={18} />
          Back to recipe
        </Link>
        <span>
          <ChefHat size={20} />
          Cooking mode
        </span>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setAll(!all)}
        >
          <List size={16} />
          {all ? "One step" : "All steps"}
        </button>
      </header>
      <div className="cooking-title">
        <span className="eyebrow">A LITTLE FOCUS. SOMETHING DELICIOUS.</span>
        <h1>{recipe.title}</h1>
      </div>
      <div className="cooking-progress">
        <span
          style={{
            width: `${((step + 1) / recipe.instructions.length) * 100}%`,
          }}
        />
      </div>
      <div className="cooking-layout">
        <aside>
          <h2>Ready on the counter</h2>
          <p className="muted">For {recipe.servings} servings</p>
          {recipe.ingredients.map((i) => (
            <label
              className={`cooking-ingredient ${checked.includes(i.id) ? "checked" : ""}`}
              key={i.id}
            >
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
                {i.quantity} {i.unit} {i.name}
              </span>
            </label>
          ))}
          <div className={`cooking-timer ${finished ? "timer-finished" : ""}`}>
            <span className="eyebrow">
              <Timer size={15} />
              KITCHEN TIMER
            </span>
            <strong role="timer" aria-live={finished ? "assertive" : "off"}>
              {finished
                ? "Time’s up"
                : `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`}
            </strong>
            <label>
              Minutes
              <input
                type="number"
                min="1"
                max="240"
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
              />
            </label>
            <div>
              <Button
                size="sm"
                onClick={() => {
                  if (deadline !== null) {
                    setRemaining(seconds);
                    setDeadline(null);
                  } else {
                    const duration =
                      remaining === 300
                        ? Math.min(240, Math.max(1, minutes || 1)) * 60
                        : remaining;
                    setNow(Date.now());
                    setDeadline(Date.now() + duration * 1000);
                  }
                }}
              >
                {deadline !== null ? <Pause size={15} /> : <Play size={15} />}{" "}
                {deadline !== null ? "Pause" : "Start"}
              </Button>
              <button
                className="icon-button"
                aria-label="Reset timer"
                onClick={() => {
                  setDeadline(null);
                  setRemaining(Math.min(240, Math.max(1, minutes || 1)) * 60);
                }}
              >
                <RotateCcw size={17} />
              </button>
            </div>
            <small>The timer works while this cooking screen is open.</small>
          </div>
        </aside>
        <section className="cooking-step">
          {all ? (
            <ol className="all-cooking-steps">
              {recipe.instructions.map((s, i) => (
                <li key={i}>
                  <span>STEP {i + 1}</span>
                  <p>{s}</p>
                </li>
              ))}
            </ol>
          ) : (
            <>
              <span className="eyebrow">
                STEP {String(step + 1).padStart(2, "0")} OF{" "}
                {String(recipe.instructions.length).padStart(2, "0")}
              </span>
              <p className="current-instruction">{recipe.instructions[step]}</p>
              <div className="step-navigation">
                <Button
                  variant="secondary"
                  disabled={step === 0}
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft size={18} />
                  Previous
                </Button>
                {step === recipe.instructions.length - 1 ? (
                  <Link
                    href={`/recipes/${recipe.id}`}
                    className="btn btn-primary"
                  >
                    <Check size={18} />
                    All done
                  </Link>
                ) : (
                  <Button onClick={() => setStep(step + 1)}>
                    Next step
                    <ArrowRight size={18} />
                  </Button>
                )}
              </div>
            </>
          )}
          <p className="muted small-text">
            Your progress stays saved for this browser session.
          </p>
        </section>
      </div>
    </main>
  );
}
export default function CookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, loading } = useApp();
  if (loading) return <LoadingSkeleton />;
  const recipe = data.recipes.find((r) => r.id === id);
  return recipe ? (
    <CookingMode recipe={recipe} />
  ) : (
    <EmptyState
      title="Recipe not found"
      href="/recipes"
      action="Back to recipes"
    />
  );
}
