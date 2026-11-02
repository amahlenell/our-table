import type { AppData, Recipe, Category } from "@/types";
import { localDate } from "@/lib/utils";
export const demoUser = "10000000-0000-4000-8000-000000000001";
const partner = "10000000-0000-4000-8000-000000000002";
const image = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;
export function blankRecipe(): Recipe {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    category: "Dinner",
    tags: [],
    prepMinutes: 10,
    cookMinutes: 20,
    servings: 4,
    ingredients: [],
    instructions: [],
    storage: "",
    reheat: "",
    freezing: "",
    fridgeDays: null,
    guidanceSource: "User entered",
    guidanceUrl: "",
    image: "",
    imagePath: "",
    sourceUrl: "",
    author: "",
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    favourite: false,
    notes: "",
    rating: 0,
  };
}
const samples: [string, Category, string, string, string[]][] = [
  [
    "Lemon & herb chicken bowls",
    "Lunch",
    "photo-1547592180-85f173990554",
    "Fresh, bright, and made for the days ahead. Herby chicken with crisp greens and a lemon yoghurt dressing.",
    ["Meal prep", "High protein"],
  ],
  [
    "Roasted tomato & basil pasta",
    "Dinner",
    "photo-1473093295043-cdd812d0e601",
    "Slow-roasted tomatoes, a little garlic, and plenty of fresh basil. The kind of dinner you come back to.",
    ["Vegetarian", "Weeknight"],
  ],
  [
    "Chicken & broccoli egg muffins",
    "Breakfast",
    "photo-1525351484163-7529414344d8",
    "A simple savoury breakfast with tender chicken, broccoli, eggs, and cottage cheese.",
    ["Meal prep", "Freezer friendly"],
  ],
  [
    "Chicken & mozzarella veggie wraps",
    "Lunch",
    "photo-1626700051175-6818013e1d4f",
    "Golden chicken, crunchy vegetables, and melting mozzarella tucked into a soft wrap.",
    ["Meal prep", "Family favourite"],
  ],
  [
    "Berry overnight oats",
    "Breakfast",
    "photo-1517673400267-0251440c45dc",
    "Creamy oats, juicy berries, and a spoonful of yoghurt. A little gift to your tomorrow morning.",
    ["Vegetarian", "No cook"],
  ],
  [
    "Crispy salmon & greens",
    "Dinner",
    "photo-1467003909585-2f8a72700288",
    "Crisp-edged salmon with tender greens and a squeeze of lemon. Simple ingredients, lovely results.",
    ["Quick & easy"],
  ],
  [
    "Summer garden salad",
    "Lunch",
    "photo-1512621776951-a57141f2eefd",
    "A colourful mix of seasonal vegetables, leafy greens, and a bright homemade dressing.",
    ["Vegetarian", "Quick & easy"],
  ],
  [
    "Chocolate almond bites",
    "Snacks",
    "photo-1511381939415-e44015466834",
    "A small, chocolatey treat with toasted almonds. Keep a batch tucked away for an afternoon break.",
    ["Freezer friendly"],
  ],
];
export function demoData(): AppData {
  const recipes: Recipe[] = samples.map(
    ([title, category, photo, description, tags], index) => ({
      ...blankRecipe(),
      id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      title,
      category,
      description,
      tags,
      image: image(photo),
      prepMinutes: [15, 10, 15, 15, 5, 10, 15, 15][index],
      cookMinutes: [20, 25, 20, 15, 0, 15, 0, 10][index],
      favourite: [0, 2, 4].includes(index),
      status: "published",
      author: "Our Table sample kitchen",
      ingredients: (index === 2
        ? ["Eggs", "Cooked chicken breast", "Broccoli", "Cottage cheese"]
        : index === 3
          ? ["Chicken breast", "Soft wraps", "Mozzarella", "Mixed vegetables"]
          : index === 0
            ? [
                "Chicken breast",
                "Cooked brown rice",
                "Mixed greens",
                "Lemon",
                "Greek yoghurt",
              ]
            : [
                "Main ingredient — replace with your own",
                "Seasonal vegetables or berries",
                "Seasoning to taste",
              ]
      ).map((name, j) => ({
        id: crypto.randomUUID(),
        name,
        quantity:
          index === 2
            ? [6, 200, 150, 100][j]
            : index === 3
              ? [400, 4, 120, 200][j]
              : index === 0
                ? [500, 400, 200, 1, 100][j]
                : [300, 200, 1][j],
        unit:
          (index === 2 && j === 0) ||
          (index === 3 && j === 1) ||
          (index === 0 && j === 3) ||
          (j === 2 && index > 3)
            ? "piece"
            : "g",
        gramEquivalent: null,
        food: null,
      })),
      instructions:
        index === 2
          ? [
              "Heat the oven to 180°C and lightly grease a muffin tin.",
              "Whisk the eggs with the cottage cheese. Chop the cooked chicken and broccoli into small pieces.",
              "Divide the filling between the muffin cups and pour over the egg mixture.",
              "Bake until set and cooked through. Cool before packing.",
            ]
          : [
              "Prepare and measure the ingredients. Review this sample and adapt it to your kitchen.",
              "Cook the main ingredients using a method suited to them, checking they are thoroughly cooked.",
              "Combine, season to taste, and divide between serving dishes.",
              "Serve immediately or cool and store according to your own reviewed guidance.",
            ],
      storage:
        "Sample only — add recipe-specific storage guidance before planning refrigerated meals.",
      reheat: "Add appropriate reheating guidance for this recipe.",
      freezing: "Review whether this recipe is suitable for freezing.",
      createdAt: new Date(Date.now() - index * 86400000).toISOString(),
    }),
  );
  return {
    recipes,
    plans: [],
    members: [
      { id: demoUser, name: "Alex" },
      { id: partner, name: "Jamie" },
    ],
    profile: { id: demoUser, name: "Alex" },
    household: {
      id: "10000000-0000-4000-8000-000000000003",
      name: "Our little kitchen",
    },
    foods: [],
  };
}
export const emptyData: AppData = {
  recipes: [],
  plans: [],
  members: [],
  profile: { id: "", name: "Cook" },
  household: null,
  foods: [],
};
export const today = localDate;
