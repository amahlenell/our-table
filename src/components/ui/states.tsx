import Link from "next/link";
import { BookOpen, Leaf, Plus } from "lucide-react";
export function LoadingSkeleton() {
  return (
    <div aria-label="Loading your kitchen" className="skeleton-grid">
      {Array.from({ length: 6 }, (_, i) => (
        <div className="skeleton" key={i} />
      ))}
    </div>
  );
}
export function EmptyState({
  title = "A little room for inspiration",
  description = "Save your first recipe and make yourself at home.",
  href = "/recipes/new",
  action = "Add a recipe",
}: {
  title?: string;
  description?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty-state">
      <BookOpen size={34} />
      <h2>{title}</h2>
      <p>{description}</p>
      {href && (
        <Link href={href} className="btn btn-primary">
          <Plus size={16} />
          {action}
        </Link>
      )}
    </div>
  );
}
export function SetupState() {
  return (
    <div className="setup-state">
      <Leaf size={42} />
      <span className="eyebrow">WELCOME TO OUR TABLE</span>
      <h1>
        Your kitchen,
        <br />
        <em>beautifully organised.</em>
      </h1>
      <p>
        Connect Supabase to create your household and start your shared recipe
        book.
      </p>
      <p className="muted">
        Setup instructions are included in README.md. To explore the local
        sample kitchen, set NEXT_PUBLIC_DEMO_MODE=true in .env.local.
      </p>
    </div>
  );
}
