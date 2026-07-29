import { Customer } from "../../customers/domain/customer";
import { MailTemplate } from "../../templates/domain/mail-template";
import { TemplateManager } from "../../templates/ui/template-manager";
import { personalize } from "../application/composer";

export function MailComposer({
  body,
  customTemplates,
  onBodyChange,
  onConfirm,
  onDeleteTemplate,
  onTemplateNameChange,
  onSaveTemplate,
  onSubjectChange,
  onTemplateApply,
  recipient,
  recipientCount,
  subject,
  templateName,
  templates,
}: {
  body: string;
  customTemplates: MailTemplate[];
  onBodyChange: (value: string) => void;
  onConfirm: () => void;
  onDeleteTemplate: (id: string) => void;
  onTemplateNameChange: (value: string) => void;
  onSaveTemplate: () => void;
  onSubjectChange: (value: string) => void;
  onTemplateApply: (template: MailTemplate) => void;
  recipient?: Customer;
  recipientCount: number;
  subject: string;
  templateName: string;
  templates: MailTemplate[];
}) {
  return (
    <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold">2. メールを作成</h2>
      <p className="mt-1 text-sm text-slate-500">
        選択した{recipientCount}件へ、同じ内容を個別送信します。
      </p>
      <div className="mt-5 space-y-4">
        <TemplateManager
          customTemplates={customTemplates}
          name={templateName}
          onApply={onTemplateApply}
          onDelete={onDeleteTemplate}
          onNameChange={onTemplateNameChange}
          onSave={onSaveTemplate}
          templates={templates}
        />
        <label className="block text-sm font-semibold">
          件名
          <input
            className="field mt-2"
            onChange={(event) => onSubjectChange(event.target.value)}
            placeholder="ご購入ありがとうございます"
            value={subject}
          />
        </label>
        <label className="block text-sm font-semibold">
          本文
          <textarea
            className="field mt-2 min-h-56 resize-y leading-7"
            onChange={(event) => onBodyChange(event.target.value)}
            placeholder="〇〇様&#10;&#10;このたびは商品をご購入いただき、ありがとうございます。"
            value={body}
          />
        </label>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        差し込み変数：{"{{customer_name}}"}、{"{{order_number}}"}
      </p>
      {recipient && body && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-500">
            {recipient.name}さんへのプレビュー
          </p>
          <p className="mt-2 text-sm font-bold">
            {personalize(subject, recipient)}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">
            {personalize(body, recipient)}
          </p>
        </div>
      )}
      <div className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
        現在はローカル動作です。実際のメールは送信されません。
      </div>
      <button
        className="mt-5 w-full rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        disabled={!recipientCount || !subject.trim() || !body.trim()}
        onClick={onConfirm}
        type="button"
      >
        {recipientCount}件を個別送信として記録
      </button>
    </section>
  );
}
