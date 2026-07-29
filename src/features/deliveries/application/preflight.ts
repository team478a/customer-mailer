import { personalize } from "../../composer/application/composer";
import { Customer } from "../../customers/domain/customer";
import { ProjectSettings } from "../../settings/domain/project-settings";
import { applyMailSettings } from "../../settings/application/settings";
import { SuppressionEntry } from "../../suppressions/domain/suppression";
import { isSuppressed } from "../../suppressions/application/suppressions";

export type PreflightResult = {
  eligibleCustomers: Customer[];
  excludedCustomers: Customer[];
  errors: string[];
  warnings: string[];
  previews: { name: string; email: string; subject: string; body: string }[];
};

export function runDeliveryPreflight(
  customers: Customer[],
  suppressions: SuppressionEntry[],
  subject: string,
  body: string,
  settings: ProjectSettings,
): PreflightResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const configured = applyMailSettings(subject, body, settings);
  const excludedCustomers = customers.filter((customer) =>
    isSuppressed(suppressions, customer.email),
  );
  const eligibleCustomers = customers.filter(
    (customer) => !isSuppressed(suppressions, customer.email),
  );

  if (!customers.length) errors.push("送信対象が選択されていません。");
  if (!configured.subject.trim()) errors.push("件名が入力されていません。");
  if (!configured.body.trim()) errors.push("本文が入力されていません。");
  if (customers.length && !eligibleCustomers.length) {
    errors.push("選択した宛先はすべて配信停止リストに登録されています。");
  }
  if (excludedCustomers.length) {
    warnings.push(
      `${excludedCustomers.length}件は配信停止リストにより除外されます。`,
    );
  }
  if (configured.subject.length > 100) {
    warnings.push("件名が100文字を超えています。");
  }

  const unresolved = new Set<string>();
  const previews = eligibleCustomers.map((customer) => {
    const rendered = {
      name: customer.name,
      email: customer.email,
      subject: personalize(configured.subject, customer),
      body: personalize(configured.body, customer),
    };
    for (const match of `${rendered.subject}\n${rendered.body}`.matchAll(
      /{{\s*([^}]+)\s*}}/g,
    )) {
      unresolved.add(match[1].trim());
    }
    return rendered;
  });
  if (unresolved.size) {
    warnings.push(
      `未解決の差し込み変数があります: ${[...unresolved].join(", ")}`,
    );
  }

  return { eligibleCustomers, excludedCustomers, errors, warnings, previews };
}
