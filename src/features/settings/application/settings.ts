import { isValidEmail } from "../../customers/application/customers";
import {
  ProjectSecrets,
  ProjectSettings,
} from "../domain/project-settings";

export type SettingsValidationResult =
  | { ok: true }
  | { ok: false; errors: string[] };

export function validateProjectSettings(
  settings: ProjectSettings,
  secrets: ProjectSecrets,
): SettingsValidationResult {
  const errors: string[] = [];
  if (settings.fromEmail && !isValidEmail(settings.fromEmail)) {
    errors.push("送信元メールアドレスの形式が不正です。");
  }
  if (settings.replyTo && !isValidEmail(settings.replyTo)) {
    errors.push("返信先メールアドレスの形式が不正です。");
  }
  if (settings.batchSize < 1 || settings.batchSize > 100) {
    errors.push("1回の処理件数は1〜100件で指定してください。");
  }
  if (settings.delayMs < 0 || settings.delayMs > 60000) {
    errors.push("送信間隔は0〜60,000ミリ秒で指定してください。");
  }
  if (settings.mailProvider === "resend") {
    if (!settings.fromEmail) {
      errors.push("Resend利用時は送信元メールアドレスが必要です。");
    }
    if (!secrets.resendApiKey.startsWith("re_")) {
      errors.push("Resend APIキーはre_で始まる値を設定してください。");
    }
  }
  if (settings.dataProvider === "supabase") {
    try {
      const url = new URL(settings.supabaseUrl);
      if (url.protocol !== "https:") throw new Error();
    } catch {
      errors.push("Supabase URLには有効なHTTPS URLを設定してください。");
    }
    if (!settings.supabaseAnonKey.trim()) {
      errors.push("Supabase anon keyを設定してください。");
    }
  }
  return errors.length ? { ok: false, errors } : { ok: true };
}

export function maskSecret(value: string) {
  if (!value) return "未設定";
  if (value.length <= 8) return "••••••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export function applyMailSettings(
  subject: string,
  body: string,
  settings: ProjectSettings,
) {
  const configuredSubject = [settings.subjectPrefix.trim(), subject.trim()]
    .filter(Boolean)
    .join(" ");
  const configuredBody = [
    body.trim(),
    settings.signature.trim(),
    settings.footer.trim(),
    settings.includeUnsubscribeFooter
      ? "配信停止をご希望の場合は、このメールへご返信ください。"
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
  return { subject: configuredSubject, body: configuredBody };
}
