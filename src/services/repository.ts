import "server-only";
import { requireUser } from "@/lib/supabase/server";
import type {
  AppData,
  Recipe,
  Food,
  Category,
  Unit,
  MealPlan,
  PlanEntry,
  Nutrients,
} from "@/types";
type Row = Record<string, unknown>;
const rows = (v: unknown) => (v || []) as Row[];
const s = (r: Row, k: string) => String(r[k] ?? "");
const n = (r: Row, k: string) => Number(r[k] ?? 0);
export function checked<T extends { error: unknown }>(result: T) {
  if (result.error)
    throw new Error(
      "The database operation failed. Check permissions and migration setup.",
    );
  return result;
}
export async function loadData(): Promise<AppData> {
  const { db, user } = await requireUser();
  const profileResult = checked(
    await db
      .from("profiles")
      .select("id,display_name")
      .eq("id", user.id)
      .single(),
  );
  const profile = {
    id: user.id,
    name: profileResult.data?.display_name || "Cook",
  };
  const membership = checked(
    await db
      .from("household_members")
      .select("household_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  );
  if (!membership.data)
    return {
      recipes: [],
      plans: [],
      members: [profile],
      profile,
      household: null,
      foods: [],
    };
  const h = membership.data.household_id;
  const tables = [
    "recipes",
    "food_items",
    "food_nutrition",
    "recipe_ingredients",
    "recipe_instructions",
    "recipe_images",
    "recipe_tags",
    "recipe_tag_assignments",
    "favourite_recipes",
    "recipe_notes",
    "meal_plans",
    "meal_plan_entries",
    "meal_plan_portions",
    "household_members",
  ] as const;
  const keyColumns: Partial<Record<(typeof tables)[number], string[]>> = {
    food_nutrition: ["food_id"],
    recipe_tag_assignments: ["recipe_id", "tag_id"],
    favourite_recipes: ["user_id", "recipe_id"],
    recipe_notes: ["user_id", "recipe_id"],
    meal_plan_portions: ["entry_id", "user_id"],
    household_members: ["user_id"],
  };
  async function readTable(t: (typeof tables)[number]) {
    const all: Row[] = [];
    for (let offset = 0; ; offset += 500) {
      let query = db.from(t).select("*").eq("household_id", h);
      for (const column of keyColumns[t] || ["id"]) query = query.order(column);
      const result = checked(await query.range(offset, offset + 499));
      const page = rows(result.data);
      all.push(...page);
      if (page.length < 500) return all;
    }
  }
  const results = await Promise.all(tables.map(readTable));
  const table = Object.fromEntries(tables.map((t, i) => [t, results[i]]));
  const memberIds = table.household_members.map((r) => s(r, "user_id"));
  const profiles = checked(
    await db.from("profiles").select("id,display_name").in("id", memberIds),
  );
  const household = checked(
    await db.from("households").select("id,name").eq("id", h).single(),
  );
  const foods: Food[] = table.food_items.map((r) => {
    const v = table.food_nutrition.find((f) => f.food_id === r.id) || {};
    const per100 = Object.fromEntries(
      ["calories", "protein", "carbs", "fat", "fibre"].map((k) => [
        k,
        v[k] == null ? null : Number(v[k]),
      ]),
    ) as Nutrients;
    return {
      id: s(r, "id"),
      name: s(r, "name"),
      source: s(r, "source") as Food["source"],
      sourceId: s(r, "source_id"),
      state: s(r, "state"),
      per100,
      gramsPerUnit: r.grams_per_unit as Food["gramsPerUnit"],
    };
  });
  const images = await Promise.all(
    table.recipe_images.map(async (r) => ({
      recipeId: s(r, "recipe_id"),
      path: s(r, "storage_path"),
      url:
        (
          await db.storage
            .from("recipe-photos")
            .createSignedUrl(s(r, "storage_path"), 3600)
        ).data?.signedUrl || "",
    })),
  );
  const recipes: Recipe[] = table.recipes.map((r) => {
    const image = images.find((i) => i.recipeId === r.id);
    const note = table.recipe_notes.find(
      (i) => i.recipe_id === r.id && i.user_id === user.id,
    );
    return {
      id: s(r, "id"),
      title: s(r, "title"),
      description: s(r, "description"),
      category: s(r, "category") as Category,
      tags: table.recipe_tag_assignments
        .filter((a) => a.recipe_id === r.id)
        .map((a) =>
          s(table.recipe_tags.find((t) => t.id === a.tag_id) || {}, "name"),
        ),
      prepMinutes: n(r, "prep_minutes"),
      cookMinutes: n(r, "cook_minutes"),
      servings: n(r, "servings"),
      storage: s(r, "storage"),
      reheat: s(r, "reheat"),
      freezing: s(r, "freezing"),
      fridgeDays: r.fridge_days === null ? null : n(r, "fridge_days"),
      guidanceSource: s(r, "guidance_source") as Recipe["guidanceSource"],
      guidanceUrl: s(r, "guidance_url"),
      sourceUrl: s(r, "source_url"),
      author: s(r, "author"),
      status: s(r, "status") as Recipe["status"],
      createdAt: s(r, "created_at"),
      updatedAt: s(r, "updated_at"),
      favourite: table.favourite_recipes.some(
        (f) => f.recipe_id === r.id && f.user_id === user.id,
      ),
      notes: note ? s(note, "notes") : "",
      rating: note ? n(note, "rating") : 0,
      image: image?.url || "",
      imagePath: image?.path || "",
      ingredients: table.recipe_ingredients
        .filter((i) => i.recipe_id === r.id)
        .sort((a, b) => n(a, "position") - n(b, "position"))
        .map((i) => ({
          id: s(i, "id"),
          name: s(i, "name"),
          quantity: n(i, "quantity"),
          unit: s(i, "unit") as Unit,
          gramEquivalent:
            i.gram_equivalent === null ? null : n(i, "gram_equivalent"),
          food: foods.find((f) => f.id === i.food_id) || null,
        })),
      instructions: table.recipe_instructions
        .filter((i) => i.recipe_id === r.id)
        .sort((a, b) => n(a, "position") - n(b, "position"))
        .map((i) => s(i, "body")),
    };
  });
  const plans: MealPlan[] = table.meal_plans.map((p) => ({
    id: s(p, "id"),
    title: s(p, "title"),
    startDate: s(p, "start_date"),
    days: n(p, "days") as 3 | 4 | 5,
    entries: table.meal_plan_entries
      .filter((e) => e.plan_id === p.id)
      .map((e) => ({
        id: s(e, "id"),
        date: s(e, "meal_date"),
        slot: s(e, "slot") as PlanEntry["slot"],
        recipeId: s(e, "recipe_id"),
        frozen: Boolean(e.frozen),
        portions: Object.fromEntries(
          table.meal_plan_portions
            .filter((v) => v.entry_id === e.id)
            .map((v) => [s(v, "user_id"), n(v, "quantity")]),
        ),
      })),
  }));
  return {
    recipes: recipes.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    plans,
    members: rows(profiles.data).map((p) => ({
      id: s(p, "id"),
      name: s(p, "display_name"),
    })),
    profile,
    household: household.data,
    foods,
  };
}
