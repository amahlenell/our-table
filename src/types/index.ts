export const categories = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Snacks",
  "Desserts",
  "Other",
] as const;
export const units = [
  "g",
  "kg",
  "ml",
  "l",
  "cup",
  "tbsp",
  "tsp",
  "piece",
  "serving",
] as const;
export type Category = (typeof categories)[number];
export type Unit = (typeof units)[number];
export const nutrientKeys = [
  "calories",
  "protein",
  "carbs",
  "fat",
  "fibre",
] as const;
export type NutrientKey = (typeof nutrientKeys)[number];
export type Nutrients = Record<NutrientKey, number | null>;
export type Food = {
  id: string;
  name: string;
  source: "USDA" | "User label" | "Sample";
  sourceId?: string;
  state: string;
  per100: Nutrients;
  gramsPerUnit?: Partial<Record<Unit, number>>;
};
export type Ingredient = {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  gramEquivalent: number | null;
  food: Food | null;
};
export type Recipe = {
  id: string;
  title: string;
  description: string;
  category: Category;
  tags: string[];
  prepMinutes: number;
  cookMinutes: number;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  storage: string;
  reheat: string;
  freezing: string;
  fridgeDays: number | null;
  guidanceSource: "User entered" | "Verified source";
  guidanceUrl: string;
  image: string;
  imagePath: string;
  sourceUrl: string;
  author: string;
  status: "published" | "draft";
  createdAt: string;
  updatedAt: string;
  favourite: boolean;
  notes: string;
  rating: number;
};
export type Member = { id: string; name: string };
export type PlanEntry = {
  id: string;
  date: string;
  slot: "Breakfast" | "Lunch" | "Dinner" | "Snacks";
  recipeId: string;
  frozen: boolean;
  portions: Record<string, number>;
};
export type MealPlan = {
  id: string;
  title: string;
  startDate: string;
  days: 3 | 4 | 5;
  entries: PlanEntry[];
};
export type AppData = {
  recipes: Recipe[];
  plans: MealPlan[];
  members: Member[];
  profile: Member;
  household: { id: string; name: string } | null;
  foods: Food[];
};
