import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export const getCurrentUserId = cache(async (): Promise<string | undefined> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const sub = data?.claims?.sub;
  return typeof sub === "string" ? sub : undefined;
});
