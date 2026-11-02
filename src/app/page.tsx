"use client";
import Link from "next/link";
import {
  ArrowRight,
  Plus,
  CalendarDays,
  BookOpen,
  Heart,
  Clock,
  ArrowUpRight,
  Sparkles,
  Leaf,
} from "lucide-react";
import { useApp } from "@/features/app-provider";
import { RecipeCard, RecipeImage } from "@/components/recipes/recipe-card";
import { EmptyState } from "@/components/ui/states";
import { portions, addDays } from "@/services/planner";
import { dateLabel, localDate } from "@/lib/utils";
export default function Dashboard() {
  const { data } = useApp();
  const plan = data.plans
    .filter((p) => addDays(p.startDate, p.days - 1) >= localDate())
    .sort((a, b) => a.startDate.localeCompare(b.startDate))[0];
  const recent = [...data.recipes]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);
  const favourites = data.recipes.filter((r) => r.favourite);
  const hour = new Date().getHours();
  const suggestion = data.recipes
    .filter((r) => r.status === "published")
    .sort(
      (a, b) => a.cookMinutes + a.prepMinutes - (b.cookMinutes + b.prepMinutes),
    )[0];
  return (
    <div className="page-enter">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="mini-line" /> YOUR EVERYDAY, A LITTLE EASIER
          </div>
          <h1>
            Good {hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening"},{" "}
            {data.profile.name}
            <span className="greeting-leaf">
              <Leaf size={27} />
            </span>
          </h1>
          <p>A little inspiration for your kitchen today.</p>
        </div>
        <Link className="btn btn-primary" href="/recipes/new">
          <Plus size={17} />
          Add a recipe
        </Link>
      </div>
      <section className="dashboard-hero">
        <div className="hero-copy">
          <span className="hero-eyebrow">
            <span /> GOOD FOOD. LESS FUSS.
          </span>
          <h2>
            A little prep today.
            <br />
            <em>More time tomorrow.</em>
          </h2>
          <p>
            Your favourite recipes, a thoughtful plan, and
            <br className="desktop-break" /> one less thing on your plate.
          </p>
          <Link className="btn btn-primary" href="/meal-prep">
            Let’s plan a few days <ArrowRight size={16} />
          </Link>
          <div className="hero-footnote">
            <span className="hero-avatars">
              {data.members.slice(0, 2).map((m) => (
                <i key={m.id}>{m.name[0]}</i>
              ))}
            </span>
            Better when it’s shared.
          </div>
        </div>
        <div className="hero-photo">
          <img
            src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1400&q=90"
            alt="A colourful bowl of fresh vegetables"
            fetchPriority="high"
          />
          <div className="hero-photo-label">
            <span className="label-dot" /> A FRESH START, EVERY DAY
          </div>
        </div>
      </section>
      <section className="kitchen-stats" aria-label="Your kitchen at a glance">
        {[
          {
            icon: BookOpen,
            value: data.recipes.length,
            label: "recipes to come home to",
            href: "/recipes",
          },
          {
            icon: Heart,
            value: favourites.length,
            label: "tried & loved favourites",
            href: "/recipes?favourites=true",
          },
          {
            icon: CalendarDays,
            value: plan ? `${plan.days} days` : "A fresh week",
            label: plan
              ? "planned with a little care"
              : "ready for a little planning",
            href: "/meal-prep",
          },
        ].map(({ icon: Icon, value, label, href }) => (
          <Link className="stat" href={href} key={href}>
            <span className="stat-icon">
              <Icon size={21} />
            </span>
            <div>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
            <ArrowUpRight size={17} />
          </Link>
        ))}
      </section>
      <div className="section-heading">
        <div>
          <span className="eyebrow">FROM YOUR RECIPE BOOK</span>
          <h2>
            Recently added<span className="heading-dot">.</span>
          </h2>
        </div>
        <Link href="/recipes">
          View all recipes <ArrowRight size={16} />
        </Link>
      </div>
      {recent.length ? (
        <div className="recipe-grid">
          {recent.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      ) : (
        <EmptyState />
      )}
      <div className="dashboard-bottom">
        <section className="prep-preview">
          <div className="section-heading compact">
            <h2>
              <CalendarDays size={21} />A few days, sorted.
            </h2>
            <Link href="/meal-prep">
              <ArrowUpRight size={19} />
              <span className="sr-only">Open meal prep</span>
            </Link>
          </div>
          {plan ? (
            <>
              <span className="pill">
                {dateLabel(plan.startDate)} —{" "}
                {dateLabel(addDays(plan.startDate, plan.days - 1))}
              </span>
              <h3>{plan.title}</h3>
              <ul className="upcoming-meals">
                {plan.entries
                  .filter((e) => e.date >= localDate())
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .slice(0, 2)
                  .map((e) => (
                    <li key={e.id}>
                      <span>
                        {dateLabel(e.date)} · {e.slot}
                      </span>
                      <strong>
                        {data.recipes.find((r) => r.id === e.recipeId)?.title ||
                          "Recipe unavailable"}
                      </strong>
                    </li>
                  ))}
              </ul>
              <p>
                {portions(plan)} portions ·{" "}
                {new Set(plan.entries.map((e) => e.recipeId)).size} recipes ·{" "}
                {data.members.length} people
              </p>
              <Link className="text-link" href="/meal-prep">
                Open your plan <ArrowRight size={15} />
              </Link>
            </>
          ) : (
            <>
              <p>
                A calmer week starts with a small plan. Choose your recipes and
                we’ll work out the portions.
              </p>
              <Link href="/meal-prep" className="btn btn-secondary">
                <Plus size={16} />
                Start a meal-prep plan
              </Link>
            </>
          )}
        </section>
        <section className="inspiration-card">
          <span className="eyebrow">
            <Sparkles size={14} /> A LITTLE KITCHEN INSPIRATION
          </span>
          <h2>{suggestion ? "Short on time?" : "What’s in your fridge?"}</h2>
          <p>
            {suggestion
              ? `Try ${suggestion.title.toLowerCase()} — ${suggestion.prepMinutes + suggestion.cookMinutes} minutes from start to finish.`
              : "Turn the ingredients you have into something you’ll love, with a little help from your kitchen assistant."}
          </p>
          <Link
            className="text-link"
            href={suggestion ? `/recipes/${suggestion.id}` : "/assistant"}
          >
            {suggestion ? "Take a look" : "Find some inspiration"}{" "}
            <ArrowRight size={15} />
          </Link>
          <Clock className="inspiration-decoration" size={85} />
        </section>
      </div>
      {favourites.length > 0 && (
        <section className="favourites-strip">
          <div className="section-heading">
            <h2>Tried, loved, repeated.</h2>
            <Link href="/recipes?favourites=true">
              Your favourites <ArrowRight size={15} />
            </Link>
          </div>
          <div>
            {favourites.slice(0, 3).map((r) => (
              <Link href={`/recipes/${r.id}`} key={r.id}>
                <div className="favourite-mini-photo">
                  <RecipeImage recipe={r} />
                </div>
                <span>{r.title}</span>
                <Heart size={14} />
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
