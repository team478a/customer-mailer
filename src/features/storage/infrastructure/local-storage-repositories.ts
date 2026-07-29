import { MailDraft } from "../../composer/domain/draft";
import { Customer } from "../../customers/domain/customer";
import {
  Delivery,
  DeliveryBatch,
} from "../../deliveries/domain/delivery";
import { projectStorageKey } from "../../projects/application/projects";
import {
  DEFAULT_PROJECT_ID,
  Project,
} from "../../projects/domain/project";
import { MailTemplate } from "../../templates/domain/mail-template";
import {
  CustomerRepository,
  DeliveryRepository,
  DeliveryBatchRepository,
  DraftRepository,
  ProjectRepository,
  Repositories,
  TemplateRepository,
} from "../application/repositories";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const STORAGE_NAMESPACES = {
  customers: "mailsend.customers",
  deliveries: "mailsend.deliveries",
  deliveryBatches: "mailsend.deliveryBatches",
  templates: "mailsend.templates",
  draft: "mailsend.draft",
  projects: "mailsend.projects",
  currentProject: "mailsend.currentProject",
} as const;

function parse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

class LocalCustomerRepository implements CustomerRepository {
  constructor(private readonly storage: StorageLike) {}
  findByProject(projectId: string) {
    return parse<Customer[]>(
      this.storage.getItem(
        projectStorageKey(STORAGE_NAMESPACES.customers, projectId),
      ) ??
        (projectId === DEFAULT_PROJECT_ID
          ? this.storage.getItem(STORAGE_NAMESPACES.customers)
          : null),
      [],
    );
  }
  saveByProject(projectId: string, customers: Customer[]) {
    this.storage.setItem(
      projectStorageKey(STORAGE_NAMESPACES.customers, projectId),
      JSON.stringify(customers),
    );
  }
}

class LocalTemplateRepository implements TemplateRepository {
  constructor(private readonly storage: StorageLike) {}
  findByProject(projectId: string) {
    return parse<MailTemplate[]>(
      this.storage.getItem(
        projectStorageKey(STORAGE_NAMESPACES.templates, projectId),
      ) ??
        (projectId === DEFAULT_PROJECT_ID
          ? this.storage.getItem(STORAGE_NAMESPACES.templates)
          : null),
      [],
    );
  }
  saveByProject(projectId: string, templates: MailTemplate[]) {
    this.storage.setItem(
      projectStorageKey(STORAGE_NAMESPACES.templates, projectId),
      JSON.stringify(templates),
    );
  }
}

class LocalDraftRepository implements DraftRepository {
  constructor(private readonly storage: StorageLike) {}
  findByProject(projectId: string) {
    return parse<MailDraft>(
      this.storage.getItem(
        projectStorageKey(STORAGE_NAMESPACES.draft, projectId),
      ) ??
        (projectId === DEFAULT_PROJECT_ID
          ? this.storage.getItem(STORAGE_NAMESPACES.draft)
          : null),
      { subject: "", body: "" },
    );
  }
  saveByProject(projectId: string, draft: MailDraft) {
    this.storage.setItem(
      projectStorageKey(STORAGE_NAMESPACES.draft, projectId),
      JSON.stringify(draft),
    );
  }
}

class LocalDeliveryRepository implements DeliveryRepository {
  constructor(private readonly storage: StorageLike) {}
  findByProject(projectId: string) {
    return parse<Delivery[]>(
      this.storage.getItem(
        projectStorageKey(STORAGE_NAMESPACES.deliveries, projectId),
      ) ??
        (projectId === DEFAULT_PROJECT_ID
          ? this.storage.getItem(STORAGE_NAMESPACES.deliveries)
          : null),
      [],
    );
  }
  saveByProject(projectId: string, deliveries: Delivery[]) {
    this.storage.setItem(
      projectStorageKey(STORAGE_NAMESPACES.deliveries, projectId),
      JSON.stringify(deliveries),
    );
  }
}

class LocalDeliveryBatchRepository implements DeliveryBatchRepository {
  constructor(private readonly storage: StorageLike) {}
  findByProject(projectId: string) {
    return parse<DeliveryBatch[]>(
      this.storage.getItem(
        projectStorageKey(STORAGE_NAMESPACES.deliveryBatches, projectId),
      ),
      [],
    );
  }
  saveByProject(projectId: string, batches: DeliveryBatch[]) {
    this.storage.setItem(
      projectStorageKey(STORAGE_NAMESPACES.deliveryBatches, projectId),
      JSON.stringify(batches),
    );
  }
}

class LocalProjectRepository implements ProjectRepository {
  constructor(private readonly storage: StorageLike) {}
  findAll() {
    return parse<Project[]>(
      this.storage.getItem(STORAGE_NAMESPACES.projects),
      [],
    );
  }
  saveAll(projects: Project[]) {
    this.storage.setItem(
      STORAGE_NAMESPACES.projects,
      JSON.stringify(projects),
    );
  }
  getCurrentId() {
    return this.storage.getItem(STORAGE_NAMESPACES.currentProject);
  }
  setCurrentId(projectId: string) {
    this.storage.setItem(STORAGE_NAMESPACES.currentProject, projectId);
  }
}

export function createLocalStorageRepositories(
  storage: StorageLike,
): Repositories {
  return {
    customers: new LocalCustomerRepository(storage),
    templates: new LocalTemplateRepository(storage),
    drafts: new LocalDraftRepository(storage),
    deliveries: new LocalDeliveryRepository(storage),
    deliveryBatches: new LocalDeliveryBatchRepository(storage),
    projects: new LocalProjectRepository(storage),
  };
}
