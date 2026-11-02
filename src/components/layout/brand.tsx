import Link from "next/link";
import { Utensils } from "lucide-react";
export function Brand() {
  return (
    <Link href="/" className="brand" aria-label="Our Table home">
      <span className="brand-icon">
        <Utensils size={22} strokeWidth={1.7} />
      </span>
      <span>
        Our Table<span className="brand-dot">.</span>
      </span>
    </Link>
  );
}
