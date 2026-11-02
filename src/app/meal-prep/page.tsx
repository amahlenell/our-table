"use client";
import { useState, useEffect, useRef } from "react";
import {
  Plus,
  CalendarDays,
  Printer,
  Trash2,
  Snowflake,
  AlertCircle,
  Users,
  Clock,
} from "lucide-react";
import { useApp } from "@/features/app-provider";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  portions,
  batchIngredients,
  storageWarnings,
  addDays,
} from "@/services/planner";
import { formatNumber, dateLabel, localDate } from "@/lib/utils";
import type { MealPlan, PlanEntry } from "@/types";
const freshPlan = (): MealPlan => ({
  id: crypto.randomUUID(),
  title: "A few good days",
  startDate: localDate(),
  days: 3,
  entries: [],
});
export default function MealPrep() {
  const handledLink = useRef(false);
  const { data, savePlan, deletePlan, toast } = useApp();
  const [plan, setPlan] = useState<MealPlan>(
      () => data.plans[0] || freshPlan(),
    ),
    [adding, setAdding] = useState(false),
    [recipeId, setRecipeId] = useState(
      data.recipes.find((r) => r.status === "published")?.id || "",
    ),
    [slot, setSlot] = useState<PlanEntry["slot"]>("Lunch"),
    [repeat, setRepeat] = useState(true),
    [day, setDay] = useState(0),
    [personPortions, setPersonPortions] = useState<Record<string, number>>(() =>
      Object.fromEntries(data.members.map((m) => [m.id, 1])),
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [confirm, setConfirm] = useState(false);
  useEffect(() => {
    const recipe = new URLSearchParams(window.location.search).get("recipe");
    if (
      !handledLink.current &&
      recipe &&
      data.recipes.some((r) => r.id === recipe)
    ) {
      handledLink.current = true;
      setRecipeId(recipe);
      setAdding(true);
    }
  }, [data.recipes]);
  const total = portions(plan),
    batch = batchIngredients(plan, data.recipes),
    warnings = [...new Set(storageWarnings(plan, data.recipes))],
    selected = data.recipes.filter((r) =>
      plan.entries.some((e) => e.recipeId === r.id),
    );
  function addMeal() {
    if (!recipeId || Object.values(personPortions).every((n) => n <= 0)) return;
    const days = repeat
      ? Array.from({ length: plan.days }, (_, i) => i)
      : [day];
    setPlan({
      ...plan,
      entries: [
        ...plan.entries,
        ...days.map((i) => ({
          id: crypto.randomUUID(),
          date: addDays(plan.startDate, i),
          recipeId,
          slot,
          frozen: false,
          portions: { ...personPortions },
        })),
      ],
    });
    setAdding(false);
  }
  function updateEntry(id: string, p: Partial<PlanEntry>) {
    setPlan({
      ...plan,
      entries: plan.entries.map((e) => (e.id === id ? { ...e, ...p } : e)),
    });
  }
  async function save() {
    setBusy(true);
    setError("");
    try {
      await savePlan(plan);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="page-enter meal-prep-page">
      <div className="page-heading no-print">
        <div>
          <span className="eyebrow">YOUR NEXT FEW DAYS, TAKEN CARE OF</span>
          <h1>
            A little planning.
            <br className="mobile-only" />
            <em> A lighter week.</em>
          </h1>
          <p>
            Good meals, the right portions, and one less thing to think about.
          </p>
        </div>
        <Button
          onClick={() => {
            setPlan(freshPlan());
            setError("");
          }}
          variant="secondary"
        >
          <Plus size={16} />
          New plan
        </Button>
      </div>
      {data.plans.length > 0 && (
        <label className="saved-plan-select no-print">
          Your saved plans
          <select
            aria-label="Choose saved meal plan"
            value={data.plans.some((p) => p.id === plan.id) ? plan.id : ""}
            onChange={(e) => {
              const p = data.plans.find((p) => p.id === e.target.value);
              if (p) setPlan(structuredClone(p));
            }}
          >
            <option value="">Unsaved plan</option>
            {data.plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} · {dateLabel(p.startDate)}
              </option>
            ))}
          </select>
        </label>
      )}
      <section className="plan-settings">
        <label>
          Plan name
          <input
            aria-label="Plan name"
            value={plan.title}
            onChange={(e) => setPlan({ ...plan, title: e.target.value })}
          />
        </label>
        <label>
          Prep / start date
          <input
            type="date"
            value={plan.startDate}
            onChange={(e) => {
              if (!e.target.value) return;
              const previous = plan.startDate;
              setPlan({
                ...plan,
                startDate: e.target.value,
                entries: plan.entries.map((v) => ({
                  ...v,
                  date: addDays(
                    e.target.value,
                    Math.round(
                      (Date.parse(v.date) - Date.parse(previous)) / 86400000,
                    ),
                  ),
                })),
              });
            }}
          />
        </label>
        <label>
          Days ahead
          <select
            value={plan.days}
            onChange={(e) => {
              const days = Number(e.target.value) as 3 | 4 | 5;
              setPlan({
                ...plan,
                days,
                entries: plan.entries.filter(
                  (v) => v.date < addDays(plan.startDate, days),
                ),
              });
            }}
          >
            <option value="3">3 days</option>
            <option value="4">4 days</option>
            <option value="5">5 days</option>
          </select>
        </label>
      </section>
      <div className="plan-overview">
        <div>
          <Users size={20} />
          <strong>{formatNumber(total)}</strong>
          <span>total portions</span>
        </div>
        <div>
          <CalendarDays size={20} />
          <strong>{plan.days}</strong>
          <span>days prepared</span>
        </div>
        <div>
          <Clock size={20} />
          <strong>
            {selected.reduce((s, r) => s + r.prepMinutes + r.cookMinutes, 0)}{" "}
            min
          </strong>
          <span>recipe times, once per batch</span>
        </div>
      </div>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="section-heading">
        <h2>
          {plan.title}
          <span className="heading-dot">.</span>
        </h2>
        <Button
          disabled={!data.recipes.some((r) => r.status === "published")}
          onClick={() => setAdding(true)}
        >
          <Plus size={16} />
          Add a meal
        </Button>
      </div>
      {!data.recipes.some((r) => r.status === "published") && (
        <p className="callout">
          Save a recipe with ingredients and instructions to begin planning.
        </p>
      )}
      <div
        className="meal-calendar"
        style={{ "--days": plan.days } as React.CSSProperties}
      >
        {Array.from({ length: plan.days }, (_, i) => {
          const date = addDays(plan.startDate, i),
            entries = plan.entries.filter((e) => e.date === date);
          return (
            <section className="meal-day" key={date}>
              <div className="meal-day-header">
                <span>DAY {i + 1}</span>
                <h3>{dateLabel(date)}</h3>
              </div>
              {entries.map((e) => {
                const r = data.recipes.find((r) => r.id === e.recipeId);
                return (
                  <div className="meal-entry" key={e.id}>
                    <div className="meal-entry-slot">
                      {e.slot}
                      <button
                        className="icon-button no-print"
                        aria-label={`Remove ${r?.title} on ${date}`}
                        onClick={() =>
                          setPlan({
                            ...plan,
                            entries: plan.entries.filter((v) => v.id !== e.id),
                          })
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <h4>{r?.title || "Recipe unavailable"}</h4>
                    {data.members.map((m) => (
                      <label className="portion-input" key={m.id}>
                        {m.name}
                        <input
                          aria-label={`${m.name} portions ${r?.title} ${date}`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.25"
                          value={e.portions[m.id] ?? 0}
                          onChange={(v) =>
                            updateEntry(e.id, {
                              portions: {
                                ...e.portions,
                                [m.id]: Number(v.target.value),
                              },
                            })
                          }
                        />
                      </label>
                    ))}
                    <label className="frozen-check">
                      <input
                        type="checkbox"
                        checked={e.frozen}
                        onChange={(v) =>
                          updateEntry(e.id, { frozen: v.target.checked })
                        }
                      />
                      <Snowflake size={13} />
                      Frozen portion
                    </label>
                  </div>
                );
              })}
              {!entries.length && (
                <button
                  className="empty-day no-print"
                  onClick={() => {
                    setDay(i);
                    setRepeat(false);
                    setAdding(true);
                  }}
                >
                  <Plus size={19} />
                  <span>Add something good</span>
                </button>
              )}
            </section>
          );
        })}
      </div>
      {warnings.length > 0 && (
        <section className="storage-warnings" role="status">
          <h3>
            <AlertCircle size={18} />A note on keeping things good
          </h3>
          {warnings.map((w) => (
            <p key={w}>{w}</p>
          ))}
          <small>
            Guidance is recipe-specific and may be user entered. Frozen portions
            need suitable freezing and reheating guidance.
          </small>
        </section>
      )}
      <div className="prep-summary-grid">
        <section className="form-section">
          <span className="eyebrow">GET EVERYTHING READY</span>
          <h2>Your batch quantities.</h2>
          <p className="muted small-text">
            Scaled from each recipe’s original yield. This is a preparation
            summary.
          </p>
          {batch.length ? (
            <ul className="batch-list">
              {batch.map((i, index) => (
                <li key={index}>
                  <span>{i.name}</span>
                  <strong>
                    {formatNumber(i.quantity)} {i.unit}
                    {i.gramEquivalent !== null && (
                      <small> ({formatNumber(i.gramEquivalent)} g)</small>
                    )}
                  </strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">Add meals to see the amounts to prepare.</p>
          )}
        </section>
        <section className="form-section">
          <span className="eyebrow">MADE FOR BOTH OF YOU</span>
          <h2>Everyone’s covered.</h2>
          {data.members.map((m) => (
            <div className="person-summary" key={m.id}>
              <span className="avatar">{m.name[0]}</span>
              <div>
                <strong>{m.name}</strong>
                <p>
                  {formatNumber(
                    plan.entries.reduce(
                      (s, e) => s + (e.portions[m.id] || 0),
                      0,
                    ),
                  )}{" "}
                  portions across {plan.days} days
                </p>
              </div>
            </div>
          ))}
          {selected.map((r) => (
            <div className="prep-recipe-notes" key={r.id}>
              <strong>
                {r.title} · {formatNumber(portions(plan, r.id))} portions
              </strong>
              <p>Store: {r.storage || "No guidance yet."}</p>
              <p>Reheat: {r.reheat || "No guidance yet."}</p>
              <p>Freeze: {r.freezing || "No guidance yet."}</p>
              <span className="muted small-text">{r.guidanceSource}</span>
            </div>
          ))}
        </section>
      </div>
      <div className="editor-actions no-print">
        {data.plans.some((p) => p.id === plan.id) && (
          <Button variant="ghost" onClick={() => setConfirm(true)}>
            <Trash2 size={16} />
            Delete plan
          </Button>
        )}
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer size={16} />
          Print summary
        </Button>
        <Button disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Save meal-prep plan"}
        </Button>
      </div>
      <Dialog
        open={adding}
        onOpenChange={setAdding}
        title="A good meal, a few times over."
        description="Pick a recipe, then choose how much each person will have."
      >
        <div className="stack">
          <label>
            Recipe
            <select
              value={recipeId}
              onChange={(e) => setRecipeId(e.target.value)}
            >
              <option value="" disabled>
                Choose a recipe
              </option>
              {data.recipes
                .filter((r) => r.status === "published")
                .map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Meal
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value as PlanEntry["slot"])}
            >
              {["Breakfast", "Lunch", "Dinner", "Snacks"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={repeat}
              onChange={(e) => setRepeat(e.target.checked)}
            />
            Repeat for all {plan.days} days
          </label>
          {!repeat && (
            <label>
              Day
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
              >
                {Array.from({ length: plan.days }, (_, i) => (
                  <option key={i} value={i}>
                    {dateLabel(addDays(plan.startDate, i))}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="form-grid">
            {data.members.map((m) => (
              <label key={m.id}>
                {m.name} · portions per day
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.25"
                  value={personPortions[m.id] ?? 1}
                  onChange={(e) =>
                    setPersonPortions({
                      ...personPortions,
                      [m.id]: Number(e.target.value),
                    })
                  }
                />
              </label>
            ))}
          </div>
          <p className="callout">
            {formatNumber(
              Object.values(personPortions).reduce((a, b) => a + b, 0) *
                (repeat ? plan.days : 1),
            )}{" "}
            total portions will be prepared.
          </p>
          <Button
            onClick={addMeal}
            disabled={
              !recipeId || Object.values(personPortions).every((n) => n <= 0)
            }
          >
            Add to your plan
          </Button>
        </div>
      </Dialog>
      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Delete this meal-prep plan?"
        description="Your recipes will stay in the recipe book."
      >
        <div className="dialog-actions">
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Keep plan
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              try {
                await deletePlan(plan.id);
                setPlan(freshPlan());
                setConfirm(false);
              } catch (e) {
                toast((e as Error).message);
              }
            }}
          >
            Delete plan
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
