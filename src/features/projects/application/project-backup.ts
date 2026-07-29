import { MailDraft } from "../../composer/domain/draft";
import { Customer } from "../../customers/domain/customer";
import {
  Delivery,
  DeliveryBatch,
} from "../../deliveries/domain/delivery";
import { ProjectSettings } from "../../settings/domain/project-settings";
import { MailTemplate } from "../../templates/domain/mail-template";
import { Project } from "../domain/project";

export const PROJECT_BACKUP_VERSION = 1;

export type ProjectBackup = {
  version: typeof PROJECT_BACKUP_VERSION;
  exportedAt: string;
  project: Project;
  customers: Customer[];
  templates: MailTemplate[];
  draft: MailDraft;
  deliveries: Delivery[];
  deliveryBatches: DeliveryBatch[];
  settings: ProjectSettings;
};

export function createProjectBackup(
  backup: Omit<ProjectBackup, "version" | "exportedAt">,
  now = new Date(),
): ProjectBackup {
  return {
    version: PROJECT_BACKUP_VERSION,
    exportedAt: now.toISOString(),
    ...backup,
  };
}

export function parseProjectBackup(text: string):
  | { ok: true; backup: ProjectBackup }
  | { ok: false; message: string } {
  try {
    const value = JSON.parse(text) as Partial<ProjectBackup>;
    if (value.version !== PROJECT_BACKUP_VERSION) {
      return { ok: false, message: "対応していないバックアップ形式です。" };
    }
    if (
      !value.project?.name ||
      !Array.isArray(value.customers) ||
      !Array.isArray(value.templates) ||
      !Array.isArray(value.deliveries) ||
      !Array.isArray(value.deliveryBatches) ||
      !value.draft ||
      !value.settings
    ) {
      return { ok: false, message: "バックアップの内容が不足しています。" };
    }
    if (value.customers.length > 100) {
      return {
        ok: false,
        message: "バックアップの顧客数が上限100件を超えています。",
      };
    }
    return { ok: true, backup: value as ProjectBackup };
  } catch {
    return { ok: false, message: "JSONファイルを読み込めませんでした。" };
  }
}
