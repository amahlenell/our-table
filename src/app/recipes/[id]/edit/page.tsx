"use client";
import { use } from "react";
import { useApp } from "@/features/app-provider";
import { RecipeForm } from "@/components/recipes/recipe-form";
import { EmptyState } from "@/components/ui/states";
export default function EditRecipe({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data } = useApp();
  const recipe = data.recipes.find((r) => r.id === id);
  return recipe ? (
    <RecipeForm initial={recipe} key={recipe.id} />
  ) : (
    <EmptyState
      title="Recipe not found"
      description="It may have been removed from your household."
      href="/recipes"
      action="Back to recipes"
    />
  );
}
