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

const recipientStatusByEvent = {
  "email.sent": "sent",
  "email.delivered": "delivered",
  "email.delivery_delayed": "delayed",
  "email.failed": "failed",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.suppressed": "suppressed",
} as const;

async function refreshDeliveryStatus(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  deliveryId: string,
) {
  const { data } = await admin
    .from("delivery_recipients")
    .select("status")
    .eq("delivery_id", deliveryId);
  if (!data?.length) return;
  const failedStatuses = new Set(["failed", "bounced", "complained", "suppressed"]);
  const failed = data.filter((row) => failedStatuses.has(String(row.status))).length;
  const status = failed === data.length
    ? "failed"
    : failed > 0
      ? "partially_failed"
      : "sent";
  await admin.from("deliveries").update({ status }).eq("id", deliveryId);
}

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
    const nextStatus = recipientStatusByEvent[
      event.type as keyof typeof recipientStatusByEvent
    ];
    if (nextStatus) {
      const { data: recipient } = await admin
        .from("delivery_recipients")
        .select("id,email,delivery_id,status")
        .eq("provider_message_id", messageId)
        .maybeSingle();
      if (recipient) {
        const occurredAt = event.created_at ?? new Date().toISOString();
        const isFailure = ["failed", "bounced", "complained", "suppressed"].includes(nextStatus);
        const shouldUpdateStatus = !(
          recipient.status === "delivered" &&
          (nextStatus === "sent" || nextStatus === "delayed")
        );
        await admin
          .from("delivery_recipients")
          .update({
            ...(shouldUpdateStatus ? { status: nextStatus } : {}),
            last_event_at: occurredAt,
            ...(nextStatus === "delivered" ? { delivered_at: occurredAt, error_message: null } : {}),
            ...(isFailure ? {
              error_message: event.type === "email.bounced"
                ? "Resend: バウンス"
                : event.type === "email.complained"
                  ? "Resend: 迷惑メール報告"
                  : event.type === "email.suppressed"
                    ? "Resend: 配信停止"
                    : "Resend: 配信失敗",
            } : {}),
          })
          .eq("id", recipient.id);
        await refreshDeliveryStatus(admin, recipient.delivery_id);
        const suppress = ["email.bounced", "email.complained", "email.suppressed"].includes(event.type ?? "");
        const { data: delivery } = suppress ? await admin
          .from("deliveries")
          .select("project_id")
          .eq("id", recipient.delivery_id)
          .single() : { data: null };
        if (delivery) {
          await admin.from("suppression_list").upsert(
            {
              project_id: delivery.project_id,
              email: recipient.email,
              reason: event.type === "email.bounced"
                ? "バウンス"
                : event.type === "email.complained"
                  ? "迷惑メール報告"
                  : "配信停止希望",
            },
            { onConflict: "project_id,normalized_email" },
          );
        }
      }
    }
  }
  return NextResponse.json({ received: true });
}
