"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { AppData, Recipe, MealPlan, Food } from "@/types";
import { demoData, emptyData } from "./demo";
import { recipeSchema, planSchema, foodSchema } from "@/lib/validations";
export async function api<T = unknown>(
  path: string,
  body?: unknown,
  method = body ? "POST" : "GET",
): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "The request failed.");
  return result;
}
type Context = {
  data: AppData;
  demo: boolean;
  configured: boolean;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  saveRecipe: (r: Recipe) => Promise<void>;
  deleteRecipe: (id: string) => Promise<void>;
  savePlan: (p: MealPlan) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
  personal: (
    id: string,
    changes: Partial<Pick<Recipe, "favourite" | "notes" | "rating">>,
  ) => Promise<void>;
  saveFood: (f: Food) => Promise<Food>;
  updateProfile: (name: string) => Promise<void>;
  toast: (message: string) => void;
};
const AppContext = createContext<Context | null>(null);
export function AppProvider({
  children,
  demo,
  configured,
}: {
  children: ReactNode;
  demo: boolean;
  configured: boolean;
}) {
  const [data, setData] = useState<AppData>(emptyData),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const toast = useCallback((m: string) => setMessage(m), []);
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(""), 4500);
    return () => clearTimeout(timeout);
  }, [message]);
  const refresh = useCallback(async () => {
    if (demo) return;
    try {
      setError("");
      setData(await api<AppData>("data"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your kitchen.");
    } finally {
      setLoading(false);
    }
  }, [demo]);
  useEffect(() => {
    if (demo) {
      try {
        const saved = localStorage.getItem("prepbook-demo-v1");
        setData(saved ? JSON.parse(saved) : demoData());
      } catch {
        setData(demoData());
      }
      setLoading(false);
    } else if (configured) {
      void refresh();
    } else setLoading(false);
  }, [demo, configured, refresh]);
  useEffect(() => {
    if (!configured || demo) return;
    const onFocus = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [configured, demo, refresh]);
  const commit = useCallback(
    (update: (old: AppData) => AppData) => {
      setData((old) => {
        const next = update(old);
        if (demo) {
          try {
            localStorage.setItem("prepbook-demo-v1", JSON.stringify(next));
          } catch {
            queueMicrotask(() =>
              toast(
                "Browser storage is full. This change is only in memory; remove large photos or use a connected household.",
              ),
            );
          }
        }
        return next;
      });
    },
    [demo, toast],
  );
  const saveRecipe = async (recipe: Recipe) => {
    // Local demo photos are compressed data URLs. They are presentation data,
    // while the cloud payload contains only a short signed URL / storage path.
    const validated = recipeSchema.parse({
      ...recipe,
      image: demo ? "" : recipe.image,
      updatedAt: new Date().toISOString(),
    });
    const r: Recipe = {
      ...validated,
      image: demo ? recipe.image : validated.image,
    };
    if (!demo) {
      await api("recipes", r);
      await refresh();
    } else
      commit((d) => ({
        ...d,
        recipes: [r, ...d.recipes.filter((v) => v.id !== r.id)],
      }));
    toast(
      r.status === "draft" ? "Draft saved." : "Recipe saved to your kitchen.",
    );
  };
  const deleteRecipe = async (id: string) => {
    if (data.plans.some((p) => p.entries.some((e) => e.recipeId === id)))
      throw new Error("Remove this recipe from meal plans before deleting it.");
    if (!demo) await api(`recipes/${id}`, undefined, "DELETE");
    commit((d) => ({ ...d, recipes: d.recipes.filter((r) => r.id !== id) }));
    toast("Recipe deleted.");
  };
  const savePlan = async (p: MealPlan) => {
    planSchema.parse(p);
    if (!demo) {
      await api("plans", p);
      await refresh();
    } else
      commit((d) => ({
        ...d,
        plans: [p, ...d.plans.filter((v) => v.id !== p.id)],
      }));
    toast("Meal-prep plan saved.");
  };
  const deletePlan = async (id: string) => {
    if (!demo) await api(`plans/${id}`, undefined, "DELETE");
    commit((d) => ({ ...d, plans: d.plans.filter((p) => p.id !== id) }));
    toast("Plan deleted.");
  };
  const personal = async (
    id: string,
    changes: Partial<Pick<Recipe, "favourite" | "notes" | "rating">>,
  ) => {
    const r = data.recipes.find((r) => r.id === id);
    if (!r) return;
    const next = { ...r, ...changes };
    if (!demo)
      await api("personal", {
        recipeId: id,
        favourite: next.favourite,
        notes: next.notes,
        rating: next.rating,
      });
    commit((d) => ({
      ...d,
      recipes: d.recipes.map((v) => (v.id === id ? next : v)),
    }));
  };
  const saveFood = async (f: Food) => {
    foodSchema.parse(f);
    const saved = demo ? f : await api<Food>("foods", f);
    commit((d) => ({ ...d, foods: [...d.foods, saved] }));
    return saved;
  };
  const updateProfile = async (name: string) => {
    if (!demo) await api("profile", { name });
    commit((d) => ({
      ...d,
      profile: { ...d.profile, name },
      members: d.members.map((m) =>
        m.id === d.profile.id ? { ...m, name } : m,
      ),
    }));
    toast("Profile updated.");
  };
  return (
    <AppContext.Provider
      value={{
        data,
        demo,
        configured,
        loading,
        error,
        refresh,
        saveRecipe,
        deleteRecipe,
        savePlan,
        deletePlan,
        personal,
        saveFood,
        updateProfile,
        toast,
      }}
    >
      {children}
      <div aria-live="polite" className={`toast ${message ? "show" : ""}`}>
        {message}
      </div>
    </AppContext.Provider>
  );
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("AppProvider missing");
  return context;
}
