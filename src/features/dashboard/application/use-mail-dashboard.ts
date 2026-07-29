"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  addCustomer,
  changeCustomerStatus,
  removeCustomer,
  searchCustomers,
  updateCustomer,
} from "../../customers/application/customers";
import { Customer, CustomerStatus } from "../../customers/domain/customer";
import { importCustomersFromCsv } from "../../customers/infrastructure/csv";
import {
  countDeliveriesInMonth,
  createDeliveryHistoryCsv,
  executeDelivery,
  reconcileDeliveryBatches,
  retryFailedDeliveries,
} from "../../deliveries/application/deliveries";
import {
  Delivery,
  DeliveryBatch,
} from "../../deliveries/domain/delivery";
import { LocalSimulationMailDeliveryService } from "../../deliveries/infrastructure/local-simulation-mail-delivery-service";
import { createProject } from "../../projects/application/projects";
import {
  DEFAULT_PROJECT,
  DEFAULT_PROJECT_ID,
  Project,
} from "../../projects/domain/project";
import { Repositories } from "../../storage/application/repositories";
import { createLocalStorageRepositories } from "../../storage/infrastructure/local-storage-repositories";
import {
  BUILT_IN_TEMPLATES,
  createTemplate,
} from "../../templates/application/templates";
import { MailTemplate } from "../../templates/domain/mail-template";

export function useMailDashboard() {
  const [repositories, setRepositories] = useState<Repositories | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [deliveryBatches, setDeliveryBatches] = useState<DeliveryBatch[]>([]);
  const [customTemplates, setCustomTemplates] = useState<MailTemplate[]>([]);
  const [projects, setProjects] = useState<Project[]>([DEFAULT_PROJECT]);
  const [currentProjectId, setCurrentProjectId] = useState(DEFAULT_PROJECT_ID);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activeView, setActiveView] = useState<"send" | "history">("send");
  const [isSending, setIsSending] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [selectedFailureIds, setSelectedFailureIds] = useState<string[]>([]);
  const [showRetryConfirmation, setShowRetryConfirmation] = useState(false);

  useEffect(() => {
    const repos = createLocalStorageRepositories(window.localStorage);
    const storedProjects = repos.projects.findAll();
    const availableProjects = storedProjects.length
      ? storedProjects
      : [DEFAULT_PROJECT];
    const storedCurrent = repos.projects.getCurrentId();
    const projectId = availableProjects.some(
      (project) => project.id === storedCurrent,
    )
      ? (storedCurrent as string)
      : availableProjects[0].id;
    const draft = repos.drafts.findByProject(projectId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRepositories(repos);
    setProjects(availableProjects);
    setCurrentProjectId(projectId);
    setCustomers(repos.customers.findByProject(projectId));
    setDeliveries(repos.deliveries.findByProject(projectId));
    setDeliveryBatches(repos.deliveryBatches.findByProject(projectId));
    setCustomTemplates(repos.templates.findByProject(projectId));
    setSubject(draft.subject);
    setBody(draft.body);
  }, []);

  useEffect(() => {
    repositories?.customers.saveByProject(currentProjectId, customers);
  }, [customers, currentProjectId, repositories]);
  useEffect(() => {
    repositories?.deliveries.saveByProject(currentProjectId, deliveries);
  }, [deliveries, currentProjectId, repositories]);
  useEffect(() => {
    repositories?.deliveryBatches.saveByProject(
      currentProjectId,
      deliveryBatches,
    );
  }, [currentProjectId, deliveryBatches, repositories]);
  useEffect(() => {
    repositories?.templates.saveByProject(currentProjectId, customTemplates);
  }, [customTemplates, currentProjectId, repositories]);
  useEffect(() => {
    repositories?.drafts.saveByProject(currentProjectId, { subject, body });
  }, [body, currentProjectId, repositories, subject]);
  useEffect(() => {
    repositories?.projects.saveAll(projects);
    repositories?.projects.setCurrentId(currentProjectId);
  }, [currentProjectId, projects, repositories]);

  const filteredCustomers = useMemo(
    () => searchCustomers(customers, searchQuery),
    [customers, searchQuery],
  );
  const selectedCustomers = useMemo(
    () => customers.filter((customer) => selectedIds.includes(customer.id)),
    [customers, selectedIds],
  );
  const selectedFailedDeliveries = useMemo(
    () =>
      deliveries.filter(
        (delivery) =>
          delivery.status === "失敗" &&
          selectedFailureIds.includes(delivery.id),
      ),
    [deliveries, selectedFailureIds],
  );
  const currentProject =
    projects.find((project) => project.id === currentProjectId) ??
    DEFAULT_PROJECT;

  function switchProject(projectId: string) {
    if (!repositories || projectId === currentProjectId) return;
    const draft = repositories.drafts.findByProject(projectId);
    setCurrentProjectId(projectId);
    setCustomers(repositories.customers.findByProject(projectId));
    setDeliveries(repositories.deliveries.findByProject(projectId));
    setDeliveryBatches(
      repositories.deliveryBatches.findByProject(projectId),
    );
    setCustomTemplates(repositories.templates.findByProject(projectId));
    setSubject(draft.subject);
    setBody(draft.body);
    setSelectedIds([]);
    setSelectedFailureIds([]);
    setSearchQuery("");
    setNotice("");
  }

  function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newProjectName.trim()) return;
    const project = createProject(newProjectName);
    setProjects((current) => [...current, project]);
    setNewProjectName("");
    setShowProjectForm(false);
    setCurrentProjectId(project.id);
    setCustomers([]);
    setDeliveries([]);
    setDeliveryBatches([]);
    setCustomTemplates([]);
    setSubject("");
    setBody("");
    setSelectedIds([]);
    setSelectedFailureIds([]);
    setNotice(`プロジェクト「${project.name}」を作成しました。`);
  }

  function handleAddCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = addCustomer(customers, {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      orderNumber: String(form.get("orderNumber") ?? ""),
    });
    if (!result.ok) return setNotice(result.message);
    setCustomers(result.customers);
    setSelectedIds((current) => [...current, result.customer.id]);
    setNotice(`${result.customer.name}さんを登録しました。`);
    event.currentTarget.reset();
  }

  async function handleCsvImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const result = importCustomersFromCsv(await file.text(), customers);
    setCustomers((current) => [...result.customers, ...current]);
    setSelectedIds((current) => [
      ...current,
      ...result.customers.map((customer) => customer.id),
    ]);
    const errorSummary = result.errors
      .slice(0, 3)
      .map((error) => `${error.line}行目: ${error.message}`)
      .join(" / ");
    setNotice(
      `${result.customers.length}件を取り込みました。${
        result.errors.length
          ? ` ${result.errors.length}件を除外（${errorSummary}）`
          : ""
      }`,
    );
  }

  function handleUpdateCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCustomer) return;
    const form = new FormData(event.currentTarget);
    const result = updateCustomer(customers, editingCustomer.id, {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      orderNumber: String(form.get("orderNumber") ?? ""),
    });
    if (!result.ok) return setNotice(result.message);
    setCustomers(result.customers);
    setEditingCustomer(null);
    setNotice("購入者情報を更新しました。");
  }

  function toggleAllRecipients() {
    const allSelected =
      filteredCustomers.length > 0 &&
      filteredCustomers.every((customer) => selectedIds.includes(customer.id));
    setSelectedIds(
      allSelected
        ? selectedIds.filter(
            (id) => !filteredCustomers.some((customer) => customer.id === id),
          )
        : [
            ...new Set([
              ...selectedIds,
              ...filteredCustomers.map((customer) => customer.id),
            ]),
          ],
    );
  }

  function handleSaveTemplate() {
    if (!templateName.trim() || !subject.trim() || !body.trim()) {
      return setNotice("テンプレート名、件名、本文を入力してください。");
    }
    const template = createTemplate(templateName, subject, body);
    setCustomTemplates((current) => [...current, template]);
    setTemplateName("");
    setNotice(`テンプレート「${template.name}」を保存しました。`);
  }

  async function handleSimulateSend() {
    if (isSending) return;
    setIsSending(true);
    try {
      const service = new LocalSimulationMailDeliveryService((input) =>
        input.to.includes("+fail@")
          ? "ローカル検証用の一時的な送信エラー"
          : undefined,
      );
      const { batch, deliveries: created } = await executeDelivery(
        service,
        selectedCustomers,
        subject,
        body,
      );
      setDeliveries((current) => [...created, ...current]);
      setDeliveryBatches((current) => [batch, ...current]);
      setSelectedIds([]);
      setSubject("");
      setBody("");
      setShowConfirmation(false);
      setNotice(
        `${created.length}件を個別送信として記録しました（${batch.status}）。`,
      );
    } finally {
      setIsSending(false);
    }
  }

  async function handleRetryFailed() {
    if (isRetrying || selectedFailureIds.length === 0) return;
    setIsRetrying(true);
    try {
      const service = new LocalSimulationMailDeliveryService();
      const updated = await retryFailedDeliveries(
        service,
        deliveries,
        selectedFailureIds,
      );
      const updatedBatches = reconcileDeliveryBatches(
        deliveryBatches,
        updated,
      );
      const succeeded = updated.filter(
        (delivery) =>
          selectedFailureIds.includes(delivery.id) &&
          delivery.status === "送信済み",
      ).length;
      setDeliveries(updated);
      setDeliveryBatches(updatedBatches);
      setSelectedFailureIds([]);
      setShowRetryConfirmation(false);
      setNotice(`${succeeded}件の再送シミュレーションが成功しました。`);
    } finally {
      setIsRetrying(false);
    }
  }

  function exportHistory() {
    const csv = createDeliveryHistoryCsv(deliveries);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mailsend-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return {
    activeView,
    body,
    currentProject,
    currentProjectId,
    customTemplates,
    customers,
    deliveries,
    deliveryBatches,
    editingCustomer,
    filteredCustomers,
    isSending,
    isRetrying,
    monthlyDeliveryCount: countDeliveriesInMonth(deliveries),
    newProjectName,
    notice,
    projects,
    searchQuery,
    selectedCustomers,
    selectedIds,
    selectedFailureIds,
    selectedFailedDeliveries,
    showConfirmation,
    showRetryConfirmation,
    showProjectForm,
    subject,
    templateName,
    templates: [...BUILT_IN_TEMPLATES, ...customTemplates],
    addCustomer: handleAddCustomer,
    changeStatus: (id: string, status: CustomerStatus) =>
      setCustomers(changeCustomerStatus(customers, id, status)),
    closeNotice: () => setNotice(""),
    createProject: handleCreateProject,
    deleteTemplate: (id: string) =>
      setCustomTemplates((current) =>
        current.filter((template) => template.id !== id),
      ),
    exportHistory,
    importCsv: handleCsvImport,
    removeCustomer: (id: string) => {
      setCustomers(removeCustomer(customers, id));
      setSelectedIds((current) => current.filter((item) => item !== id));
      setNotice("購入者を削除しました。");
    },
    retryFailed: handleRetryFailed,
    saveCustomer: handleUpdateCustomer,
    saveTemplate: handleSaveTemplate,
    setActiveView,
    setBody,
    setEditingCustomer,
    setNewProjectName,
    setSearchQuery,
    setShowConfirmation,
    setShowRetryConfirmation,
    setShowProjectForm,
    setSubject,
    setTemplateName,
    toggleFailure: (id: string) =>
      setSelectedFailureIds((current) =>
        current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id],
      ),
    toggleAllFailures: () => {
      const failedIds = deliveries
        .filter((delivery) => delivery.status === "失敗")
        .map((delivery) => delivery.id);
      setSelectedFailureIds(
        failedIds.every((id) => selectedFailureIds.includes(id))
          ? []
          : failedIds,
      );
    },
    simulateSend: handleSimulateSend,
    switchProject,
    toggleAllRecipients,
    toggleRecipient: (id: string) =>
      setSelectedIds((current) =>
        current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id],
      ),
  };
}
