"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type Customer = {
  id: string;
  name: string;
  email: string;
  orderNumber: string;
  createdAt: string;
  status: "未対応" | "対応中" | "完了";
};

type Delivery = {
  id: string;
  customerName: string;
  email: string;
  subject: string;
  sentAt: string;
  status: "送信済み";
};

type MailTemplate = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

type Project = {
  id: string;
  name: string;
  createdAt: string;
};

const CUSTOMER_KEY = "mailsend.customers";
const DELIVERY_KEY = "mailsend.deliveries";
const TEMPLATE_KEY = "mailsend.templates";
const DRAFT_KEY = "mailsend.draft";
const PROJECT_KEY = "mailsend.projects";
const CURRENT_PROJECT_KEY = "mailsend.currentProject";
const DEFAULT_PROJECT_ID = "default";
const MAX_CUSTOMERS = 100;
const MAIL_TEMPLATES: MailTemplate[] = [
  {
    id: "",
    name: "テンプレートを選択",
    subject: "",
    body: "",
  },
  {
    id: "thanks",
    name: "購入のお礼",
    subject: "ご購入ありがとうございます",
    body: "{{customer_name}}様\n\nこのたびはご購入いただき、誠にありがとうございます。\n注文番号：{{order_number}}\n\n商品到着まで今しばらくお待ちください。",
  },
  {
    id: "shipped",
    name: "発送のご連絡",
    subject: "商品を発送しました",
    body: "{{customer_name}}様\n\nご注文の商品を発送しました。\n注文番号：{{order_number}}\n\n到着まで今しばらくお待ちください。",
  },
  {
    id: "follow-up",
    name: "ご利用状況の確認",
    subject: "商品は問題なくご利用いただけていますか？",
    body: "{{customer_name}}様\n\n先日はご購入いただき、ありがとうございました。\n商品についてご不明な点がございましたら、お気軽にご返信ください。",
  },
];

function loadStoredItems<T>(key: string): T[] {
  try {
    const value = window.localStorage.getItem(key);
    return value ? (JSON.parse(value) as T[]) : [];
  } catch {
    return [];
  }
}

function projectStorageKey(key: string, projectId: string) {
  return `${key}.${projectId}`;
}

function personalize(value: string, customer: Customer) {
  return value
    .replaceAll("{{customer_name}}", customer.name)
    .replaceAll("{{order_number}}", customer.orderNumber || "（注文番号なし）");
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"' && line[index + 1] === '"') {
      value += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      values.push(value.trim());
      value = "";
    } else {
      value += character;
    }
  }
  values.push(value.trim());
  return values;
}

export function MailDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState("");
  const [activeView, setActiveView] = useState<"send" | "history">("send");
  const [searchQuery, setSearchQuery] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<MailTemplate[]>([]);
  const [templateName, setTemplateName] = useState("");
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [projects, setProjects] = useState<Project[]>([
    {
      id: DEFAULT_PROJECT_ID,
      name: "既存プロジェクト",
      createdAt: new Date(0).toISOString(),
    },
  ]);
  const [currentProjectId, setCurrentProjectId] =
    useState(DEFAULT_PROJECT_ID);
  const [newProjectName, setNewProjectName] = useState("");
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const storedProjects = loadStoredItems<Project>(PROJECT_KEY);
    const availableProjects = storedProjects.length
      ? storedProjects
      : projects;
    const storedCurrentProject =
      window.localStorage.getItem(CURRENT_PROJECT_KEY) ?? DEFAULT_PROJECT_ID;
    const initialProjectId = availableProjects.some(
      (project) => project.id === storedCurrentProject,
    )
      ? storedCurrentProject
      : availableProjects[0].id;
    const scopedCustomers = loadStoredItems<Customer>(
      projectStorageKey(CUSTOMER_KEY, initialProjectId),
    );
    const scopedDeliveries = loadStoredItems<Delivery>(
      projectStorageKey(DELIVERY_KEY, initialProjectId),
    );
    const scopedTemplates = loadStoredItems<MailTemplate>(
      projectStorageKey(TEMPLATE_KEY, initialProjectId),
    );

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProjects(availableProjects);
    setCurrentProjectId(initialProjectId);
    setCustomers(
      scopedCustomers.length || initialProjectId !== DEFAULT_PROJECT_ID
        ? scopedCustomers
        : loadStoredItems<Customer>(CUSTOMER_KEY),
    );
    setDeliveries(
      scopedDeliveries.length || initialProjectId !== DEFAULT_PROJECT_ID
        ? scopedDeliveries
        : loadStoredItems<Delivery>(DELIVERY_KEY),
    );
    setCustomTemplates(
      scopedTemplates.length || initialProjectId !== DEFAULT_PROJECT_ID
        ? scopedTemplates
        : loadStoredItems<MailTemplate>(TEMPLATE_KEY),
    );
    try {
      const draft = JSON.parse(
        window.localStorage.getItem(
          projectStorageKey(DRAFT_KEY, initialProjectId),
        ) ??
          window.localStorage.getItem(DRAFT_KEY) ??
          "{}",
      ) as { subject?: string; body?: string };
      setSubject(draft.subject ?? "");
      setBody(draft.body ?? "");
    } catch {
      // 壊れた下書きは無視します。
    }
    setHydrated(true);
    // 初回マウント時だけローカルデータを復元します。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      projectStorageKey(CUSTOMER_KEY, currentProjectId),
      JSON.stringify(customers),
    );
  }, [customers, currentProjectId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      projectStorageKey(DELIVERY_KEY, currentProjectId),
      JSON.stringify(deliveries),
    );
  }, [deliveries, currentProjectId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      projectStorageKey(TEMPLATE_KEY, currentProjectId),
      JSON.stringify(customTemplates),
    );
  }, [customTemplates, currentProjectId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(
      projectStorageKey(DRAFT_KEY, currentProjectId),
      JSON.stringify({ subject, body }),
    );
  }, [subject, body, currentProjectId, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(PROJECT_KEY, JSON.stringify(projects));
    window.localStorage.setItem(CURRENT_PROJECT_KEY, currentProjectId);
  }, [projects, currentProjectId, hydrated]);

  const selectedCustomers = useMemo(
    () => customers.filter((customer) => selectedIds.includes(customer.id)),
    [customers, selectedIds],
  );
  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) =>
      [
        customer.name,
        customer.email,
        customer.orderNumber,
        customer.status ?? "未対応",
      ].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [customers, searchQuery]);
  const allTemplates = [...MAIL_TEMPLATES, ...customTemplates];
  const currentProject =
    projects.find((project) => project.id === currentProjectId) ?? projects[0];

  function switchProject(projectId: string) {
    if (projectId === currentProjectId) return;
    setHydrated(false);
    setCustomers(
      loadStoredItems<Customer>(projectStorageKey(CUSTOMER_KEY, projectId)),
    );
    setDeliveries(
      loadStoredItems<Delivery>(projectStorageKey(DELIVERY_KEY, projectId)),
    );
    setCustomTemplates(
      loadStoredItems<MailTemplate>(projectStorageKey(TEMPLATE_KEY, projectId)),
    );
    try {
      const draft = JSON.parse(
        window.localStorage.getItem(projectStorageKey(DRAFT_KEY, projectId)) ??
          "{}",
      ) as { subject?: string; body?: string };
      setSubject(draft.subject ?? "");
      setBody(draft.body ?? "");
    } catch {
      setSubject("");
      setBody("");
    }
    setSelectedIds([]);
    setSearchQuery("");
    setNotice("");
    setCurrentProjectId(projectId);
    setHydrated(true);
  }

  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };
    setProjects((current) => [...current, project]);
    setNewProjectName("");
    setShowProjectForm(false);
    switchProject(project.id);
    setNotice(`プロジェクト「${name}」を作成しました。`);
  }

  function addCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const orderNumber = String(form.get("orderNumber") ?? "").trim();

    if (customers.length >= MAX_CUSTOMERS) {
      setNotice("登録上限の100件に達しています。");
      return;
    }
    if (customers.some((customer) => customer.email === email)) {
      setNotice("同じメールアドレスはすでに登録されています。");
      return;
    }

    const customer: Customer = {
      id: crypto.randomUUID(),
      name,
      email,
      orderNumber,
      createdAt: new Date().toISOString(),
      status: "未対応",
    };

    setCustomers((current) => [customer, ...current]);
    setSelectedIds((current) => [...current, customer.id]);
    setNotice(`${name}さんを登録し、送信対象に追加しました。`);
    event.currentTarget.reset();
  }

  function toggleCustomer(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id],
    );
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const text = (await file.text()).replace(/^\uFEFF/, "");
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) {
      setNotice("CSVにデータ行がありません。");
      return;
    }

    const headers = parseCsvLine(lines[0]).map((header) =>
      header.toLowerCase(),
    );
    const nameIndex = headers.findIndex((header) =>
      ["name", "customer_name", "購入者名", "氏名", "名前"].includes(header),
    );
    const emailIndex = headers.findIndex((header) =>
      ["email", "メール", "メールアドレス"].includes(header),
    );
    const orderIndex = headers.findIndex((header) =>
      ["order_number", "order", "注文番号"].includes(header),
    );

    if (nameIndex === -1 || emailIndex === -1) {
      setNotice("CSVには「購入者名」と「メールアドレス」の列が必要です。");
      return;
    }

    const existingEmails = new Set(
      customers.map((customer) => customer.email.toLowerCase()),
    );
    const available = MAX_CUSTOMERS - customers.length;
    const imported: Customer[] = [];

    for (const line of lines.slice(1)) {
      if (imported.length >= available) break;
      const values = parseCsvLine(line);
      const name = values[nameIndex]?.trim();
      const email = values[emailIndex]?.trim().toLowerCase();
      if (!name || !email || !email.includes("@") || existingEmails.has(email))
        continue;

      existingEmails.add(email);
      imported.push({
        id: crypto.randomUUID(),
        name,
        email,
        orderNumber: orderIndex >= 0 ? (values[orderIndex]?.trim() ?? "") : "",
        createdAt: new Date().toISOString(),
        status: "未対応",
      });
    }

    setCustomers((current) => [...imported, ...current]);
    setSelectedIds((current) => [
      ...current,
      ...imported.map((customer) => customer.id),
    ]);
    setNotice(
      imported.length
        ? `${imported.length}件をCSVから取り込み、送信対象に追加しました。`
        : "取り込める新しい購入者が見つかりませんでした。",
    );
  }

  function removeCustomer(id: string) {
    setCustomers((current) => current.filter((customer) => customer.id !== id));
    setSelectedIds((current) =>
      current.filter((selectedId) => selectedId !== id),
    );
    setNotice("購入者を削除しました。");
  }

  function updateCustomerStatus(
    id: string,
    status: Customer["status"],
  ) {
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === id ? { ...customer, status } : customer,
      ),
    );
  }

  function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCustomer) return;
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const orderNumber = String(form.get("orderNumber") ?? "").trim();
    if (
      customers.some(
        (customer) =>
          customer.id !== editingCustomer.id && customer.email === email,
      )
    ) {
      setNotice("同じメールアドレスはすでに登録されています。");
      return;
    }
    setCustomers((current) =>
      current.map((customer) =>
        customer.id === editingCustomer.id
          ? { ...customer, name, email, orderNumber }
          : customer,
      ),
    );
    setEditingCustomer(null);
    setNotice("購入者情報を更新しました。");
  }

  function saveTemplate() {
    const name = templateName.trim();
    if (!name || !subject.trim() || !body.trim()) {
      setNotice("テンプレート名、件名、本文を入力してください。");
      return;
    }
    setCustomTemplates((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name,
        subject: subject.trim(),
        body: body.trim(),
      },
    ]);
    setTemplateName("");
    setNotice(`テンプレート「${name}」を保存しました。`);
  }

  function exportHistory() {
    if (!deliveries.length) return;
    const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
    const rows = [
      ["送信日時", "購入者名", "メールアドレス", "件名", "ステータス"],
      ...deliveries.map((delivery) => [
        new Date(delivery.sentAt).toLocaleString("ja-JP"),
        delivery.customerName,
        delivery.email,
        delivery.subject,
        delivery.status,
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(escape).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `mailsend-history-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function simulateSend() {
    if (selectedCustomers.length === 0 || !subject.trim() || !body.trim()) {
      setNotice("宛先、件名、本文をすべて入力してください。");
      return;
    }

    const sentAt = new Date().toISOString();
    const newDeliveries: Delivery[] = selectedCustomers.map((customer) => ({
      id: crypto.randomUUID(),
      customerName: customer.name,
      email: customer.email,
      subject: subject.trim(),
      sentAt,
      status: "送信済み",
    }));

    setDeliveries((current) => [...newDeliveries, ...current]);
    setSelectedIds([]);
    setSubject("");
    setBody("");
    setShowConfirmation(false);
    setNotice(
      `${newDeliveries.length}件を個別送信として記録しました（ローカルシミュレーション）。`,
    );
  }

  const thisMonthCount = deliveries.filter((delivery) => {
    const sentAt = new Date(delivery.sentAt);
    const now = new Date();
    return (
      sentAt.getFullYear() === now.getFullYear() &&
      sentAt.getMonth() === now.getMonth()
    );
  }).length;

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white">
              M
            </div>
            <div>
              <p className="font-bold tracking-tight">MailSend</p>
              <p className="text-xs text-slate-500">購入者メール管理</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <label className="text-xs font-semibold text-slate-500">
              プロジェクト
              <select
                className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-800"
                onChange={(event) => switchProject(event.target.value)}
                value={currentProjectId}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
              onClick={() => setShowProjectForm(true)}
              type="button"
            >
              ＋ 新規
            </button>
            <Link
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              href="/"
            >
              ログアウト
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-indigo-600">DASHBOARD</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              購入者への連絡を、迷わず確実に。
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              「{currentProject.name}」の購入者と配信を管理しています。
            </p>
          </div>
          <div className="inline-flex w-fit rounded-xl bg-slate-200/70 p-1">
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeView === "send"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
              onClick={() => setActiveView("send")}
              type="button"
            >
              送信管理
            </button>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                activeView === "history"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500"
              }`}
              onClick={() => setActiveView("history")}
              type="button"
            >
              配信履歴
            </button>
          </div>
        </div>

        <section className="mt-7 grid gap-4 sm:grid-cols-3">
          <SummaryCard
            label="登録済み購入者"
            note={`上限 ${MAX_CUSTOMERS}件`}
            value={customers.length}
          />
          <SummaryCard
            label="今回の送信対象"
            note="選択中の宛先"
            value={selectedCustomers.length}
          />
          <SummaryCard
            label="今月の送信記録"
            note="ローカル記録"
            value={thisMonthCount}
          />
        </section>

        {notice && (
          <div
            className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900"
            role="status"
          >
            <span>{notice}</span>
            <button
              aria-label="通知を閉じる"
              className="font-bold text-indigo-500"
              onClick={() => setNotice("")}
              type="button"
            >
              ×
            </button>
          </div>
        )}

        {activeView === "send" ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <h2 className="text-lg font-bold">1. 購入者を登録・選択</h2>
                <p className="mt-1 text-sm text-slate-500">
                  メールを送りたい購入者にチェックを入れてください。
                </p>
                <form
                  className="mt-5 grid gap-3 md:grid-cols-3"
                  onSubmit={addCustomer}
                >
                  <input
                    aria-label="購入者名"
                    className="field"
                    name="name"
                    placeholder="購入者名"
                    required
                  />
                  <input
                    aria-label="メールアドレス"
                    className="field"
                    name="email"
                    placeholder="メールアドレス"
                    required
                    type="email"
                  />
                  <div className="flex gap-2">
                    <input
                      aria-label="注文番号"
                      className="field min-w-0"
                      name="orderNumber"
                      placeholder="注文番号（任意）"
                    />
                    <button
                      className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                      disabled={customers.length >= MAX_CUSTOMERS}
                      type="submit"
                    >
                      追加
                    </button>
                  </div>
                </form>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    aria-label="購入者を検索"
                    className="field"
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="名前・メール・注文番号で検索"
                    type="search"
                    value={searchQuery}
                  />
                  <label className="flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50">
                    CSV取り込み
                    <input
                      accept=".csv,text/csv"
                      className="sr-only"
                      onChange={importCsv}
                      type="file"
                    />
                  </label>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  CSV列名：購入者名、メールアドレス、注文番号（任意）
                </p>
              </div>

              <div className="max-h-[440px] overflow-auto">
                {customers.length === 0 ? (
                  <EmptyState
                    description="上のフォームから最初の購入者を登録してください。"
                    title="購入者がまだ登録されていません"
                  />
                ) : (
                  <div className="divide-y divide-slate-100">
                    <div className="flex items-center justify-between bg-slate-50 px-5 py-3 text-xs font-semibold text-slate-500 sm:px-6">
                      <button
                        className="hover:text-indigo-600"
                        onClick={() =>
                          setSelectedIds(
                            filteredCustomers.length > 0 &&
                              filteredCustomers.every((customer) =>
                                selectedIds.includes(customer.id),
                              )
                              ? selectedIds.filter(
                                  (id) =>
                                    !filteredCustomers.some(
                                      (customer) => customer.id === id,
                                    ),
                                )
                              : [
                                  ...new Set([
                                    ...selectedIds,
                                    ...filteredCustomers.map(
                                      (customer) => customer.id,
                                    ),
                                  ]),
                                ],
                          )
                        }
                        type="button"
                      >
                        {filteredCustomers.length > 0 &&
                        filteredCustomers.every((customer) =>
                          selectedIds.includes(customer.id),
                        )
                          ? "すべて解除"
                          : "すべて選択"}
                      </button>
                      <span>
                        {customers.length} / {MAX_CUSTOMERS}件
                      </span>
                    </div>
                    {filteredCustomers.map((customer) => (
                      <div
                        className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50 sm:px-6"
                        key={customer.id}
                      >
                        <input
                          aria-label={`${customer.name}を選択`}
                          checked={selectedIds.includes(customer.id)}
                          className="h-4 w-4 accent-indigo-600"
                          onChange={() => toggleCustomer(customer.id)}
                          type="checkbox"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">{customer.name}</p>
                            {customer.orderNumber && (
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                                {customer.orderNumber}
                              </span>
                            )}
                          </div>
                          <p className="truncate text-sm text-slate-500">
                            {customer.email}
                          </p>
                        </div>
                        <select
                          aria-label={`${customer.name}の対応状況`}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-600"
                          onChange={(event) =>
                            updateCustomerStatus(
                              customer.id,
                              event.target.value as Customer["status"],
                            )
                          }
                          value={customer.status ?? "未対応"}
                        >
                          <option>未対応</option>
                          <option>対応中</option>
                          <option>完了</option>
                        </select>
                        <button
                          aria-label={`${customer.name}を編集`}
                          className="rounded-lg px-2 py-1 text-sm text-slate-500 hover:bg-indigo-50 hover:text-indigo-600"
                          onClick={() => setEditingCustomer(customer)}
                          type="button"
                        >
                          編集
                        </button>
                        <button
                          aria-label={`${customer.name}を削除`}
                          className="rounded-lg px-2 py-1 text-sm text-slate-400 hover:bg-red-50 hover:text-red-600"
                          onClick={() => removeCustomer(customer.id)}
                          type="button"
                        >
                          削除
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h2 className="text-lg font-bold">2. メールを作成</h2>
              <p className="mt-1 text-sm text-slate-500">
                選択した{selectedCustomers.length}件へ、同じ内容を個別送信します。
              </p>
              <div className="mt-5 space-y-4">
                <label className="block text-sm font-semibold">
                  テンプレート
                  <select
                    className="field mt-2"
                    value=""
                    onChange={(event) => {
                      const template = allTemplates.find(
                        (item) => item.id === event.target.value,
                      );
                      if (!template) return;
                      setSubject(template.subject);
                      setBody(template.body);
                    }}
                  >
                    {allTemplates.map((template) => (
                      <option key={template.id || "empty"} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  件名
                  <input
                    className="field mt-2"
                    onChange={(event) => setSubject(event.target.value)}
                    placeholder="ご購入ありがとうございます"
                    value={subject}
                  />
                </label>
                <label className="block text-sm font-semibold">
                  本文
                  <textarea
                    className="field mt-2 min-h-56 resize-y leading-7"
                    onChange={(event) => setBody(event.target.value)}
                    placeholder={
                      "〇〇様\n\nこのたびは商品をご購入いただき、ありがとうございます。"
                    }
                    value={body}
                  />
                </label>
              </div>
              <p className="mt-3 text-xs leading-5 text-slate-500">
                差し込み変数：{"{{customer_name}}"}、{"{{order_number}}"}
              </p>
              <div className="mt-4 flex gap-2">
                <input
                  aria-label="保存するテンプレート名"
                  className="field min-w-0"
                  onChange={(event) => setTemplateName(event.target.value)}
                  placeholder="現在の内容をテンプレートとして保存"
                  value={templateName}
                />
                <button
                  className="shrink-0 rounded-xl border border-slate-300 px-4 text-sm font-bold hover:bg-slate-50"
                  onClick={saveTemplate}
                  type="button"
                >
                  保存
                </button>
              </div>
              {customTemplates.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {customTemplates.map((template) => (
                    <button
                      className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-red-50 hover:text-red-600"
                      key={template.id}
                      onClick={() =>
                        setCustomTemplates((current) =>
                          current.filter((item) => item.id !== template.id),
                        )
                      }
                      title="クリックして削除"
                      type="button"
                    >
                      {template.name} ×
                    </button>
                  ))}
                </div>
              )}
              {selectedCustomers[0] && body && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-500">
                    {selectedCustomers[0].name}さんへのプレビュー
                  </p>
                  <p className="mt-2 text-sm font-bold">
                    {personalize(subject, selectedCustomers[0])}
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">
                    {personalize(body, selectedCustomers[0])}
                  </p>
                </div>
              )}
              <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
                現在はローカル動作です。実際のメールは送信されず、送信結果のみブラウザに保存されます。
              </div>
              <button
                className="mt-5 w-full rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                disabled={
                  selectedCustomers.length === 0 ||
                  !subject.trim() ||
                  !body.trim()
                }
                onClick={() => setShowConfirmation(true)}
                type="button"
              >
                {selectedCustomers.length}件を個別送信として記録
              </button>
            </section>
          </div>
        ) : (
          <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
              <div>
                <h2 className="text-lg font-bold">配信履歴</h2>
                <p className="mt-1 text-sm text-slate-500">
                  このブラウザで記録した個別送信の履歴です。
                </p>
              </div>
              <button
                className="shrink-0 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!deliveries.length}
                onClick={exportHistory}
                type="button"
              >
                CSV出力
              </button>
            </div>
            {deliveries.length === 0 ? (
              <EmptyState
                description="メールを送信として記録すると、ここに履歴が表示されます。"
                title="配信履歴はまだありません"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-semibold">送信日時</th>
                      <th className="px-6 py-3 font-semibold">購入者</th>
                      <th className="px-6 py-3 font-semibold">件名</th>
                      <th className="px-6 py-3 font-semibold">ステータス</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {deliveries.map((delivery) => (
                      <tr key={delivery.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                          {new Intl.DateTimeFormat("ja-JP", {
                            dateStyle: "short",
                            timeStyle: "short",
                          }).format(new Date(delivery.sentAt))}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-semibold">{delivery.customerName}</p>
                          <p className="text-xs text-slate-500">
                            {delivery.email}
                          </p>
                        </td>
                        <td className="max-w-xs truncate px-6 py-4">
                          {delivery.subject}
                        </td>
                        <td className="px-6 py-4">
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                            {delivery.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
      {showConfirmation && (
        <div
          aria-labelledby="confirmation-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5"
          role="dialog"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <p className="text-sm font-bold text-indigo-600">FINAL CHECK</p>
            <h2 className="mt-1 text-xl font-bold" id="confirmation-title">
              個別送信を記録しますか？
            </h2>
            <dl className="mt-5 grid grid-cols-[7rem_1fr] gap-y-3 rounded-xl bg-slate-50 p-4 text-sm">
              <dt className="text-slate-500">宛先</dt>
              <dd className="font-bold">{selectedCustomers.length}件</dd>
              <dt className="text-slate-500">件名</dt>
              <dd className="font-bold">{subject}</dd>
              <dt className="text-slate-500">方式</dt>
              <dd className="font-bold">宛先ごとの個別送信</dd>
            </dl>
            <p className="mt-4 text-xs leading-5 text-amber-800">
              ローカルシミュレーションのため、実際のメールは送信されません。
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"
                onClick={() => setShowConfirmation(false)}
                type="button"
              >
                戻る
              </button>
              <button
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-700"
                onClick={simulateSend}
                type="button"
              >
                {selectedCustomers.length}件を記録
              </button>
            </div>
          </div>
        </div>
      )}
      {editingCustomer && (
        <div
          aria-labelledby="edit-customer-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5"
          role="dialog"
        >
          <form
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onSubmit={saveCustomer}
          >
            <h2 className="text-xl font-bold" id="edit-customer-title">
              購入者情報を編集
            </h2>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold">
                購入者名
                <input
                  className="field mt-2"
                  defaultValue={editingCustomer.name}
                  name="name"
                  required
                />
              </label>
              <label className="block text-sm font-semibold">
                メールアドレス
                <input
                  className="field mt-2"
                  defaultValue={editingCustomer.email}
                  name="email"
                  required
                  type="email"
                />
              </label>
              <label className="block text-sm font-semibold">
                注文番号
                <input
                  className="field mt-2"
                  defaultValue={editingCustomer.orderNumber}
                  name="orderNumber"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"
                onClick={() => setEditingCustomer(null)}
                type="button"
              >
                キャンセル
              </button>
              <button
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white"
                type="submit"
              >
                更新
              </button>
            </div>
          </form>
        </div>
      )}
      {showProjectForm && (
        <div
          aria-labelledby="new-project-title"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5"
          role="dialog"
        >
          <form
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onSubmit={createProject}
          >
            <p className="text-sm font-bold text-indigo-600">NEW PROJECT</p>
            <h2 className="mt-1 text-xl font-bold" id="new-project-title">
              プロジェクトを作成
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              購入者、テンプレート、下書き、配信履歴はプロジェクトごとに分けて保存されます。
            </p>
            <label className="mt-5 block text-sm font-semibold">
              プロジェクト名
              <input
                autoFocus
                className="field mt-2"
                onChange={(event) => setNewProjectName(event.target.value)}
                placeholder="例：2026年夏キャンペーン"
                required
                value={newProjectName}
              />
            </label>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"
                onClick={() => setShowProjectForm(false)}
                type="button"
              >
                キャンセル
              </button>
              <button
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-bold text-white"
                type="submit"
              >
                作成して切り替え
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

function SummaryCard({
  label,
  note,
  value,
}: {
  label: string;
  note: string;
  value: number;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
        <p className="text-xs text-slate-400">{note}</p>
      </div>
    </article>
  );
}

function EmptyState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-xl">
        ✉
      </div>
      <h3 className="mt-4 font-bold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}
