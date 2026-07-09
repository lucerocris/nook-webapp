import { createClient } from "@/lib/supabase/server";
import NavbarShell from "./NavbarShell";

export default async function Navbar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email =
    typeof data?.claims?.email === "string" ? data.claims.email : null;

  return <NavbarShell userEmail={email} />;
}
