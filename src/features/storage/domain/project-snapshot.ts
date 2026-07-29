import { MailDraft } from "../../composer/domain/draft";
import { Customer } from "../../customers/domain/customer";
import { Delivery, DeliveryBatch } from "../../deliveries/domain/delivery";
import { Project } from "../../projects/domain/project";
import { ProjectSettings } from "../../settings/domain/project-settings";
import { SuppressionEntry } from "../../suppressions/domain/suppression";
import { MailTemplate } from "../../templates/domain/mail-template";

export type ProjectSnapshot = {
  project: Project;
  customers: Customer[];
  templates: MailTemplate[];
  draft: MailDraft;
  deliveries: Delivery[];
  deliveryBatches: DeliveryBatch[];
  settings: ProjectSettings;
  suppressions: SuppressionEntry[];
};

export type RemoteProjectSummary = Project & {
  role: "owner" | "member";
};
