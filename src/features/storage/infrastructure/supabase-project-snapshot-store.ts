import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_PROJECT_SETTINGS } from "../../settings/domain/project-settings";
import { ProjectSnapshot, RemoteProjectSummary } from "../domain/project-snapshot";

const customerStatusToDb = {
  未対応: "pending",
  対応中: "in_progress",
  完了: "completed",
} as const;
const customerStatusFromDb = {
  pending: "未対応",
  in_progress: "対応中",
  completed: "完了",
} as const;
const batchStatusToDb = {
  送信待ち: "queued",
  送信中: "sending",
  送信済み: "sent",
  一部失敗: "partially_failed",
  失敗: "failed",
} as const;
const batchStatusFromDb = {
  draft: "送信待ち",
  queued: "送信待ち",
  sending: "送信中",
  sent: "送信済み",
  partially_failed: "一部失敗",
  failed: "失敗",
} as const;

const recipientStatusFromDb = {
  queued: "送信待ち",
  sending: "送信中",
  sent: "送信済み",
  delivered: "配達済み",
  delayed: "遅延",
  suppressed: "配信停止",
  bounced: "バウンス",
  complained: "迷惑メール報告",
  failed: "失敗",
} as const;

const recipientStatusToDb = {
  送信待ち: "queued",
  送信中: "sending",
  送信済み: "sent",
  配達済み: "delivered",
  遅延: "delayed",
  配信停止: "suppressed",
  バウンス: "bounced",
  迷惑メール報告: "complained",
  失敗: "failed",
} as const;

function assertNoError(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export async function listRemoteProjects(
  supabase: SupabaseClient,
  userId: string,
): Promise<RemoteProjectSummary[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select("role,projects(id,name,created_at)")
    .eq("user_id", userId)
    .order("created_at", { referencedTable: "projects", ascending: true });
  assertNoError(error);
  return (data ?? []).flatMap((row) => {
    const project = Array.isArray(row.projects) ? row.projects[0] : row.projects;
    if (!project) return [];
    return [{
      id: String(project.id),
      name: String(project.name),
      createdAt: String(project.created_at),
      role: row.role as "owner" | "member",
    }];
  });
}

export async function loadProjectSnapshot(
  supabase: SupabaseClient,
  projectId: string,
): Promise<ProjectSnapshot> {
  const [
    projectResult,
    customerResult,
    templateResult,
    draftResult,
    settingsResult,
    deliveryResult,
    recipientResult,
    suppressionResult,
  ] = await Promise.all([
    supabase.from("projects").select("id,name,created_at").eq("id", projectId).single(),
    supabase.from("customers").select("*").eq("project_id", projectId).order("created_at"),
    supabase.from("mail_templates").select("*").eq("project_id", projectId).order("created_at"),
    supabase.from("drafts").select("*").eq("project_id", projectId).maybeSingle(),
    supabase.from("project_settings").select("*").eq("project_id", projectId).maybeSingle(),
    supabase.from("deliveries").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    supabase.from("delivery_recipients").select("*,deliveries!inner(project_id)").eq("deliveries.project_id", projectId),
    supabase.from("suppression_list").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
  ]);
  [
    projectResult,
    customerResult,
    templateResult,
    draftResult,
    settingsResult,
    deliveryResult,
    recipientResult,
    suppressionResult,
  ].forEach((result) => assertNoError(result.error));
  const project = projectResult.data;
  if (!project) throw new Error("プロジェクトが見つかりません。");
  const recipients = recipientResult.data ?? [];
  const batches = (deliveryResult.data ?? []).map((batch) => ({
    id: String(batch.id),
    subject: String(batch.subject),
    body: String(batch.body),
    createdAt: String(batch.created_at),
    completedAt: batch.completed_at ? String(batch.completed_at) : undefined,
    status:
      batchStatusFromDb[batch.status as keyof typeof batchStatusFromDb] ??
      "送信待ち",
    fromName: batch.from_name ? String(batch.from_name) : undefined,
    fromEmail: batch.from_email ? String(batch.from_email) : undefined,
    replyTo: batch.reply_to ? String(batch.reply_to) : undefined,
    recipients: recipients
      .filter((recipient) => recipient.delivery_id === batch.id)
      .map((recipient) => ({
        id: String(recipient.id),
        customerId: recipient.customer_id ? String(recipient.customer_id) : "",
        customerName: String(recipient.customer_name),
        email: String(recipient.email),
        status: recipientStatusFromDb[
          recipient.status as keyof typeof recipientStatusFromDb
        ] ?? "失敗",
        providerMessageId: recipient.provider_message_id
          ? String(recipient.provider_message_id)
          : undefined,
        errorMessage: recipient.error_message
          ? String(recipient.error_message)
          : undefined,
        deliveredAt: recipient.delivered_at ? String(recipient.delivered_at) : undefined,
        lastEventAt: recipient.last_event_at ? String(recipient.last_event_at) : undefined,
      })),
  }));
  const settingsRow = settingsResult.data;
  return {
    project: {
      id: String(project.id),
      name: String(project.name),
      createdAt: String(project.created_at),
    },
    customers: (customerResult.data ?? []).map((customer) => ({
      id: String(customer.id),
      name: String(customer.name),
      email: String(customer.email),
      orderNumber: String(customer.order_number),
      status:
        customerStatusFromDb[
          customer.status as keyof typeof customerStatusFromDb
        ] ?? "未対応",
      createdAt: String(customer.created_at),
    })),
    templates: (templateResult.data ?? []).map((template) => ({
      id: String(template.id),
      name: String(template.name),
      subject: String(template.subject),
      body: String(template.body),
    })),
    draft: {
      subject: String(draftResult.data?.subject ?? ""),
      body: String(draftResult.data?.body ?? ""),
    },
    settings: {
      ...DEFAULT_PROJECT_SETTINGS,
      dataProvider: "supabase",
      mailProvider: settingsRow?.mail_provider === "resend" ? "resend" : "local",
      fromName: String(settingsRow?.from_name ?? "MailSend"),
      fromEmail: String(settingsRow?.from_email ?? ""),
      replyTo: String(settingsRow?.reply_to ?? ""),
      subjectPrefix: String(settingsRow?.subject_prefix ?? ""),
      signature: String(settingsRow?.signature ?? ""),
      footer: String(settingsRow?.footer ?? ""),
      includeUnsubscribeFooter:
        settingsRow?.include_unsubscribe_footer ?? true,
      testMode: settingsRow?.test_mode ?? true,
      batchSize: Number(settingsRow?.batch_size ?? 20),
      delayMs: Number(settingsRow?.delay_ms ?? 500),
    },
    deliveryBatches: batches,
    deliveries: recipients.map((recipient) => ({
      id: String(recipient.id),
      batchId: String(recipient.delivery_id),
      customerId: recipient.customer_id ? String(recipient.customer_id) : undefined,
      customerName: String(recipient.customer_name),
      email: String(recipient.email),
      subject: String(recipient.personalized_subject),
      body: String(recipient.personalized_body),
      sentAt: String(recipient.sent_at ?? recipient.last_attempt_at ?? new Date(0).toISOString()),
      status: recipientStatusFromDb[
        recipient.status as keyof typeof recipientStatusFromDb
      ] ?? "失敗",
      errorMessage: recipient.error_message ? String(recipient.error_message) : undefined,
      retryCount: Math.max(0, Number(recipient.attempt_count ?? 1) - 1),
      deliveredAt: recipient.delivered_at ? String(recipient.delivered_at) : undefined,
      lastEventAt: recipient.last_event_at ? String(recipient.last_event_at) : undefined,
    })),
    suppressions: (suppressionResult.data ?? []).map((entry) => ({
      id: String(entry.id),
      email: String(entry.email),
      reason: String(entry.reason) as ProjectSnapshot["suppressions"][number]["reason"],
      createdAt: String(entry.created_at),
    })),
  };
}

async function deleteMissing(
  supabase: SupabaseClient,
  table: string,
  projectId: string,
  ids: string[],
) {
  let query = supabase.from(table).delete().eq("project_id", projectId);
  if (ids.length) query = query.not("id", "in", `(${ids.join(",")})`);
  const { error } = await query;
  assertNoError(error);
}

export async function saveProjectSnapshot(
  supabase: SupabaseClient,
  snapshot: ProjectSnapshot,
  userId: string,
) {
  const projectId = snapshot.project.id;
  assertNoError((await supabase.from("projects").update({ name: snapshot.project.name }).eq("id", projectId)).error);
  if (snapshot.customers.length) {
    assertNoError((await supabase.from("customers").upsert(
      snapshot.customers.map((customer) => ({
        id: customer.id,
        project_id: projectId,
        name: customer.name,
        email: customer.email,
        order_number: customer.orderNumber,
        status: customerStatusToDb[customer.status],
        created_at: customer.createdAt,
      })),
    )).error);
  }
  await deleteMissing(supabase, "customers", projectId, snapshot.customers.map((item) => item.id));
  if (snapshot.templates.length) {
    assertNoError((await supabase.from("mail_templates").upsert(
      snapshot.templates.map((template) => ({ ...template, project_id: projectId })),
    )).error);
  }
  await deleteMissing(supabase, "mail_templates", projectId, snapshot.templates.map((item) => item.id));
  assertNoError((await supabase.from("drafts").upsert({
    project_id: projectId,
    subject: snapshot.draft.subject,
    body: snapshot.draft.body,
  })).error);
  const settings = snapshot.settings;
  assertNoError((await supabase.from("project_settings").upsert({
    project_id: projectId,
    mail_provider: settings.mailProvider,
    data_provider: "supabase",
    from_name: settings.fromName,
    from_email: settings.fromEmail,
    reply_to: settings.replyTo,
    subject_prefix: settings.subjectPrefix,
    signature: settings.signature,
    footer: settings.footer,
    include_unsubscribe_footer: settings.includeUnsubscribeFooter,
    test_mode: settings.testMode,
    batch_size: settings.batchSize,
    delay_ms: settings.delayMs,
  })).error);
  if (snapshot.suppressions.length) {
    assertNoError((await supabase.from("suppression_list").upsert(
      snapshot.suppressions.map((entry) => ({
        id: entry.id,
        project_id: projectId,
        email: entry.email,
        reason: entry.reason,
        created_at: entry.createdAt,
      })),
    )).error);
  }
  await deleteMissing(supabase, "suppression_list", projectId, snapshot.suppressions.map((item) => item.id));

  if (snapshot.deliveryBatches.length) {
    assertNoError((await supabase.from("deliveries").upsert(
      snapshot.deliveryBatches.map((batch) => ({
        id: batch.id,
        project_id: projectId,
        subject: batch.subject,
        body: batch.body,
        status: batchStatusToDb[batch.status],
        created_by: userId,
        created_at: batch.createdAt,
        completed_at: batch.completedAt ?? null,
        from_name: batch.fromName ?? null,
        from_email: batch.fromEmail ?? null,
        reply_to: batch.replyTo ?? null,
      })),
    )).error);
    const recipients = snapshot.deliveryBatches.flatMap((batch) =>
      batch.recipients.map((recipient) => {
        const detail = snapshot.deliveries.find((item) => item.id === recipient.id);
        return {
          id: recipient.id,
          delivery_id: batch.id,
          customer_id: recipient.customerId || null,
          customer_name: recipient.customerName,
          email: recipient.email,
          personalized_subject: detail?.subject ?? batch.subject,
          personalized_body: detail?.body ?? batch.body,
          status: recipientStatusToDb[recipient.status],
          provider_message_id: recipient.providerMessageId ?? null,
          error_message: recipient.errorMessage ?? null,
          attempt_count: (detail?.retryCount ?? 0) + 1,
          last_attempt_at: detail?.lastRetriedAt ?? detail?.sentAt ?? batch.completedAt ?? batch.createdAt,
          sent_at: recipient.status === "送信済み" || recipient.status === "配達済み"
            ? detail?.sentAt ?? batch.completedAt ?? batch.createdAt
            : null,
          delivered_at: detail?.deliveredAt ?? recipient.deliveredAt ?? null,
          last_event_at: detail?.lastEventAt ?? recipient.lastEventAt ?? null,
        };
      }),
    );
    if (recipients.length) {
      assertNoError((await supabase.from("delivery_recipients").upsert(recipients)).error);
    }
  }
}
