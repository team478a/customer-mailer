import { NextResponse } from "next/server";
import {
  getServerEnvironment,
  isResendConfigured,
  isSupabaseConfigured,
} from "@/lib/server/environment";

export async function GET() {
  const environment = getServerEnvironment();
  return NextResponse.json(
    {
      mode: isSupabaseConfigured(environment) ? "server" : "local",
      supabaseConfigured: isSupabaseConfigured(environment),
      resendConfigured: isResendConfigured(environment),
      webhookConfigured: Boolean(environment.resendWebhookSecret),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
