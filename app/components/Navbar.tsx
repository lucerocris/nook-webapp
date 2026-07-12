import { createClient } from "@/lib/supabase/server";
import { getSearchTags } from "@/lib/data/search";
import NavbarShell from "./NavbarShell";

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

  return <NavbarShell userEmail={email} tags={tags} />;
}
