import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getServerEnvironment } from "@/lib/server/environment";

export const runtime = "nodejs";

type ResendWebhookEvent = {
  type?: string;
  created_at?: string;
  data?: {
    email_id?: string;
    to?: string[];
  };
};

export async function POST(request: Request) {
  const environment = getServerEnvironment();
  if (!environment.resendApiKey || !environment.resendWebhookSecret) {
    return new NextResponse("Webhook is not configured.", { status: 503 });
  }
  const payload = await request.text();
  let event: ResendWebhookEvent;
  try {
    event = new Resend(environment.resendApiKey).webhooks.verify({
      payload,
      headers: {
        id: request.headers.get("svix-id") ?? "",
        timestamp: request.headers.get("svix-timestamp") ?? "",
        signature: request.headers.get("svix-signature") ?? "",
      },
      webhookSecret: environment.resendWebhookSecret,
    }) as ResendWebhookEvent;
  } catch {
    return new NextResponse("Invalid webhook signature.", { status: 400 });
  }
  const eventId = request.headers.get("svix-id");
  if (!eventId) return new NextResponse("Missing event id.", { status: 400 });

  const admin = createSupabaseAdminClient();
  const { error: eventError } = await admin.from("webhook_events").insert({
    id: eventId,
    provider: "resend",
    event_type: event.type ?? "unknown",
    provider_message_id: event.data?.email_id ?? null,
    payload: JSON.parse(payload),
    occurred_at: event.created_at ?? new Date().toISOString(),
  });
  if (eventError?.code === "23505") {
    return NextResponse.json({ received: true, duplicate: true });
  }
  if (eventError) {
    return new NextResponse("Unable to store webhook.", { status: 500 });
  }

  const messageId = event.data?.email_id;
  if (messageId) {
    const failure =
      event.type === "email.bounced" || event.type === "email.complained";
    if (failure) {
      const { data: recipient } = await admin
        .from("delivery_recipients")
        .select("id,email,delivery_id")
        .eq("provider_message_id", messageId)
        .maybeSingle();
      if (recipient) {
        await admin
          .from("delivery_recipients")
          .update({
            status: "failed",
            error_message:
              event.type === "email.bounced"
                ? "Resend: バウンス"
                : "Resend: 迷惑メール報告",
          })
          .eq("id", recipient.id);
        const { data: delivery } = await admin
          .from("deliveries")
          .select("project_id")
          .eq("id", recipient.delivery_id)
          .single();
        if (delivery) {
          await admin.from("suppression_list").upsert(
            {
              project_id: delivery.project_id,
              email: recipient.email,
              reason:
                event.type === "email.bounced"
                  ? "バウンス"
                  : "迷惑メール報告",
            },
            { onConflict: "project_id,normalized_email" },
          );
        }
      }
    }
  }
  return NextResponse.json({ received: true });
}
