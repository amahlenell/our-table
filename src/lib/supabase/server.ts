import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export const configured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
export async function supabase() {
  if (!configured())
    throw new Error("Connect Supabase to use shared accounts. See README.md.");
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Proxy handles cookie refresh in server components. */
          }
        },
      },
    },
  );
}
export async function requireUser() {
  const db = await supabase();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new Error("Please sign in to continue.");
  return { db, user };
}
export async function requireHousehold() {
  const { db, user } = await requireUser();
  const { data, error } = await db
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();
  if (error || !data) throw new Error("Create or join a household first.");
  return { db, user, householdId: data.household_id as string };
}
