import { isValidEmail } from "../../customers/application/customers";

export type ServerDeliveryRecipient = {
  customerId: string;
  customerName: string;
  email: string;
  subject: string;
  body: string;
};

export type ServerDeliveryRequest = {
  requestId: string;
  projectId: string;
  subject: string;
  body: string;
  fromName: string;
  fromEmail: string;
  replyTo: string;
  recipients: ServerDeliveryRecipient[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseServerDeliveryRequest(
  value: unknown,
):
  | { ok: true; value: ServerDeliveryRequest }
  | { ok: false; message: string } {
  if (!value || typeof value !== "object") {
    return { ok: false, message: "リクエスト形式が不正です。" };
  }
  const input = value as Record<string, unknown>;
  const recipients = Array.isArray(input.recipients) ? input.recipients : [];
  if (
    typeof input.requestId !== "string" ||
    !/^[a-zA-Z0-9_-]{8,100}$/.test(input.requestId) ||
    typeof input.projectId !== "string" ||
    !UUID_PATTERN.test(input.projectId) ||
    typeof input.subject !== "string" ||
    !input.subject.trim() ||
    typeof input.body !== "string" ||
    !input.body.trim() ||
    typeof input.fromEmail !== "string" ||
    !isValidEmail(input.fromEmail) ||
    recipients.length < 1 ||
    recipients.length > 100
  ) {
    return { ok: false, message: "送信内容または宛先を確認してください。" };
  }
  const parsedRecipients: ServerDeliveryRecipient[] = [];
  for (const recipient of recipients) {
    if (!recipient || typeof recipient !== "object") {
      return { ok: false, message: "宛先形式が不正です。" };
    }
    const item = recipient as Record<string, unknown>;
    if (
      typeof item.customerId !== "string" ||
      !UUID_PATTERN.test(item.customerId) ||
      typeof item.customerName !== "string" ||
      typeof item.email !== "string" ||
      !isValidEmail(item.email) ||
      typeof item.subject !== "string" ||
      typeof item.body !== "string"
    ) {
      return { ok: false, message: "宛先形式が不正です。" };
    }
    parsedRecipients.push(item as ServerDeliveryRecipient);
  }
  return {
    ok: true,
    value: {
      requestId: input.requestId,
      projectId: input.projectId,
      subject: input.subject,
      body: input.body,
      fromName: typeof input.fromName === "string" ? input.fromName : "",
      fromEmail: input.fromEmail,
      replyTo: typeof input.replyTo === "string" ? input.replyTo : "",
      recipients: parsedRecipients,
    },
  };
}
