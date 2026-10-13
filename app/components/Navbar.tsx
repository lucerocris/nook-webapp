import { createClient } from "@/lib/supabase/server";
import { getSearchTags } from "@/lib/data/search";
import NavbarShell from "./NavbarShell";
import AnalyticsIdentity from "./AnalyticsIdentity";
import type { AnalyticsUser } from "@/lib/analytics";

export default async function Navbar() {
  const supabase = await createClient();
  const [claims, tags] = await Promise.all([
    supabase.auth.getClaims(),
    getSearchTags(),
  ]);
  const email =
    typeof claims.data?.claims?.email === "string"
      ? claims.data.claims.email
      : null;

  return (
    <>
      <NavbarShell userEmail={email} tags={tags} />
      <AnalyticsIdentity user={analyticsUser(claims.data?.claims, email)} />
    </>
  );
}

/** The signed-in user as nook-mobile identifies them: Supabase user id as the
 * distinct id; email and name (user_metadata.name, else full_name) as person
 * properties. Read from the JWT claims already in hand, no extra round trip. */
function analyticsUser(
  claims: Record<string, unknown> | undefined,
  email: string | null,
): AnalyticsUser | null {
  const id = claims?.sub;
  if (typeof id !== "string" || !id) return null;
  const metadata = (claims?.user_metadata ?? {}) as Record<string, unknown>;
  const rawName = metadata.name ?? metadata.full_name;
  const name = typeof rawName === "string" && rawName.trim() ? rawName.trim() : null;
  return { id, email: email?.trim() || null, name };
}
