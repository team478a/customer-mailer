import { MailDraft } from "../../composer/domain/draft";
import { Customer } from "../../customers/domain/customer";
import {
  Delivery,
  DeliveryBatch,
} from "../../deliveries/domain/delivery";
import { Project } from "../../projects/domain/project";
import {
  ProjectSecrets,
  ProjectSettings,
} from "../../settings/domain/project-settings";
import { MailTemplate } from "../../templates/domain/mail-template";

export interface CustomerRepository {
  findByProject(projectId: string): Customer[];
  saveByProject(projectId: string, customers: Customer[]): void;
}

export interface TemplateRepository {
  findByProject(projectId: string): MailTemplate[];
  saveByProject(projectId: string, templates: MailTemplate[]): void;
}

export interface DraftRepository {
  findByProject(projectId: string): MailDraft;
  saveByProject(projectId: string, draft: MailDraft): void;
}

export interface DeliveryRepository {
  findByProject(projectId: string): Delivery[];
  saveByProject(projectId: string, deliveries: Delivery[]): void;
}

export interface DeliveryBatchRepository {
  findByProject(projectId: string): DeliveryBatch[];
  saveByProject(projectId: string, batches: DeliveryBatch[]): void;
}

export interface ProjectRepository {
  findAll(): Project[];
  saveAll(projects: Project[]): void;
  getCurrentId(): string | null;
  setCurrentId(projectId: string): void;
}

export interface SettingsRepository {
  findByProject(projectId: string): ProjectSettings;
  saveByProject(projectId: string, settings: ProjectSettings): void;
}

export interface SecretSettingsRepository {
  findByProject(projectId: string): ProjectSecrets;
  saveByProject(projectId: string, secrets: ProjectSecrets): void;
}

export type Repositories = {
  customers: CustomerRepository;
  templates: TemplateRepository;
  drafts: DraftRepository;
  deliveries: DeliveryRepository;
  deliveryBatches: DeliveryBatchRepository;
  projects: ProjectRepository;
  settings: SettingsRepository;
  secretSettings: SecretSettingsRepository;
};
