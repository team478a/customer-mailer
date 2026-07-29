import { ChangeEvent } from "react";

export function ProjectManagementPanel({
  canDelete,
  name,
  onDelete,
  onExport,
  onImport,
  onNameChange,
  onRename,
}: {
  canDelete: boolean;
  name: string;
  onDelete: () => void;
  onExport: () => void;
  onImport: (event: ChangeEvent<HTMLInputElement>) => void;
  onNameChange: (name: string) => void;
  onRename: () => void;
}) {
  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-sm font-bold text-indigo-600">PROJECT MANAGEMENT</p>
      <h2 className="mt-1 text-xl font-bold">プロジェクト管理</h2>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <label className="block text-sm font-semibold">
            プロジェクト名
            <div className="mt-2 flex gap-2">
              <input
                className="field"
                onChange={(event) => onNameChange(event.target.value)}
                value={name}
              />
              <button
                className="shrink-0 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white"
                onClick={onRename}
                type="button"
              >
                変更
              </button>
            </div>
          </label>
        </div>
        <div>
          <p className="text-sm font-semibold">バックアップ</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            顧客、テンプレート、下書き、配信履歴、通常設定をJSONで保存・復元します。APIキーは含みません。
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"
              onClick={onExport}
              type="button"
            >
              JSONを出力
            </button>
            <label className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold">
              JSONから復元
              <input
                accept=".json,application/json"
                className="sr-only"
                onChange={onImport}
                type="file"
              />
            </label>
          </div>
        </div>
      </div>
      <div className="mt-6 border-t border-slate-100 pt-5">
        <button
          className="rounded-xl border border-red-300 px-4 py-2 text-sm font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!canDelete}
          onClick={onDelete}
          type="button"
        >
          このプロジェクトを削除
        </button>
        {!canDelete && (
          <p className="mt-2 text-xs text-slate-400">
            最後のプロジェクトは削除できません。
          </p>
        )}
      </div>
    </section>
  );
}
