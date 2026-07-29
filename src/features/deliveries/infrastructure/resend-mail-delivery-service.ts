import "server-only";
import { Resend } from "resend";
import {
  MailDeliveryService,
  SendMailInput,
  SendMailResult,
} from "../application/mail-delivery-service";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export class ResendMailDeliveryService implements MailDeliveryService {
  private readonly resend: Resend;

  constructor(apiKey: string) {
    this.resend = new Resend(apiKey);
  }

  async send(input: SendMailInput): Promise<SendMailResult> {
    if (!input.fromEmail) {
      return {
        ok: false,
        errorMessage: "送信元メールアドレスが設定されていません。",
        retryable: false,
      };
    }
    const from = input.fromName
      ? `${input.fromName} <${input.fromEmail}>`
      : input.fromEmail;
    try {
      const { data, error } = await this.resend.emails.send(
        {
          from,
          to: [input.to],
          subject: input.subject,
          text: input.body,
          html: `<div style="white-space:pre-wrap">${escapeHtml(input.body)}</div>`,
          replyTo: input.replyTo || undefined,
        },
        { idempotencyKey: input.idempotencyKey },
      );
      if (error || !data?.id) {
        return {
          ok: false,
          errorMessage: error?.message ?? "Resendから送信IDが返りませんでした。",
          retryable: true,
        };
      }
      return { ok: true, providerMessageId: data.id };
    } catch (error) {
      return {
        ok: false,
        errorMessage:
          error instanceof Error ? error.message : "メール送信に失敗しました。",
        retryable: true,
      };
    }
  }
}
