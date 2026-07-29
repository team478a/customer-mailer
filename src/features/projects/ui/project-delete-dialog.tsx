export function ProjectDeleteDialog({
  name,
  onCancel,
  onConfirm,
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-5"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <p className="text-sm font-bold text-red-600">DELETE PROJECT</p>
        <h2 className="mt-1 text-xl font-bold">「{name}」を削除しますか？</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          顧客、テンプレート、下書き、配信履歴、設定がすべて削除されます。必要な場合は先にJSONバックアップを出力してください。
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold"
            onClick={onCancel}
            type="button"
          >
            キャンセル
          </button>
          <button
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white"
            onClick={onConfirm}
            type="button"
          >
            完全に削除
          </button>
        </div>
      </div>
    </div>
  );
}
