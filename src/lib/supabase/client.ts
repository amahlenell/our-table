"use client";
import { createBrowserClient } from "@supabase/ssr";
// A full navigation resets account-scoped client state after session changes.
export function reloadForAuth(path: string) {
  window.location.assign(new URL(path, window.location.origin).href);
}
export function browserSupabase() {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    throw new Error("Supabase is not configured.");
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
