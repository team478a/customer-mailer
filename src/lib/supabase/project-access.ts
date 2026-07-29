import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function assertProjectAccess(
  admin: SupabaseClient,
  projectId: string,
  userId: string,
  ownerOnly = false,
) {
  let query = admin
    .from("project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId);
  if (ownerOnly) query = query.eq("role", "owner");
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("このプロジェクトを操作する権限がありません。");
  return data.role as "owner" | "member";
}
