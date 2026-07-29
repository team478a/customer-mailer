import "server-only";

export type ServerEnvironment = {
  supabaseUrl: string;
  supabasePublishableKey: string;
  supabaseServiceRoleKey: string;
  resendApiKey: string;
  resendWebhookSecret: string;
};

export function getServerEnvironment(): ServerEnvironment {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    supabasePublishableKey:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
    supabaseServiceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "",
    resendApiKey: process.env.RESEND_API_KEY?.trim() ?? "",
    resendWebhookSecret: process.env.RESEND_WEBHOOK_SECRET?.trim() ?? "",
  };
}

export function isSupabaseConfigured(environment = getServerEnvironment()) {
  return Boolean(
    environment.supabaseUrl && environment.supabasePublishableKey,
  );
}

export function isResendConfigured(environment = getServerEnvironment()) {
  return Boolean(environment.resendApiKey);
}
