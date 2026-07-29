import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnvironment } from "../server/environment";

export function createSupabaseAdminClient() {
  const environment = getServerEnvironment();
  if (!environment.supabaseUrl || !environment.supabaseServiceRoleKey) {
    throw new Error("Supabase admin client is not configured.");
  }
  return createClient(
    environment.supabaseUrl,
    environment.supabaseServiceRoleKey,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
