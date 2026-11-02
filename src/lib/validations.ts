import { z } from "zod";
import { categories, units } from "@/types";
const text = z.string().trim().max(10000);
const httpUrl = z
  .url()
  .max(2000)
  .refine(
    (value) => ["http:", "https:"].includes(new URL(value).protocol),
    "Use an HTTP or HTTPS source URL.",
  );
const nutrient = z.number().finite().min(0).max(100000).nullable();
export const nutrientsSchema = z.object({
  calories: nutrient,
  protein: nutrient,
  carbs: nutrient,
  fat: nutrient,
  fibre: nutrient,
});
export const foodSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  source: z.enum(["USDA", "User label", "Sample"]),
  sourceId: z.string().max(100).optional(),
  state: z.string().max(100),
  per100: nutrientsSchema,
  gramsPerUnit: z
    .partialRecord(z.enum(units), z.number().positive().max(100000))
    .optional(),
});
export const ingredientSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(300),
  quantity: z.number().finite().min(0).max(1000000),
  unit: z.enum(units),
  gramEquivalent: z.number().finite().min(0).max(10000000).nullable(),
  food: foodSchema.nullable(),
});
export const recipeSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(160),
    description: text,
    category: z.enum(categories),
    tags: z.array(z.string().trim().min(1).max(40)).max(20),
    prepMinutes: z.number().int().min(0).max(10000),
    cookMinutes: z.number().int().min(0).max(10000),
    servings: z.number().positive().max(1000),
    ingredients: z.array(ingredientSchema).max(150),
    instructions: z.array(z.string().trim().min(1).max(10000)).max(100),
    storage: text,
    reheat: text,
    freezing: text,
    fridgeDays: z.number().int().min(0).max(30).nullable(),
    guidanceSource: z.enum(["User entered", "Verified source"]),
    guidanceUrl: z.union([z.literal(""), httpUrl]),
    image: z.string().max(4000),
    imagePath: z.string().max(500),
    sourceUrl: z.union([z.literal(""), httpUrl]),
    author: z.string().max(200),
    status: z.enum(["published", "draft"]),
    createdAt: z.string(),
    updatedAt: z.string(),
    favourite: z.boolean(),
    notes: text,
    rating: z.number().int().min(0).max(5),
  })
  .superRefine((r, ctx) => {
    if (
      r.status === "published" &&
      (!r.ingredients.length || !r.instructions.length)
    )
      ctx.addIssue({
        code: "custom",
        message: "Published recipes need ingredients and instructions.",
      });
    if (r.guidanceSource === "Verified source" && !r.guidanceUrl)
      ctx.addIssue({
        code: "custom",
        message: "Add a source URL for verified storage guidance.",
      });
  });
export const planSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(150),
    startDate: z.iso.date(),
    days: z.union([z.literal(3), z.literal(4), z.literal(5)]),
    entries: z
      .array(
        z.object({
          id: z.string().uuid(),
          date: z.iso.date(),
          slot: z.enum(["Breakfast", "Lunch", "Dinner", "Snacks"]),
          recipeId: z.string().uuid(),
          frozen: z.boolean(),
          portions: z.record(
            z.string().uuid(),
            z.number().finite().min(0).max(100),
          ),
        }),
      )
      .max(100),
  })
  .superRefine((p, ctx) => {
    const end = new Date(p.startDate + "T12:00:00Z");
    end.setUTCDate(end.getUTCDate() + p.days);
    for (const e of p.entries)
      if (e.date < p.startDate || e.date >= end.toISOString().slice(0, 10))
        ctx.addIssue({
          code: "custom",
          message: "Meals must fall within the plan dates.",
        });
  });
export const aiDraftSchema = z.object({
  title: z.string().min(1).max(160),
  description: z.string().max(2000),
  category: z.enum(categories),
  tags: z.array(z.string().max(40)).max(20),
  prepMinutes: z.number().int().min(0).max(10000),
  cookMinutes: z.number().int().min(0).max(10000),
  servings: z.number().positive().max(1000),
  ingredients: z
    .array(
      z.object({
        name: z.string().min(1).max(300),
        quantity: z.number().min(0).max(1000000),
        unit: z.enum(units),
      }),
    )
    .min(1)
    .max(150),
  instructions: z.array(z.string().min(1).max(10000)).min(1).max(100),
});
