import { NextResponse } from "next/server";
import { getServerEnvironment, isResendConfigured } from "@/lib/server/environment";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseServerDeliveryRequest } from "@/features/deliveries/application/server-delivery-request";
import { ResendMailDeliveryService } from "@/features/deliveries/infrastructure/resend-mail-delivery-service";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ error: "許可されていない送信元です。" }, { status: 403 });
  }
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "JSON形式が必要です。" }, { status: 415 });
  }
  const environment = getServerEnvironment();
  if (!isResendConfigured(environment)) {
    return NextResponse.json(
      { error: "Resendのサーバー設定が完了していません。" },
      { status: 503 },
    );
  }
  const parsed = parseServerDeliveryRequest(await request.json().catch(() => null));
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.message }, { status: 400 });
  }
  const input = parsed.value;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "認証が必要です。" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("deliveries")
    .select("id,status")
    .eq("project_id", input.projectId)
    .eq("idempotency_key", input.requestId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({ deliveryId: existing.id, status: existing.status });
  }

  const { data: suppressedRows, error: suppressionError } = await supabase
    .from("suppression_list")
    .select("normalized_email")
    .eq("project_id", input.projectId);
  if (suppressionError) {
    return NextResponse.json({ error: suppressionError.message }, { status: 403 });
  }
  const suppressed = new Set(
    (suppressedRows ?? []).map((row) => String(row.normalized_email)),
  );
  const recipients = input.recipients.filter(
    (recipient) => !suppressed.has(recipient.email.trim().toLowerCase()),
  );
  if (!recipients.length) {
    return NextResponse.json(
      { error: "すべての宛先が配信停止リストに登録されています。" },
      { status: 400 },
    );
  }

  const { data: delivery, error: deliveryError } = await supabase
    .from("deliveries")
    .insert({
      project_id: input.projectId,
      subject: input.subject,
      body: input.body,
      status: "sending",
      created_by: user.id,
      idempotency_key: input.requestId,
      from_name: input.fromName,
      from_email: input.fromEmail,
      reply_to: input.replyTo || null,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (deliveryError) {
    if (deliveryError.code === "23505") {
      return NextResponse.json(
        { error: "同じ送信要求はすでに受け付けています。" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: deliveryError.message }, { status: 403 });
  }

  const { data: recipientRows, error: recipientError } = await supabase
    .from("delivery_recipients")
    .insert(
      recipients.map((recipient) => ({
        delivery_id: delivery.id,
        customer_id: recipient.customerId,
        customer_name: recipient.customerName,
        email: recipient.email,
        personalized_subject: recipient.subject,
        personalized_body: recipient.body,
        status: "queued",
      })),
    )
    .select("id,email");
  if (recipientError || !recipientRows) {
    await supabase
      .from("deliveries")
      .update({ status: "failed", completed_at: new Date().toISOString() })
      .eq("id", delivery.id);
    return NextResponse.json(
      { error: recipientError?.message ?? "宛先を登録できませんでした。" },
      { status: 500 },
    );
  }

  const service = new ResendMailDeliveryService(environment.resendApiKey);
  let succeeded = 0;
  for (const row of recipientRows) {
    const recipient = recipients.find((item) => item.email === row.email);
    if (!recipient) continue;
    const result = await service.send({
      customerId: recipient.customerId,
      customerName: recipient.customerName,
      to: recipient.email,
      subject: recipient.subject,
      body: recipient.body,
      fromName: input.fromName,
      fromEmail: input.fromEmail,
      replyTo: input.replyTo,
      idempotencyKey: `${input.requestId}-${row.id}`,
    });
    const sentAt = new Date().toISOString();
    await supabase
      .from("delivery_recipients")
      .update(
        result.ok
          ? {
              status: "sent",
              provider_message_id: result.providerMessageId,
              attempt_count: 1,
              last_attempt_at: sentAt,
              sent_at: sentAt,
            }
          : {
              status: "failed",
              error_message: result.errorMessage,
              attempt_count: 1,
              last_attempt_at: sentAt,
            },
      )
      .eq("id", row.id);
    if (result.ok) succeeded += 1;
  }
  const completedAt = new Date().toISOString();
  const status =
    succeeded === recipients.length
      ? "sent"
      : succeeded === 0
        ? "failed"
        : "partially_failed";
  await supabase
    .from("deliveries")
    .update({ status, completed_at: completedAt })
    .eq("id", delivery.id);
  await supabase.from("audit_logs").insert({
    project_id: input.projectId,
    actor_id: user.id,
    action: "delivery.sent",
    entity_type: "delivery",
    entity_id: delivery.id,
    metadata: {
      sent: succeeded,
      failed: recipients.length - succeeded,
      suppressed: input.recipients.length - recipients.length,
    },
  });

  return NextResponse.json({
    deliveryId: delivery.id,
    status,
    sent: succeeded,
    failed: recipients.length - succeeded,
    suppressed: input.recipients.length - recipients.length,
  });
}
