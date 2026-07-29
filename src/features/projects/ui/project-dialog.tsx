import { FormEvent } from "react";

export function ProjectDialog({
  name,
  onCancel,
  onNameChange,
  onSubmit,
}: {
  name: string;
  onCancel: () => void;
  onNameChange: (name: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div
      aria-labelledby="new-project-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5"
      role="dialog"
    >
      <form
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onSubmit={onSubmit}
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
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="例：2026年夏キャンペーン"
            required
            value={name}
          />
        </label>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"
            onClick={onCancel}
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
  );
}
