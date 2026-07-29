"use server";

import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/server/environment";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signIn(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/dashboard");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/?error=${encodeURIComponent("ログインに失敗しました。")}`);
  redirect("/dashboard");
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}
