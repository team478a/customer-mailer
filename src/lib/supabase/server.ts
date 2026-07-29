import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getServerEnvironment } from "../server/environment";

export async function createSupabaseServerClient() {
  const environment = getServerEnvironment();
  if (!environment.supabaseUrl || !environment.supabasePublishableKey) {
    throw new Error("Supabase is not configured.");
  }
  const cookieStore = await cookies();
  return createServerClient(
    environment.supabaseUrl,
    environment.supabasePublishableKey,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components cannot write cookies. Route Handlers and
            // Server Actions refresh them through the same client factory.
          }
        },
      },
    },
  );
}
