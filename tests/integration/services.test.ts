import { describe, it, expect } from "vitest";
import {
  safeUrl,
  publicAddress,
  parseRecipe,
  robotsAllowed,
} from "@/services/imports";
import { aiDraftSchema, recipeSchema, planSchema } from "@/lib/validations";
import { mapFdc } from "@/services/food-data";
import { fixturePlan, fixtureRecipe } from "../fixtures";
describe("external data boundaries", () => {
  it("respects wildcard restrictions and adjacent user agents", () => {
    expect(
      robotsAllowed("User-agent: *\nDisallow: /private", "/private/soup"),
    ).toBe(false);
    expect(
      robotsAllowed(
        "User-agent: PrepBookRecipeImporter\nUser-agent: AnotherBot\nDisallow: /*?secret=",
        "/soup?secret=1",
      ),
    ).toBe(false);
    expect(
      robotsAllowed(
        "User-agent: OtherBot\nDisallow: /\nUser-agent: *\nDisallow: /members",
        "/soup",
      ),
    ).toBe(true);
  });
  it("rejects executable source URLs in saved recipes", () => {
    expect(
      recipeSchema.safeParse({
        ...fixtureRecipe(),
        sourceUrl: "javascript:alert(1)",
      }).success,
    ).toBe(false);
  });
  it.each([
    "http://localhost/a",
    "http://127.0.0.1",
    "http://10.0.0.1",
    "http://169.254.169.254/latest",
    "http://[::1]",
    "http://[::ffff:127.0.0.1]",
    "file:///etc/passwd",
    "https://user:pass@example.com",
    "http://example.com:8080",
  ])("rejects unsafe URL %s", (url) => expect(() => safeUrl(url)).toThrow());
  it.each([
    "192.168.1.1",
    "100.64.0.1",
    "172.16.4.3",
    "0.0.0.0",
    "255.255.255.255",
    "fc00::1",
    "fe80::1",
    "2001:db8::1",
  ])("rejects reserved destination %s", (address) =>
    expect(publicAddress(address)).toBe(false),
  );
  it("accepts public addresses", () => {
    expect(publicAddress("1.1.1.1")).toBe(true);
    expect(safeUrl("https://example.com/recipe").hostname).toBe("example.com");
  });
  it("extracts JSON-LD graphs with nested instruction sections and keeps attribution", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({ "@graph": [{ "@type": "Recipe", name: "Soup", recipeIngredient: ["1 cup lentils"], recipeInstructions: [{ "@type": "HowToSection", itemListElement: [{ "@type": "HowToStep", text: "<b>Simmer</b> until tender." }] }], recipeYield: "4 servings", prepTime: "PT1H5M" }] })}</script>`;
    const r = parseRecipe(html, "https://example.com/soup");
    expect(r.title).toBe("Soup");
    expect(r.instructions).toEqual(["Simmer until tender."]);
    expect(r.prepMinutes).toBe(65);
    expect(r.servings).toBe(4);
    expect(r.ingredients?.[0].name).toBe("1 cup lentils");
    expect(r.ingredients?.[0].food).toBeNull();
    expect(r.sourceUrl).toBe("https://example.com/soup");
  });
  it("refuses incomplete imports", () => {
    expect(() =>
      parseRecipe("<h1>No recipe data</h1>", "https://example.com"),
    ).toThrow();
    expect(() =>
      parseRecipe(
        '<script type="application/ld+json">{"@type":"Recipe","name":"Soup"}</script>',
        "https://example.com",
      ),
    ).toThrow();
  });
  it("does not fabricate missing USDA values or convert kJ to kcal implicitly", () => {
    const food = mapFdc({
      fdcId: 1,
      description: "Test",
      foodNutrients: [
        { nutrientId: 1008, unitName: "kJ", value: 500 },
        { nutrientId: 1003, value: 20 },
      ],
    });
    expect(food.per100.calories).toBeNull();
    expect(food.per100.protein).toBe(20);
    expect(food.per100.fibre).toBeNull();
  });
  it("validates AI content and strips untrusted nutrition fields", () => {
    expect(aiDraftSchema.safeParse({ title: "Incomplete" }).success).toBe(
      false,
    );
    const draft = {
      title: "Soup",
      description: "",
      category: "Lunch",
      tags: [],
      prepMinutes: 5,
      cookMinutes: 20,
      servings: 2,
      ingredients: [{ name: "Lentils", quantity: 100, unit: "g" }],
      instructions: ["Simmer."],
      nutrition: { calories: 1 },
    };
    expect(aiDraftSchema.parse(draft)).not.toHaveProperty("nutrition");
  });
  it("validates published recipes, partial drafts, and plan dates", () => {
    const r = fixtureRecipe();
    expect(recipeSchema.safeParse(r).success).toBe(true);
    expect(recipeSchema.safeParse({ ...r, ingredients: [] }).success).toBe(
      false,
    );
    expect(
      recipeSchema.safeParse({ ...r, status: "draft", ingredients: [] })
        .success,
    ).toBe(true);
    const p = fixturePlan(r.id);
    p.entries[0].date = "2026-10-09";
    expect(planSchema.safeParse(p).success).toBe(false);
  });
});
