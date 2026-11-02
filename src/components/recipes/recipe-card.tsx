"use client";
import Link from "next/link";
import { Clock, Heart, Leaf, Users } from "lucide-react";
import { useApp } from "@/features/app-provider";
import { nutrition } from "@/services/nutrition";
import { formatNumber } from "@/lib/utils";
import type { Recipe } from "@/types";
export function RecipeImage({
  recipe,
  className = "",
}: {
  recipe: Pick<Recipe, "image" | "title">;
  className?: string;
}) {
  return recipe.image ? (
    <img
      className={className}
      src={recipe.image}
      alt={recipe.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(e) => {
        e.currentTarget.style.display = "none";
        e.currentTarget.parentElement?.classList.add("image-fallback");
      }}
    />
  ) : (
    <div className={`image-placeholder ${className}`}>
      <Leaf size={40} />
      <span>Something homemade</span>
    </div>
  );
}
export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const { personal, toast } = useApp();
  const macros = nutrition(recipe.ingredients, recipe.servings);
  return (
    <article className="recipe-card">
      <div className="recipe-photo">
        <Link
          href={`/recipes/${recipe.id}`}
          aria-label={`View ${recipe.title}`}
        >
          <RecipeImage recipe={recipe} />
        </Link>
        <span className="category-badge">{recipe.category}</span>
        <button
          className={`favourite-button ${recipe.favourite ? "is-favourite" : ""}`}
          aria-label={`${recipe.favourite ? "Unfavourite" : "Favourite"} ${recipe.title}`}
          aria-pressed={recipe.favourite}
          onClick={() =>
            personal(recipe.id, { favourite: !recipe.favourite }).catch((e) =>
              toast(e.message),
            )
          }
        >
          <Heart size={17} fill={recipe.favourite ? "currentColor" : "none"} />
        </button>
        {recipe.status === "draft" && (
          <span className="draft-badge">Draft</span>
        )}
      </div>
      <div className="recipe-card-body">
        <Link href={`/recipes/${recipe.id}`}>
          <h3>{recipe.title}</h3>
        </Link>
        <div className="recipe-meta">
          <span>
            <Clock size={13} />
            {recipe.prepMinutes + recipe.cookMinutes} min
          </span>
          <span>{formatNumber(macros.protein)} g protein</span>
          <span>{formatNumber(macros.calories, 0)} kcal</span>
        </div>
        <div className="recipe-yield">
          <Users size={13} />
          {formatNumber(recipe.servings)} servings
        </div>
        <div className="recipe-tags">
          {recipe.tags.slice(0, 2).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
          {macros.calories === null && (
            <span className="unlinked">Nutrition unlinked</span>
          )}
        </div>
      </div>
    </article>
  );
}
