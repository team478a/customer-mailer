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
import {
  CsvImportError,
  importCustomersFromCsv,
} from "../../customers/infrastructure/csv";
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
import { runDeliveryPreflight } from "../../deliveries/application/preflight";
import { createProject } from "../../projects/application/projects";
import {
  createProjectBackup,
  parseProjectBackup,
} from "../../projects/application/project-backup";
import {
  DEFAULT_PROJECT,
  DEFAULT_PROJECT_ID,
  Project,
} from "../../projects/domain/project";
import { Repositories } from "../../storage/application/repositories";
import { createLocalStorageRepositories } from "../../storage/infrastructure/local-storage-repositories";
import {
  applyMailSettings,
  validateProjectSettings,
} from "../../settings/application/settings";
import {
  DEFAULT_PROJECT_SETTINGS,
  EMPTY_PROJECT_SECRETS,
  ProjectSecrets,
  ProjectSettings,
} from "../../settings/domain/project-settings";
import {
  BUILT_IN_TEMPLATES,
  createTemplate,
} from "../../templates/application/templates";
import { MailTemplate } from "../../templates/domain/mail-template";
import {
  addSuppression,
} from "../../suppressions/application/suppressions";
import {
  SuppressionEntry,
  SuppressionReason,
} from "../../suppressions/domain/suppression";

function safeFileName(value: string) {
  return value.replace(/[<>:"/\\|?*]/g, "-").trim() || "project";
}

function downloadFile(content: string, name: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

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
  const [activeView, setActiveView] = useState<
    "send" | "history" | "settings"
  >("send");
  const [isSending, setIsSending] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [selectedFailureIds, setSelectedFailureIds] = useState<string[]>([]);
  const [showRetryConfirmation, setShowRetryConfirmation] = useState(false);
  const [settings, setSettings] = useState<ProjectSettings>(
    DEFAULT_PROJECT_SETTINGS,
  );
  const [secrets, setSecrets] = useState<ProjectSecrets>(
    EMPTY_PROJECT_SECRETS,
  );
  const [savedSettingsSignature, setSavedSettingsSignature] = useState(
    JSON.stringify({
      settings: DEFAULT_PROJECT_SETTINGS,
      secrets: EMPTY_PROJECT_SECRETS,
    }),
  );
  const [projectNameDraft, setProjectNameDraft] = useState(
    DEFAULT_PROJECT.name,
  );
  const [showProjectDelete, setShowProjectDelete] = useState(false);
  const [csvErrors, setCsvErrors] = useState<CsvImportError[]>([]);
  const [suppressions, setSuppressions] = useState<SuppressionEntry[]>([]);

  useEffect(() => {
    const repos = createLocalStorageRepositories(
      window.localStorage,
      window.sessionStorage,
    );
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
    setSuppressions(repos.suppressions.findByProject(projectId));
    setSubject(draft.subject);
    setBody(draft.body);
    const initialSettings = repos.settings.findByProject(projectId);
    const initialSecrets = repos.secretSettings.findByProject(projectId);
    setSettings(initialSettings);
    setSecrets(initialSecrets);
    setSavedSettingsSignature(
      JSON.stringify({ settings: initialSettings, secrets: initialSecrets }),
    );
    setProjectNameDraft(
      availableProjects.find((project) => project.id === projectId)?.name ??
        DEFAULT_PROJECT.name,
    );
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
    repositories?.suppressions.saveByProject(currentProjectId, suppressions);
  }, [currentProjectId, repositories, suppressions]);
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
  const settingsDirty =
    JSON.stringify({ settings, secrets }) !== savedSettingsSignature;
  const preflight = useMemo(
    () =>
      runDeliveryPreflight(
        selectedCustomers,
        suppressions,
        subject,
        body,
        settings,
      ),
    [body, selectedCustomers, settings, subject, suppressions],
  );

  function switchProject(projectId: string) {
    if (!repositories || projectId === currentProjectId) return;
    if (
      settingsDirty &&
      !window.confirm("未保存の設定があります。破棄して切り替えますか？")
    ) {
      return;
    }
    const draft = repositories.drafts.findByProject(projectId);
    setCurrentProjectId(projectId);
    setCustomers(repositories.customers.findByProject(projectId));
    setDeliveries(repositories.deliveries.findByProject(projectId));
    setDeliveryBatches(
      repositories.deliveryBatches.findByProject(projectId),
    );
    setCustomTemplates(repositories.templates.findByProject(projectId));
    setSuppressions(repositories.suppressions.findByProject(projectId));
    const nextSettings = repositories.settings.findByProject(projectId);
    const nextSecrets = repositories.secretSettings.findByProject(projectId);
    setSettings(nextSettings);
    setSecrets(nextSecrets);
    setSavedSettingsSignature(
      JSON.stringify({ settings: nextSettings, secrets: nextSecrets }),
    );
    setProjectNameDraft(
      projects.find((project) => project.id === projectId)?.name ?? "",
    );
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
    setSuppressions([]);
    setSubject("");
    setBody("");
    setSettings(DEFAULT_PROJECT_SETTINGS);
    setSecrets(EMPTY_PROJECT_SECRETS);
    setSavedSettingsSignature(
      JSON.stringify({
        settings: DEFAULT_PROJECT_SETTINGS,
        secrets: EMPTY_PROJECT_SECRETS,
      }),
    );
    setProjectNameDraft(project.name);
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
    setCsvErrors(result.errors);
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
      if (settings.mailProvider === "resend" && !settings.testMode) {
        const configuredMail = applyMailSettings(subject, body, settings);
        const response = await fetch("/api/deliveries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: crypto.randomUUID(),
            projectId: currentProjectId,
            subject: configuredMail.subject,
            body: configuredMail.body,
            fromName: settings.fromName,
            fromEmail: settings.fromEmail,
            replyTo: settings.replyTo,
            recipients: preflight.previews.map((preview) => {
              const customer = preflight.eligibleCustomers.find(
                (item) => item.email === preview.email,
              );
              return {
                customerId: customer?.id ?? "",
                customerName: preview.name,
                email: preview.email,
                subject: preview.subject,
                body: preview.body,
              };
            }),
          }),
        });
        const result = (await response.json()) as {
          error?: string;
          sent?: number;
          failed?: number;
          suppressed?: number;
        };
        if (!response.ok) {
          setNotice(result.error ?? "サーバー送信に失敗しました。");
          return;
        }
        setSelectedIds([]);
        setShowConfirmation(false);
        setNotice(
          `実メール送信を処理しました。成功${result.sent ?? 0}件・失敗${result.failed ?? 0}件・除外${result.suppressed ?? 0}件`,
        );
        return;
      }
      const service = new LocalSimulationMailDeliveryService((input) =>
        input.to.includes("+fail@")
          ? "ローカル検証用の一時的な送信エラー"
          : undefined,
      );
      const configuredMail = applyMailSettings(subject, body, settings);
      const { batch, deliveries: created } = await executeDelivery(
        service,
        preflight.eligibleCustomers,
        configuredMail.subject,
        configuredMail.body,
        new Date(),
        {
          fromName: settings.fromName,
          fromEmail: settings.fromEmail,
          replyTo: settings.replyTo,
        },
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

  function saveSettings() {
    if (!repositories) return;
    const validation = validateProjectSettings(settings, secrets);
    if (!validation.ok) {
      setNotice(validation.errors.join(" "));
      return;
    }
    repositories.settings.saveByProject(currentProjectId, settings);
    repositories.secretSettings.saveByProject(currentProjectId, secrets);
    setSavedSettingsSignature(JSON.stringify({ settings, secrets }));
    setNotice(
      "設定を保存しました。秘密情報はこのブラウザセッション内だけで保持されます。",
    );
  }

  function resetSettings() {
    setSettings(DEFAULT_PROJECT_SETTINGS);
    setSecrets(EMPTY_PROJECT_SECRETS);
    setNotice("設定を初期値へ戻しました。保存すると反映されます。");
  }

  function changeActiveView(view: "send" | "history" | "settings") {
    if (activeView === "settings" && view !== "settings" && settingsDirty) {
      if (!window.confirm("未保存の設定があります。破棄して移動しますか？")) {
        return;
      }
      if (repositories) {
        const storedSettings =
          repositories.settings.findByProject(currentProjectId);
        const storedSecrets =
          repositories.secretSettings.findByProject(currentProjectId);
        setSettings(storedSettings);
        setSecrets(storedSecrets);
        setSavedSettingsSignature(
          JSON.stringify({
            settings: storedSettings,
            secrets: storedSecrets,
          }),
        );
      }
    }
    setActiveView(view);
  }

  function renameProject() {
    const name = projectNameDraft.trim();
    if (!name) return setNotice("プロジェクト名を入力してください。");
    setProjects((current) =>
      current.map((project) =>
        project.id === currentProjectId ? { ...project, name } : project,
      ),
    );
    setNotice(`プロジェクト名を「${name}」へ変更しました。`);
  }

  function deleteCurrentProject() {
    if (!repositories || projects.length <= 1) return;
    repositories.projectData.clearProject(currentProjectId);
    const remaining = projects.filter(
      (project) => project.id !== currentProjectId,
    );
    const nextProject = remaining[0];
    const draft = repositories.drafts.findByProject(nextProject.id);
    const nextSettings = repositories.settings.findByProject(nextProject.id);
    const nextSecrets =
      repositories.secretSettings.findByProject(nextProject.id);
    setProjects(remaining);
    setCurrentProjectId(nextProject.id);
    setCustomers(repositories.customers.findByProject(nextProject.id));
    setDeliveries(repositories.deliveries.findByProject(nextProject.id));
    setDeliveryBatches(
      repositories.deliveryBatches.findByProject(nextProject.id),
    );
    setCustomTemplates(repositories.templates.findByProject(nextProject.id));
    setSuppressions(repositories.suppressions.findByProject(nextProject.id));
    setSubject(draft.subject);
    setBody(draft.body);
    setSettings(nextSettings);
    setSecrets(nextSecrets);
    setSavedSettingsSignature(
      JSON.stringify({ settings: nextSettings, secrets: nextSecrets }),
    );
    setProjectNameDraft(nextProject.name);
    setShowProjectDelete(false);
    setNotice("プロジェクトを削除しました。");
  }

  function exportProjectBackup() {
    const backup = createProjectBackup({
      project: currentProject,
      customers,
      templates: customTemplates,
      draft: { subject, body },
      deliveries,
      deliveryBatches,
      settings,
      suppressions,
    });
    downloadFile(
      JSON.stringify(backup, null, 2),
      `mailsend-${safeFileName(currentProject.name)}-${new Date()
        .toISOString()
        .slice(0, 10)}.json`,
      "application/json",
    );
  }

  async function importProjectBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const result = parseProjectBackup(await file.text());
    if (!result.ok) return setNotice(result.message);
    const backup = result.backup;
    if (
      !window.confirm(
        `「${backup.project.name}」のバックアップ（顧客${backup.customers.length}件）で現在のデータを置き換えますか？`,
      )
    ) return;
    exportProjectBackup();
    setCustomers(backup.customers);
    setCustomTemplates(backup.templates);
    setSubject(backup.draft.subject);
    setBody(backup.draft.body);
    setDeliveries(backup.deliveries);
    setDeliveryBatches(backup.deliveryBatches);
    setSettings(backup.settings);
    setSuppressions(backup.suppressions);
    repositories?.settings.saveByProject(currentProjectId, backup.settings);
    setSavedSettingsSignature(
      JSON.stringify({ settings: backup.settings, secrets }),
    );
    setProjects((current) =>
      current.map((project) =>
        project.id === currentProjectId
          ? { ...project, name: backup.project.name }
          : project,
      ),
    );
    setProjectNameDraft(backup.project.name);
    setNotice(
      "復元前データを自動ダウンロードし、バックアップを現在のプロジェクトへ復元しました。",
    );
  }

  function exportCsvErrors() {
    const rows = [
      ["行番号", "エラー"],
      ...csvErrors.map((error) => [String(error.line), error.message]),
    ];
    const csv = `\uFEFF${rows
      .map((row) =>
        row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","),
      )
      .join("\r\n")}`;
    downloadFile(csv, "mailsend-csv-errors.csv", "text/csv");
  }

  function handleAddSuppression(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const result = addSuppression(
      suppressions,
      String(form.get("email") ?? ""),
      String(form.get("reason") ?? "手動除外") as SuppressionReason,
    );
    if (!result.ok) return setNotice(result.message);
    setSuppressions(result.entries);
    setSelectedIds((current) =>
      current.filter(
        (id) =>
          customers.find((customer) => customer.id === id)?.email !==
          result.entry.email,
      ),
    );
    setNotice(`${result.entry.email}を配信停止リストへ追加しました。`);
    event.currentTarget.reset();
  }

  function bulkChangeStatus(status: CustomerStatus) {
    setCustomers((current) =>
      current.map((customer) =>
        selectedIds.includes(customer.id) ? { ...customer, status } : customer,
      ),
    );
    setNotice(`${selectedIds.length}件のステータスを変更しました。`);
  }

  function bulkDeleteCustomers() {
    if (
      !selectedIds.length ||
      !window.confirm(`選択した${selectedIds.length}件を削除しますか？`)
    ) return;
    setCustomers((current) =>
      current.filter((customer) => !selectedIds.includes(customer.id)),
    );
    setSelectedIds([]);
    setNotice("選択した購入者を削除しました。");
  }

  return {
    activeView,
    body,
    currentProject,
    currentProjectId,
    csvErrors,
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
    projectNameDraft,
    searchQuery,
    secrets,
    selectedCustomers,
    selectedIds,
    selectedFailureIds,
    selectedFailedDeliveries,
    showConfirmation,
    showRetryConfirmation,
    showProjectForm,
    showProjectDelete,
    subject,
    settings,
    settingsDirty,
    suppressions,
    preflight,
    templateName,
    templates: [...BUILT_IN_TEMPLATES, ...customTemplates],
    addCustomer: handleAddCustomer,
    addSuppression: handleAddSuppression,
    bulkChangeStatus,
    bulkDeleteCustomers,
    changeStatus: (id: string, status: CustomerStatus) =>
      setCustomers(changeCustomerStatus(customers, id, status)),
    clearCsvErrors: () => setCsvErrors([]),
    closeNotice: () => setNotice(""),
    createProject: handleCreateProject,
    deleteCurrentProject,
    deleteTemplate: (id: string) =>
      setCustomTemplates((current) =>
        current.filter((template) => template.id !== id),
      ),
    exportHistory,
    exportCsvErrors,
    exportProjectBackup,
    importCsv: handleCsvImport,
    importProjectBackup,
    removeSuppression: (id: string) =>
      setSuppressions((current) => current.filter((entry) => entry.id !== id)),
    removeCustomer: (id: string) => {
      setCustomers(removeCustomer(customers, id));
      setSelectedIds((current) => current.filter((item) => item !== id));
      setNotice("購入者を削除しました。");
    },
    retryFailed: handleRetryFailed,
    renameProject,
    saveCustomer: handleUpdateCustomer,
    saveTemplate: handleSaveTemplate,
    saveSettings,
    setActiveView: changeActiveView,
    setBody,
    setEditingCustomer,
    setNewProjectName,
    setProjectNameDraft,
    setSearchQuery,
    setSecrets: (patch: Partial<ProjectSecrets>) =>
      setSecrets((current) => ({ ...current, ...patch })),
    setSettings: (patch: Partial<ProjectSettings>) =>
      setSettings((current) => ({ ...current, ...patch })),
    setShowConfirmation,
    setShowRetryConfirmation,
    setShowProjectForm,
    setShowProjectDelete,
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
    resetSettings,
    toggleAllRecipients,
    toggleRecipient: (id: string) =>
      setSelectedIds((current) =>
        current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id],
      ),
  };
}
