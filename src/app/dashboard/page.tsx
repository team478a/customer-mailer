import { MailDashboard } from "@/components/mail-dashboard";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/server/environment";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect("/");
  }
  return <MailDashboard />;
}
