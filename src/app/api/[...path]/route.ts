import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes, createHash } from "node:crypto";
import sharp from "sharp";
import { requireHousehold, requireUser } from "@/lib/supabase/server";
import { loadData, checked } from "@/services/repository";
import { recipeSchema, foodSchema, planSchema } from "@/lib/validations";
import { searchFoods, fetchFood } from "@/services/food-data";
import { importRecipe } from "@/services/imports";
import { generateRecipe } from "@/services/ai";
export const runtime = "nodejs";
export const maxDuration = 60;
type Context = { params: Promise<{ path: string[] }> };
async function handler(req: NextRequest, context: Context) {
  try {
    const path = (await context.params).path.join("/");
    const method = req.method;
    if (method !== "GET") {
      const origin = req.headers.get("origin");
      if (!origin || origin !== req.nextUrl.origin)
        return NextResponse.json(
          { error: "Invalid request origin." },
          { status: 403 },
        );
    }
    if (method === "GET" && path === "data")
      return NextResponse.json(await loadData(), {
        headers: { "Cache-Control": "no-store" },
      });
    if (path === "profile" && method === "POST") {
      const { db, user } = await requireUser();
      const body = z
        .object({ name: z.string().trim().min(1).max(100) })
        .parse(await req.json());
      checked(
        await db
          .from("profiles")
          .update({ display_name: body.name })
          .eq("id", user.id),
      );
      return NextResponse.json({ ok: true });
    }
    if (path === "household" && method === "POST") {
      const { db } = await requireUser();
      const { name } = z
        .object({ name: z.string().trim().min(1).max(100) })
        .parse(await req.json());
      checked(await db.rpc("create_household", { p_name: name }));
      return NextResponse.json({ ok: true });
    }
    if (path === "join" && method === "POST") {
      const { db } = await requireUser();
      const { token } = z
        .object({ token: z.string().regex(/^[a-f0-9]{64}$/) })
        .parse(await req.json());
      const result = await db.rpc("accept_invitation", { p_token: token });
      if (result.error)
        throw new Error(
          "The invitation is invalid, expired, already used, or for a different verified email.",
        );
      return NextResponse.json({ ok: true });
    }
    const { db, user, householdId } = await requireHousehold();
    if (path === "invitation" && method === "POST") {
      const { email } = z
        .object({ email: z.email().max(254) })
        .parse(await req.json());
      const token = randomBytes(32).toString("hex");
      const result = await db.rpc("create_invitation", {
        p_household: householdId,
        p_email: email,
        p_hash: createHash("sha256").update(token).digest("hex"),
      });
      if (result.error)
        throw new Error(
          "Only the owner of a household with a free place can invite a partner.",
        );
      return NextResponse.json({ token, expiresInHours: 48 });
    }
    if (path === "recipes" && method === "POST") {
      const recipe = recipeSchema.parse(await req.json());
      checked(
        await db.rpc("save_recipe", { p_household: householdId, p: recipe }),
      );
      return NextResponse.json({ id: recipe.id });
    }
    if (path.startsWith("recipes/") && method === "DELETE") {
      const id = z.uuid().parse(path.split("/")[1]);
      const plans = checked(
        await db
          .from("meal_plan_entries")
          .select("id")
          .eq("recipe_id", id)
          .limit(1),
      );
      if (plans.data?.length)
        throw new Error(
          "Remove this recipe from its meal plans before deleting it.",
        );
      checked(
        await db
          .from("recipes")
          .delete()
          .eq("id", id)
          .eq("household_id", householdId),
      );
      return NextResponse.json({ ok: true });
    }
    if (path === "personal" && method === "POST") {
      const p = z
        .object({
          recipeId: z.uuid(),
          favourite: z.boolean(),
          notes: z.string().max(10000),
          rating: z.number().int().min(0).max(5),
        })
        .parse(await req.json());
      if (p.favourite)
        checked(
          await db.from("favourite_recipes").upsert({
            user_id: user.id,
            recipe_id: p.recipeId,
            household_id: householdId,
          }),
        );
      else
        checked(
          await db
            .from("favourite_recipes")
            .delete()
            .eq("user_id", user.id)
            .eq("recipe_id", p.recipeId),
        );
      checked(
        await db.from("recipe_notes").upsert({
          user_id: user.id,
          recipe_id: p.recipeId,
          household_id: householdId,
          notes: p.notes,
          rating: p.rating,
        }),
      );
      return NextResponse.json({ ok: true });
    }
    if (path === "plans" && method === "POST") {
      const plan = planSchema.parse(await req.json());
      checked(await db.rpc("save_plan", { p_household: householdId, p: plan }));
      return NextResponse.json({ id: plan.id });
    }
    if (path.startsWith("plans/") && method === "DELETE") {
      checked(
        await db
          .from("meal_plans")
          .delete()
          .eq("id", z.uuid().parse(path.split("/")[1]))
          .eq("household_id", householdId),
      );
      return NextResponse.json({ ok: true });
    }
    if (path === "images" && method === "POST") {
      const form = await req.formData();
      const file = form.get("file");
      if (
        !(file instanceof File) ||
        file.size > 4 * 1024 * 1024 ||
        file.size === 0
      )
        throw new Error("Choose a photo up to 4 MB.");
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
        throw new Error("Use JPEG, PNG or WebP photos.");
      const bytes = Buffer.from(await file.arrayBuffer());
      const image = sharp(bytes, { limitInputPixels: 40000000 });
      const meta = await image.metadata();
      if (!["jpeg", "png", "webp"].includes(meta.format || ""))
        throw new Error("Unsupported image format.");
      const output = await image
        .rotate()
        .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toBuffer();
      const imagePath = `${householdId}/${crypto.randomUUID()}.webp`;
      checked(
        await db.storage.from("recipe-photos").upload(imagePath, output, {
          contentType: "image/webp",
          upsert: false,
        }),
      );
      const signed = checked(
        await db.storage.from("recipe-photos").createSignedUrl(imagePath, 3600),
      );
      return NextResponse.json({ imagePath, image: signed.data?.signedUrl });
    }
    if (["foods", "ai", "import"].includes(path)) {
      const usage = checked(await db.rpc("consume_usage", { p_feature: path }));
      if (!usage.data)
        return NextResponse.json(
          { error: "Hourly limit reached. Please try again later." },
          { status: 429 },
        );
    }
    if (path === "foods" && method === "GET") {
      const query = z
        .string()
        .trim()
        .min(2)
        .max(200)
        .parse(req.nextUrl.searchParams.get("q"));
      return NextResponse.json(await searchFoods(query));
    }
    if (path === "foods" && method === "POST") {
      const input = await req.json();
      const food = input.sourceId
        ? await fetchFood(
            z
              .string()
              .regex(/^\d{1,12}$/)
              .parse(input.sourceId),
          )
        : foodSchema.parse({ ...input, source: "User label" });
      checked(await db.rpc("save_food", { p_household: householdId, p: food }));
      return NextResponse.json(food);
    }
    if (path === "import" && method === "POST") {
      const { url } = z
        .object({ url: z.url().max(2000) })
        .parse(await req.json());
      return NextResponse.json(await importRecipe(url));
    }
    if (path === "ai" && method === "POST") {
      const { prompt } = z
        .object({ prompt: z.string().trim().min(10).max(4000) })
        .parse(await req.json());
      return NextResponse.json(await generateRecipe(prompt));
    }
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  } catch (error) {
    if (error instanceof z.ZodError)
      return NextResponse.json(
        { error: error.issues.map((i) => i.message).join(" ") },
        { status: 400 },
      );
    const message =
      error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.";
    const safe = /API key|Bearer|sk-|postgres:|JWT/i.test(message)
      ? "The service could not complete this request. Check its configuration."
      : message;
    return NextResponse.json(
      { error: safe },
      { status: /sign in/i.test(safe) ? 401 : 400 },
    );
  }
}
export const GET = handler;
export const POST = handler;
export const DELETE = handler;
