import {
  isValidEmail,
  normalizeEmail,
} from "../../customers/application/customers";
import {
  SuppressionEntry,
  SuppressionReason,
} from "../domain/suppression";

export function addSuppression(
  entries: SuppressionEntry[],
  email: string,
  reason: SuppressionReason,
):
  | { ok: true; entries: SuppressionEntry[]; entry: SuppressionEntry }
  | { ok: false; message: string } {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    return { ok: false, message: "正しいメールアドレスを入力してください。" };
  }
  if (entries.some((entry) => entry.email === normalized)) {
    return { ok: false, message: "このアドレスはすでに除外されています。" };
  }
  const entry: SuppressionEntry = {
    id: crypto.randomUUID(),
    email: normalized,
    reason,
    createdAt: new Date().toISOString(),
  };
  return { ok: true, entries: [entry, ...entries], entry };
}

export function isSuppressed(entries: SuppressionEntry[], email: string) {
  const normalized = normalizeEmail(email);
  return entries.some((entry) => entry.email === normalized);
}
