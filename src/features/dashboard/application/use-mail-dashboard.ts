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
  simulateDeliveries,
} from "../../deliveries/application/deliveries";
import { Delivery } from "../../deliveries/domain/delivery";
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
  const currentProject =
    projects.find((project) => project.id === currentProjectId) ??
    DEFAULT_PROJECT;

  function switchProject(projectId: string) {
    if (!repositories || projectId === currentProjectId) return;
    const draft = repositories.drafts.findByProject(projectId);
    setCurrentProjectId(projectId);
    setCustomers(repositories.customers.findByProject(projectId));
    setDeliveries(repositories.deliveries.findByProject(projectId));
    setCustomTemplates(repositories.templates.findByProject(projectId));
    setSubject(draft.subject);
    setBody(draft.body);
    setSelectedIds([]);
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
    setCustomTemplates([]);
    setSubject("");
    setBody("");
    setSelectedIds([]);
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

  function handleSimulateSend() {
    const created = simulateDeliveries(selectedCustomers, subject);
    setDeliveries((current) => [...created, ...current]);
    setSelectedIds([]);
    setSubject("");
    setBody("");
    setShowConfirmation(false);
    setNotice(`${created.length}件を個別送信として記録しました。`);
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
    editingCustomer,
    filteredCustomers,
    monthlyDeliveryCount: countDeliveriesInMonth(deliveries),
    newProjectName,
    notice,
    projects,
    searchQuery,
    selectedCustomers,
    selectedIds,
    showConfirmation,
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
    saveCustomer: handleUpdateCustomer,
    saveTemplate: handleSaveTemplate,
    setActiveView,
    setBody,
    setEditingCustomer,
    setNewProjectName,
    setSearchQuery,
    setShowConfirmation,
    setShowProjectForm,
    setSubject,
    setTemplateName,
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
