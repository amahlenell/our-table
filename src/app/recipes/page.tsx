"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Plus, SlidersHorizontal, Heart } from "lucide-react";
import { useApp } from "@/features/app-provider";
import { categories } from "@/types";
import { nutrition } from "@/services/nutrition";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { EmptyState, LoadingSkeleton } from "@/components/ui/states";
export default function Library() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LibraryContent />
    </Suspense>
  );
}
function LibraryContent() {
  const searchParams = useSearchParams();
  const urlFavourites = searchParams.has("favourites");
  const { data } = useApp();
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("All recipes"),
    [sort, setSort] = useState("recent"),
    [favourites, setFavourites] = useState(false),
    [macro, setMacro] = useState("all"),
    [tag, setTag] = useState(""),
    [limit, setLimit] = useState(12);
  useEffect(() => {
    setFavourites(urlFavourites);
  }, [urlFavourites]);
  const recipes = data.recipes
    .filter((r) => {
      const m = nutrition(r.ingredients, r.servings);
      return (
        (!favourites || r.favourite) &&
        (category === "All recipes" || r.category === category) &&
        (!tag || r.tags.includes(tag)) &&
        `${r.title} ${r.description} ${r.ingredients.map((i) => i.name).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (macro === "all" ||
          (macro === "protein" && m.protein !== null && m.protein >= 25) ||
          (macro === "carbs" && m.carbs !== null && m.carbs <= 20))
      );
    })
    .sort((a, b) => {
      if (sort === "name") return a.title.localeCompare(b.title);
      if (sort === "time")
        return a.prepMinutes + a.cookMinutes - b.prepMinutes - b.cookMinutes;
      if (sort === "protein" || sort === "calories") {
        const key = sort === "protein" ? "protein" : "calories";
        const x = nutrition(a.ingredients, a.servings)[key],
          y = nutrition(b.ingredients, b.servings)[key];
        if (x === null) return 1;
        if (y === null) return -1;
        return sort === "protein" ? y - x : x - y;
      }
      return b.createdAt.localeCompare(a.createdAt);
    });
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <div className="eyebrow">COLLECTED, COOKED & LOVED</div>
          <h1>
            Your recipe book<span className="heading-dot">.</span>
          </h1>
          <p>A home for the meals you’ll want to make again.</p>
        </div>
        <Link href="/recipes/new" className="btn btn-primary">
          <Plus size={17} />
          Add a recipe
        </Link>
      </div>
      <div className="library-toolbar">
        <label className="search-field">
          <Search size={19} />
          <input
            aria-label="Search recipes or ingredients"
            placeholder="Find a recipe or ingredient…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(12);
            }}
          />
          <span>⌕</span>
        </label>
        <button
          className={`btn ${favourites ? "btn-primary" : "btn-secondary"}`}
          aria-pressed={favourites}
          onClick={() => setFavourites(!favourites)}
        >
          <Heart size={16} />
          Favourites
        </button>
        <label className="select-wrap">
          <SlidersHorizontal size={15} />
          <select
            aria-label="Sort recipes"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="recent">Recently added</option>
            <option value="name">Recipe name</option>
            <option value="time">Quickest first</option>
            <option value="protein">Most protein</option>
            <option value="calories">Fewest calories</option>
          </select>
        </label>
      </div>
      <div className="filter-tabs">
        {["All recipes", ...categories].map((c) => (
          <button
            key={c}
            className={category === c ? "selected" : ""}
            onClick={() => {
              setCategory(c);
              setLimit(12);
            }}
          >
            {c}
            {c === "All recipes" && <span>{data.recipes.length}</span>}
          </button>
        ))}
      </div>
      <div className="library-subbar">
        <span>
          {recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} in your
          kitchen
        </span>
        <div>
          <select
            aria-label="Filter nutrition"
            value={macro}
            onChange={(e) => setMacro(e.target.value)}
          >
            <option value="all">All nutrition</option>
            <option value="protein">Protein ≥ 25 g</option>
            <option value="carbs">Carbs ≤ 20 g</option>
          </select>
          <select
            aria-label="Filter tag"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            <option value="">All tags</option>
            {[...new Set(data.recipes.flatMap((r) => r.tags))]
              .sort()
              .map((t) => (
                <option key={t}>{t}</option>
              ))}
          </select>
        </div>
      </div>
      {recipes.length ? (
        <>
          <div className="recipe-grid">
            {recipes.slice(0, limit).map((r) => (
              <RecipeCard recipe={r} key={r.id} />
            ))}
          </div>
          {recipes.length > limit && (
            <button
              className="btn btn-secondary load-more"
              onClick={() => setLimit(limit + 12)}
            >
              Load more recipes
            </button>
          )}
        </>
      ) : (
        <EmptyState
          title={
            data.recipes.length
              ? "Nothing in the book just yet"
              : "Your first recipe starts here"
          }
          description={
            data.recipes.length
              ? "Try another search or adjust your filters."
              : "Add a family favourite, import a recipe, or start with a little AI inspiration."
          }
        />
      )}
    </div>
  );
}
