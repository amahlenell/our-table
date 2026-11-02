import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function uid() {
  return crypto.randomUUID();
}
export function formatNumber(n: number | null, digits = 1) {
  return n === null
    ? "—"
    : new Intl.NumberFormat("en-NZ", { maximumFractionDigits: digits }).format(
        n,
      );
}
export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function dateLabel(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-NZ", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
