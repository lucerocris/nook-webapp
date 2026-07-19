import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/env";

export function createClient() {
  return createBrowserClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
  );
}
