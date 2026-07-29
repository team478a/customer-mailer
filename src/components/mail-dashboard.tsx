"use client";

import { MailComposer } from "@/features/composer/ui/mail-composer";
import { ConfirmationDialog } from "@/features/composer/ui/confirmation-dialog";
import { MAX_CUSTOMERS } from "@/features/customers/domain/customer";
import { CsvImportPanel } from "@/features/customers/ui/csv-import-panel";
import { CustomerDialog } from "@/features/customers/ui/customer-dialog";
import { CustomerForm } from "@/features/customers/ui/customer-form";
import { CustomerList } from "@/features/customers/ui/customer-list";
import { RecipientSelector } from "@/features/customers/ui/recipient-selector";
import { useMailDashboard } from "@/features/dashboard/application/use-mail-dashboard";
import { DashboardHeader } from "@/features/dashboard/ui/dashboard-header";
import { SummaryCards } from "@/features/dashboard/ui/summary-cards";
import { DeliveryHistory } from "@/features/deliveries/ui/delivery-history";
import { ProjectDialog } from "@/features/projects/ui/project-dialog";
import { ProjectSelector } from "@/features/projects/ui/project-selector";

export function MailDashboard() {
  const dashboard = useMailDashboard();

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-slate-900">
      <DashboardHeader>
        <ProjectSelector
          currentProjectId={dashboard.currentProjectId}
          onCreate={() => dashboard.setShowProjectForm(true)}
          onSelect={dashboard.switchProject}
          projects={dashboard.projects}
        />
      </DashboardHeader>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold text-indigo-600">DASHBOARD</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              購入者への連絡を、迷わず確実に。
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              「{dashboard.currentProject.name}」の購入者と配信を管理しています。
            </p>
          </div>
          <div className="inline-flex w-fit rounded-xl bg-slate-200/70 p-1">
            {(["send", "history"] as const).map((view) => (
              <button
                className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                  dashboard.activeView === view
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
                key={view}
                onClick={() => dashboard.setActiveView(view)}
                type="button"
              >
                {view === "send" ? "送信管理" : "配信履歴"}
              </button>
            ))}
          </div>
        </div>

        <SummaryCards
          customerCount={dashboard.customers.length}
          monthlyDeliveryCount={dashboard.monthlyDeliveryCount}
          recipientCount={dashboard.selectedCustomers.length}
        />

        {dashboard.notice && (
          <div
            className="mt-5 flex justify-between gap-4 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-900"
            role="status"
          >
            <span>{dashboard.notice}</span>
            <button onClick={dashboard.closeNotice} type="button">
              ×
            </button>
          </div>
        )}

        {dashboard.activeView === "send" ? (
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <h2 className="text-lg font-bold">1. 購入者を登録・選択</h2>
                <p className="mt-1 text-sm text-slate-500">
                  メールを送りたい購入者にチェックを入れてください。
                </p>
                <CustomerForm
                  disabled={dashboard.customers.length >= MAX_CUSTOMERS}
                  onSubmit={dashboard.addCustomer}
                />
                <CsvImportPanel
                  onImport={dashboard.importCsv}
                  onSearch={dashboard.setSearchQuery}
                  searchQuery={dashboard.searchQuery}
                />
              </div>
              <div className="max-h-[440px] overflow-auto">
                <RecipientSelector
                  customers={dashboard.filteredCustomers}
                  onToggleAll={dashboard.toggleAllRecipients}
                  selectedIds={dashboard.selectedIds}
                />
                <CustomerList
                  customers={dashboard.filteredCustomers}
                  onEdit={dashboard.setEditingCustomer}
                  onRemove={dashboard.removeCustomer}
                  onStatusChange={dashboard.changeStatus}
                  onToggle={dashboard.toggleRecipient}
                  selectedIds={dashboard.selectedIds}
                />
              </div>
            </section>

            <MailComposer
              body={dashboard.body}
              customTemplates={dashboard.customTemplates}
              onBodyChange={dashboard.setBody}
              onConfirm={() => dashboard.setShowConfirmation(true)}
              onDeleteTemplate={dashboard.deleteTemplate}
              onSaveTemplate={dashboard.saveTemplate}
              onSubjectChange={dashboard.setSubject}
              onTemplateApply={(template) => {
                dashboard.setSubject(template.subject);
                dashboard.setBody(template.body);
              }}
              onTemplateNameChange={dashboard.setTemplateName}
              recipient={dashboard.selectedCustomers[0]}
              recipientCount={dashboard.selectedCustomers.length}
              subject={dashboard.subject}
              templateName={dashboard.templateName}
              templates={dashboard.templates}
            />
          </div>
        ) : (
          <DeliveryHistory
            deliveries={dashboard.deliveries}
            isRetrying={dashboard.isRetrying}
            onExport={dashboard.exportHistory}
            onRetry={dashboard.retryFailed}
            onToggleAllFailures={dashboard.toggleAllFailures}
            onToggleFailure={dashboard.toggleFailure}
            selectedFailureIds={dashboard.selectedFailureIds}
          />
        )}
      </div>

      {dashboard.showConfirmation && (
        <ConfirmationDialog
          count={dashboard.selectedCustomers.length}
          isSending={dashboard.isSending}
          onCancel={() => dashboard.setShowConfirmation(false)}
          onConfirm={dashboard.simulateSend}
          subject={dashboard.subject}
        />
      )}
      {dashboard.editingCustomer && (
        <CustomerDialog
          customer={dashboard.editingCustomer}
          onCancel={() => dashboard.setEditingCustomer(null)}
          onSubmit={dashboard.saveCustomer}
        />
      )}
      {dashboard.showProjectForm && (
        <ProjectDialog
          name={dashboard.newProjectName}
          onCancel={() => dashboard.setShowProjectForm(false)}
          onNameChange={dashboard.setNewProjectName}
          onSubmit={dashboard.createProject}
        />
      )}
    </main>
  );
}
