"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  CalendarDays,
  ChefHat,
  Heart,
  LayoutGrid,
  Leaf,
  Plus,
  Settings,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { useApp } from "@/features/app-provider";
import { SetupState, LoadingSkeleton } from "@/components/ui/states";
import { Brand } from "./brand";
import type { ReactNode } from "react";
const nav = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/recipes", label: "Recipe library", icon: BookOpen },
  { href: "/meal-prep", label: "Meal prep", icon: CalendarDays },
  { href: "/assistant", label: "Kitchen assistant", icon: Sparkles },
  { href: "/recipes?favourites=true", label: "Favourites", icon: Heart },
];
export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { data, demo, configured, loading, error, refresh } = useApp();
  if (path.startsWith("/auth") || path.endsWith("/cook")) return children;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-label">YOUR EVERYDAY KITCHEN</div>
        <nav aria-label="Main navigation">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${(href === "/" ? path === "/" : href.includes("?") ? false : path.startsWith(href)) ? "active" : ""}`}
            >
              <Icon size={19} />
              {label}
              {label === "Kitchen assistant" && (
                <span className="tiny-badge">AI</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="note-icon">
            <ChefHat size={23} />
          </span>
          <h3>
            A little prep.
            <br />A lot more living.
          </h3>
          <p>
            Make room for the meals
            <br />
            and moments you love.
          </p>
          <Link href="/meal-prep">
            Plan your week <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="sidebar-bottom">
          <Link
            href="/settings"
            className={`nav-link ${path === "/settings" ? "active" : ""}`}
          >
            <Settings size={19} />
            Settings
          </Link>
          <Link href="/settings" className="household-card">
            <div className="avatar">{data.profile.name.charAt(0)}</div>
            <div>
              <strong>{data.household?.name || "Your household"}</strong>
              <span>
                {data.members.length || 1}{" "}
                {data.members.length === 1 ? "member" : "members"} ·{" "}
                {demo ? "Sample kitchen" : "Shared kitchen"}
              </span>
            </div>
            <span className="online-dot" />
          </Link>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <div className="mobile-brand">
            <Brand />
          </div>
          <span className="topbar-caption">
            <span className="status-dot" />
            {demo ? "Your sample kitchen" : "Good food starts at home"}
          </span>
          <div className="topbar-right">
            <Link href="/recipes/new" className="quick-add">
              <Plus size={16} />
              Add recipe
            </Link>
            <Link
              href="/settings"
              className="avatar small"
              aria-label="Account settings"
            >
              {data.profile.name.charAt(0)}
            </Link>
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            LOCAL DEMO{" "}
            <span>
              Sample recipes · changes stay in this browser · nutrition starts
              unlinked
            </span>
          </div>
        )}
        <main id="main-content" className="main-content">
          {!configured && !demo ? (
            <SetupState />
          ) : loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <div className="error-panel" role="alert">
              <h2>We couldn’t open your kitchen</h2>
              <p>{error}</p>
              <button
                className="btn btn-secondary"
                onClick={() => void refresh()}
              >
                Try again
              </button>{" "}
              <Link href="/auth/login">Sign in</Link>
            </div>
          ) : (
            <>
              {configured && !data.household && path !== "/settings" && (
                <div className="callout">
                  Your shared kitchen starts with a household.{" "}
                  <Link className="text-link" href="/settings">
                    Create or join one →
                  </Link>
                </div>
              )}
              {children}
            </>
          )}
        </main>
        <footer className="app-footer">
          <Leaf size={13} />
          <span>A home for your favourite food.</span>
          <span>Made for your everyday.</span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.slice(0, 4).map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={path === href ? "active" : ""}
          >
            <Icon size={20} />
            <span>
              {label === "Kitchen assistant"
                ? "Assistant"
                : label === "Recipe library"
                  ? "Recipes"
                  : label}
            </span>
          </Link>
        ))}
        <Link href="/settings">
          <Settings size={20} />
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
}
