import { MailTemplate } from "../domain/mail-template";

export function TemplateManager({
  customTemplates,
  name,
  onApply,
  onDelete,
  onNameChange,
  onSave,
  templates,
}: {
  customTemplates: MailTemplate[];
  name: string;
  onApply: (template: MailTemplate) => void;
  onDelete: (id: string) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  templates: MailTemplate[];
}) {
  return (
    <>
      <label className="block text-sm font-semibold">
        テンプレート
        <select
          className="field mt-2"
          value=""
          onChange={(event) => {
            const template = templates.find(
              (item) => item.id === event.target.value,
            );
            if (template) onApply(template);
          }}
        >
          {templates.map((template) => (
            <option key={template.id || "empty"} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex gap-2">
        <input
          aria-label="保存するテンプレート名"
          className="field min-w-0"
          onChange={(event) => onNameChange(event.target.value)}
          placeholder="現在の内容をテンプレートとして保存"
          value={name}
        />
        <button
          className="shrink-0 rounded-xl border border-slate-300 px-4 text-sm font-bold hover:bg-slate-50"
          onClick={onSave}
          type="button"
        >
          保存
        </button>
      </div>
      {customTemplates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customTemplates.map((template) => (
            <button
              className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-red-50 hover:text-red-600"
              key={template.id}
              onClick={() => onDelete(template.id)}
              title="クリックして削除"
              type="button"
            >
              {template.name} ×
            </button>
          ))}
        </div>
      )}
    </>
  );
}
