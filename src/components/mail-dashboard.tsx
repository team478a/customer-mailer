"use client";

import { MailComposer } from "@/features/composer/ui/mail-composer";
import { ConfirmationDialog } from "@/features/composer/ui/confirmation-dialog";
import { MAX_CUSTOMERS } from "@/features/customers/domain/customer";
import { CsvImportPanel } from "@/features/customers/ui/csv-import-panel";
import { CsvErrorDialog } from "@/features/customers/ui/csv-error-dialog";
import { CustomerDialog } from "@/features/customers/ui/customer-dialog";
import { CustomerForm } from "@/features/customers/ui/customer-form";
import { CustomerList } from "@/features/customers/ui/customer-list";
import { RecipientSelector } from "@/features/customers/ui/recipient-selector";
import { useMailDashboard } from "@/features/dashboard/application/use-mail-dashboard";
import { DashboardHeader } from "@/features/dashboard/ui/dashboard-header";
import { SummaryCards } from "@/features/dashboard/ui/summary-cards";
import { DeliveryHistory } from "@/features/deliveries/ui/delivery-history";
import { RetryConfirmationDialog } from "@/features/deliveries/ui/retry-confirmation-dialog";
import { ProjectDialog } from "@/features/projects/ui/project-dialog";
import { ProjectDeleteDialog } from "@/features/projects/ui/project-delete-dialog";
import { ProjectManagementPanel } from "@/features/projects/ui/project-management-panel";
import { ProjectSelector } from "@/features/projects/ui/project-selector";
import { SettingsPanel } from "@/features/settings/ui/settings-panel";
import { SuppressionPanel } from "@/features/suppressions/ui/suppression-panel";
import { DataSyncPanel } from "@/features/storage/ui/data-sync-panel";

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
            {(["send", "history", "settings"] as const).map((view) => (
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
                {view === "send"
                  ? "送信管理"
                  : view === "history"
                    ? "配信履歴"
                    : "設定"}
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

        {dashboard.activeView === "send" && (
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
                  onBulkDelete={dashboard.bulkDeleteCustomers}
                  onBulkStatus={dashboard.bulkChangeStatus}
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
        )}
        {dashboard.activeView === "history" && (
          <DeliveryHistory
            batches={dashboard.deliveryBatches}
            deliveries={dashboard.deliveries}
            isRetrying={dashboard.isRetrying}
            isRefreshing={dashboard.isHistoryRefreshing}
            onExport={dashboard.exportHistory}
            onRefresh={dashboard.refreshDeliveryHistory}
            onRetry={() => dashboard.setShowRetryConfirmation(true)}
            onToggleAllFailures={dashboard.toggleAllFailures}
            onToggleFailure={dashboard.toggleFailure}
            selectedFailureIds={dashboard.selectedFailureIds}
          />
        )}
        {dashboard.activeView === "settings" && (
          <>
            <DataSyncPanel
              customerCount={dashboard.customers.length}
              dataMode={dashboard.dataMode}
              isBusy={dashboard.isDataBusy}
              onMigrate={dashboard.migrateToSupabase}
              saveStatus={dashboard.remoteSaveStatus}
              serverAvailable={dashboard.serverAvailable}
            />
            <ProjectManagementPanel
              canDelete={dashboard.projects.length > 1}
              name={dashboard.projectNameDraft}
              onDelete={() => dashboard.setShowProjectDelete(true)}
              onExport={dashboard.exportProjectBackup}
              onImport={dashboard.importProjectBackup}
              onNameChange={dashboard.setProjectNameDraft}
              onRename={dashboard.renameProject}
            />
            <SettingsPanel
              isDirty={dashboard.settingsDirty}
              onReset={dashboard.resetSettings}
              onSave={dashboard.saveSettings}
              onSecretsChange={dashboard.setSecrets}
              onSettingsChange={dashboard.setSettings}
              secrets={dashboard.secrets}
              settings={dashboard.settings}
              resendConfigured={dashboard.resendConfigured}
              webhookConfigured={dashboard.webhookConfigured}
            />
            <SuppressionPanel
              entries={dashboard.suppressions}
              onAdd={dashboard.addSuppression}
              onRemove={dashboard.removeSuppression}
            />
          </>
        )}
      </div>

      {dashboard.showConfirmation && (
        <ConfirmationDialog
          count={dashboard.selectedCustomers.length}
          isSending={dashboard.isSending}
          onCancel={() => dashboard.setShowConfirmation(false)}
          onConfirm={dashboard.simulateSend}
          subject={dashboard.subject}
          errors={dashboard.preflight.errors}
          warnings={dashboard.preflight.warnings}
          excludedCount={dashboard.preflight.excludedCustomers.length}
          previews={dashboard.preflight.previews}
          isLive={
            dashboard.settings.mailProvider === "resend" &&
            !dashboard.settings.testMode
          }
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
      {dashboard.showRetryConfirmation && (
        <RetryConfirmationDialog
          deliveries={dashboard.selectedFailedDeliveries}
          isRetrying={dashboard.isRetrying}
          onCancel={() => dashboard.setShowRetryConfirmation(false)}
          onConfirm={dashboard.retryFailed}
        />
      )}
      {dashboard.showProjectDelete && (
        <ProjectDeleteDialog
          name={dashboard.currentProject.name}
          onCancel={() => dashboard.setShowProjectDelete(false)}
          onConfirm={dashboard.deleteCurrentProject}
        />
      )}
      {dashboard.csvErrors.length > 0 && (
        <CsvErrorDialog
          errors={dashboard.csvErrors}
          onClose={dashboard.clearCsvErrors}
          onExport={dashboard.exportCsvErrors}
        />
      )}
    </main>
  );
}
