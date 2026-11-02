import { it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { randomBytes, createHash } from "node:crypto";
import { fixtureRecipe } from "../fixtures";
const url = process.env.TEST_SUPABASE_URL;
const key = process.env.TEST_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = process.env.TEST_SUPABASE_SERVICE_ROLE_KEY;
// Use a disposable project with the migration applied. Never a live household.
it.skipIf(!url || !key || !serviceKey)(
  "live: two verified accounts share recipes; outsiders and personal notes are isolated",
  async () => {
    const admin = createClient(url!, serviceKey!, {
      auth: { persistSession: false },
    });
    const users: string[] = [],
      houses: string[] = [];
    const suffix = crypto.randomUUID();
    const password = randomBytes(24).toString("hex");
    const clients = [0, 1, 2].map(() =>
      createClient(url!, key!, { auth: { persistSession: false } }),
    );
    try {
      for (let i = 0; i < 3; i++) {
        const email = `prepbook-${suffix}-${i}@example.com`;
        const created = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        expect(created.error).toBeNull();
        users.push(created.data.user!.id);
        expect(
          (await clients[i].auth.signInWithPassword({ email, password })).error,
        ).toBeNull();
      }
      const created = await clients[0].rpc("create_household", {
        p_name: "Integration test kitchen",
      });
      expect(created.error).toBeNull();
      const h = created.data as string;
      houses.push(h);
      const outsider = await clients[2].rpc("create_household", {
        p_name: "Outside kitchen",
      });
      expect(outsider.error).toBeNull();
      houses.push(outsider.data as string);
      const token = randomBytes(32).toString("hex");
      const hash = createHash("sha256").update(token).digest("hex");
      expect(
        (
          await clients[0].rpc("create_invitation", {
            p_household: h,
            p_email: `prepbook-${suffix}-1@example.com`,
            p_hash: hash,
          })
        ).error,
      ).toBeNull();
      expect(
        (await clients[2].rpc("accept_invitation", { p_token: token })).error,
      ).not.toBeNull();
      expect(
        (await clients[1].rpc("accept_invitation", { p_token: token })).error,
      ).toBeNull();
      expect(
        (await clients[1].rpc("accept_invitation", { p_token: token })).error,
      ).not.toBeNull();
      const recipe = fixtureRecipe();
      const food = { ...recipe.ingredients[0].food!, id: crypto.randomUUID() };
      recipe.ingredients[0].food = food;
      expect(
        (await clients[0].rpc("save_food", { p_household: h, p: food })).error,
      ).toBeNull();
      expect(
        (await clients[0].rpc("save_recipe", { p_household: h, p: recipe }))
          .error,
      ).toBeNull();
      const shared = await clients[1]
        .from("recipes")
        .select("*")
        .eq("id", recipe.id);
      expect(shared.error).toBeNull();
      expect(shared.data).toHaveLength(1);
      recipe.title = "Edited by partner";
      expect(
        (await clients[1].rpc("save_recipe", { p_household: h, p: recipe }))
          .error,
      ).toBeNull();
      expect(
        (
          await clients[0]
            .from("recipes")
            .select("title")
            .eq("id", recipe.id)
            .single()
        ).data?.title,
      ).toBe("Edited by partner");
      expect(
        (await clients[2].from("recipes").select("*").eq("id", recipe.id)).data,
      ).toEqual([]);
      expect(
        (await clients[2].rpc("save_recipe", { p_household: h, p: recipe }))
          .error,
      ).not.toBeNull();
      expect(
        (
          await clients[0].from("recipe_notes").insert({
            user_id: users[0],
            recipe_id: recipe.id,
            household_id: h,
            notes: "Private",
            rating: 4,
          })
        ).error,
      ).toBeNull();
      expect(
        (
          await clients[1]
            .from("recipe_notes")
            .select("*")
            .eq("recipe_id", recipe.id)
        ).data,
      ).toEqual([]);
      const broken = {
        ...recipe,
        title: "Must roll back",
        ingredients: [
          {
            ...recipe.ingredients[0],
            food: { ...food, id: crypto.randomUUID() },
          },
        ],
      };
      expect(
        (await clients[1].rpc("save_recipe", { p_household: h, p: broken }))
          .error,
      ).not.toBeNull();
      expect(
        (
          await clients[0]
            .from("recipes")
            .select("title")
            .eq("id", recipe.id)
            .single()
        ).data?.title,
      ).toBe("Edited by partner");
    } finally {
      for (const h of houses)
        await admin.from("households").delete().eq("id", h);
      for (const id of users) await admin.auth.admin.deleteUser(id);
    }
  },
  60000,
);
